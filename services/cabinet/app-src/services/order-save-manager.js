
const du = require('../../../../public/js/utils/dom-utils.js');
const CustomEvent = require('../../../../public/js/utils/custom-event');
const AutoSave = require('../../../../public/js/utils/local-file/auto-save');
const Navigator = require('../../../../public/js/utils/local-file/navigator');
const Imposter = require('../../../../public/js/utils/object/imposter');

const isDir = Navigator.isDirectory;
const autoSavers = {};

class OrderSaveManager {
  constructor(contentFunc, initialOrderName, initialVersionId) {
    if ((typeof contentFunc) !== 'function') throw new Error('Must give a content function or else whats the point?');
    let cabinetConfig, propertyConfig, costConfig;
    let workingDir, ordersDir;
    let orderDirectories = {};
    let activeOrderDir, activeVersion;
    let orderVersionObj = {};
    let counter = 0;
    let autoSaveOn = null;
    const instance = this;
    let autoSaver;

    const loadingEvent = new CustomEvent('loading');
    const loadedEvent = new CustomEvent('loaded');
    const savingEvent = new CustomEvent('saving');
    const savedEvent = new CustomEvent('saved');
    const fileSystemChangeEvent = new CustomEvent('fileSystemChange');
    const versionChangeEvent = new CustomEvent('versionChange');
    this.onLoading = loadingEvent.on;
    this.onLoaded = loadedEvent.on;
    this.onSaving = savingEvent.on;
    this.onSaved = savedEvent.on;
    this.onFileSystemChange = fileSystemChangeEvent.on;
    this.onVersionChange = versionChangeEvent.on;

    const jsonRegEx = /^(.{1,})\.json$/;
    const clean = (jsonName) => jsonName.replace(jsonRegEx, '$1');
    const format = (jsonName) => jsonName.replace(jsonRegEx, '$1') + '.json';
    const activeOrderName = () => activeOrderDir && activeOrderDir.name;
    const activeVersionId = () => activeVersion && clean(activeVersion.name);
    const alreadyActive = (orderName, versionId) => orderName === activeOrderName() &&
                          activeVersion && format(versionId) === activeVersion.name;

    this.on = (bool) => {
      const on = bool !== undefined ?  bool : autoSaveOn;
      if (on !== autoSaveOn) {
        autoSaveOn = on;
        if (autoSaveOn) autoSave();
      }
      return autoSaveOn;
    }
    this.undefinedVersion = (orderName, versionId) => {
      const versions = orderVersionObj[orderName];
      if (versions.indexOf(clean(versionId)) === -1) return versionId;
      let count = 1;
      while (versions.indexOf(clean(`${versionId}-${count}`)) !== -1) count++;
      return `${versionId}-${count}`;
    }
    this.remove = (orderName) => {
      ordersDir.removeEntry(orderName);
      delete orderVersionObj[orderName];
    }
    this.toggle = () => this.on(!autoSaveOn);
    this.open = async (orderName, versionId) => {
      if (!versionId && orderVersionObj[orderName].length === 1)
        versionId = orderVersionObj[orderName][0]
      orderName = orderName.replace(/\//g, '-');
      versionId = versionId.replace(/\//g, '-');
      if (orderVersionObj[orderName] === undefined) orderVersionObj[orderName] = [];
      if (orderVersionObj[orderName].indexOf(versionId) === -1) orderVersionObj[orderName].push(versionId);
      const orderDirectoryHandle =
        await ordersDir.getDirectoryHandle(orderName, {create: true});
      const versionFileHandle =
        await orderDirectoryHandle.getFileHandle(format(versionId), {create: true});

      return {orderDirectoryHandle, versionFileHandle};
    }
    this.state = (orderName, versionId) => {
      if (!orderName) return 'invalid';
      if (orderVersionObj[orderName] === undefined) return 'new order';
      const isActiveOrder = orderName === this.activeOrderName();
      const onlyOneVersion = orderVersionObj[orderName].length === 1;
      if (isActiveOrder) {
        const isActiveVersion = onlyOneVersion || versionId === this.activeVersionId();
        if (isActiveVersion) return 'active'
        else if (!versionId) return 'invalid';
        else if (orderVersionObj[orderName].indexOf(versionId) !== -1) return 'switch version';
        else return 'new version';
      }
      if (onlyOneVersion) return 'switch order'
      if (!versionId) return 'invalid';
      if (orderVersionObj[orderName].indexOf(versionId) === -1) return 'new version';
      return  'switch order';
    }

    this.activeOrderName = activeOrderName;
    this.activeVersionId = activeVersionId;
    this.orderNames = () => Object.keys(orderVersionObj);
    this.versionIds = (orderName) => orderVersionObj[orderName];
    this.save = async function (orderName, versionId, data) {
      data ||= contentFunc();
      let version = activeVersion;
      const argsDefined = orderName && versionId && data;
      if (argsDefined) version = (await this.open(orderName, versionId)).versionFileHandle;
      if (version) {
        counter++;
        savingEvent.trigger(null, this);
        const writable = await version.createWritable();
        if ((data instanceof Object)) data = JSON.stringify(data, null, 2);
        await writable.write({type: 'write', data});
        await writable.close();
        savedEvent.trigger(null, this);
      }
    }

    this.read = async (fileHandle) => {
      const autoSave = await getAutoSaver(fileHandle);
      const contents = await Navigator.read(fileHandle);
    }

    this.switch = async function (orderName, versionId) {
      const opened = await this.open(orderName, versionId);
      activeOrderDir = opened.orderDirectoryHandle;
      orderName = activeOrderDir.name;
      activeVersion = opened.versionFileHandle;
      versionId = clean(activeVersion.name);
      const contents = await Navigator.read(versionHandle || activeVersion);
      versionChangeEvent.trigger(null, {orderName, versionId, contents});
      return contents;
    }

    let saveCount = 0;
    function autoSave() {
      if (autoSaveOn) {
        setTimeout(autoSave, 10000);
        instance.save();
      }
    }

    async function versionList(orderHandler, nameOnly) {
      const orderName = orderHandler.name;
      const versions = await orderHandler.values();
      const list = [];
      let next;
      do {
        next = await versions.next();
        if (!orderVersionObj[orderName]) orderVersionObj[orderName] = [];
        if (next.value) {
          const value = nameOnly ? clean(next.value.name) : next.value;
          list.push(value);
        }
      } while (!next.done)
      return list;
    }

    async function changeOrderName(newOrderName) {
      const versionHandlers = await versionList(activeOrderDir);
      for (let index = 0; index < versionHandlers.length; index++) {
        const vHandle = versionHandlers[index];
        const contents = await Navigator.read(vHandle);
        const vId = vHandle.name;
        await this.save(newOrderName, vId, contents);
        await activeOrderDir.removeEntry(format(vId));
      }
      this.remove(activeOrderName());
      this.switch(newOrderName, activeVersionId());
    }
    this.changeOrderName = changeOrderName;

    let initialized = false;
    this.initialized = () => initialized;
    async function init() {
      await Navigator.init();
      const navH = Navigator.helper();
      let orderHelper = await navH.getDirectory('orders', true);
      let orderHelpers = await orderHelper.ls();
      // const orderDir = Navigator.getDirectory('orders');
      // autoSaver = new AutoSave('orders');
      // orderDir = await autoSave.workingDir()
      // loadingEvent.trigger(null, instance);
      // const orders = await Navigator.ls(ordersDir);
      // orders.forEach((orderHandler) => {
      //   const versions = Navigator.ls(orderHandler, null, isDir);
      //   orderVersionObj[orderHandler.name] = versions.map(vh => vh.name);
      // });
      //
      // await instance.switch(initialOrderName, initialVersionId);
      // const text = await Navigator.read(versionHandle || activeVersion);
      // loadedEvent.trigger(null, instance);
      // fileSystemChangeEvent.trigger(null, instance);
      // autoSaveOn = true;
      // initialized = true;
      // autoSave();
    }
    this.init = init;
  }
}

module.exports = OrderSaveManager;
