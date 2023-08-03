
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

    const pathReg = /^.*\/([^/]{1,})\/([^/]{1,})(\/|)$/;
    const activeOrderName = () => autoSaver && autoSaver.directoryName();
    const activeVersionId = () => autoSaver && autoSaver.name();
    const alreadyActive = (orderName, versionId) => orderName === activeOrderName() &&
                          activeVersion && versionId === activeVersion.name();

    this.undefinedVersion = (orderName, versionId) => {
      const versions = orderVersionObj[orderName];
      if (versions.indexOf(versionId) === -1) return versionId;
      let count = 1;
      while (versions.indexOf(`${versionId}-${count}`) !== -1) count++;
      return `${versionId}-${count}`;
    }
    this.remove = (orderName) => {
      ordersDir.removeEntry(orderName);
      delete orderVersionObj[orderName];
    }
    this.on_off_toggle = (true_false_undefined) => {
      if (autoSaver) {
        autoSaveOn = autoSaver.on_off_toggle(true_false_undefined);
      } else {
        autoSaveOn = true_false_undefined;
      }
      return autoSaveOn;
    }
    this.open = async (orderName, versionId) => {
      if (!((typeof orderName) === 'string') || orderName === '') throw new Error('orderName must be a non-empty Stirng');
      if (!versionId && orderVersionObj[orderName].length === 1) versionId = orderVersionObj[orderName][0]
      versionId ||= 'original';
      orderName = orderName.replace(/\//g, '-');
      versionId = versionId.replace(/\//g, '-');
      if (orderVersionObj[orderName] === undefined) orderVersionObj[orderName] = [];
      if (orderVersionObj[orderName].indexOf(versionId) === -1) orderVersionObj[orderName].push(versionId);
      const orderDirectoryHandle =
        await ordersDir.getDirectory(orderName, true);
      const versionFileHandle =
        await orderDirectoryHandle.getDirectory(versionId, true);

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
      let autoS = autoSaver;
      const argsDefined = orderName && versionId && data;
      if (argsDefined) autoS = (await getAutoSaver(orderName, versionId));
      if (autoS) {
        counter++;
        savingEvent.trigger(null, this);
        await autoS.save();
        savedEvent.trigger(null, this);
      }
    }

    this.read = async (fileHandle) => {
      const contents = await autoSaver.read();
      return contents;
    }

    const autoSaverKey = (orderName, versionId) => `${orderName}/${versionId}`;
    const autoSavers = {};
    async function getAutoSaver(orderName, versionId) {
      let askey = autoSaverKey(orderName, versionId);
      if (autoSavers[askey]) return autoSavers[askey];
      const opened = await instance.open(orderName, versionId);
      activeOrderDir = opened.orderDirectoryHandle;
      activeVersion = opened.versionFileHandle;
      versionId = activeVersion.name();
      if (autoSavers[askey]) return autoSavers[askey];
      autoSavers[askey] = new AutoSave(contentFunc, activeOrderDir, versionId, autoSaveOn);
      await autoSavers[askey].onInit();
      return autoSavers[askey];
    }

    this.switch = async function (orderName, versionId) {
      autoSaver = await getAutoSaver(orderName, versionId);
      const contents = await autoSaver.read();
      versionChangeEvent.trigger(null, {orderName, versionId, contents});
      return contents;
    }

    async function versionList(orderHandler, nameOnly) {
      const orderName = orderHandler.name();
      const versions = await orderHandler.values();
      const list = [];
      let next;
      do {
        next = await versions.next();
        if (!orderVersionObj[orderName]) orderVersionObj[orderName] = [];
        if (next.value) {
          const value = nameOnly ? next.value.name : next.value;
          list.push(value);
        }
      } while (!next.done)
      return list;
    }

    async function changeOrderName(newOrderName) {
      const versionHandlers = await versionList(activeOrderDir);
      for (let index = 0; index < versionHandlers.length; index++) {
        const vHandle = versionHandlers[index];
        const contents = await vHandle.read();
        const vId = vHandle.name();
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
      ordersDir = await navH.getDirectory('orders', true);
      loadingEvent.trigger(null, instance);
      await ordersDir.foreach(async (orderHandler) => {
        const versions = Object.values(await orderHandler.ls('', (helper) => helper.isDirectory()))
                            .map((h) => h.name());
        orderVersionObj[orderHandler.name()] = versions;
      });
      await instance.switch(initialOrderName, initialVersionId);
      const text = await autoSaver.read();
      loadedEvent.trigger(null, instance);
      fileSystemChangeEvent.trigger(null, instance);
      initialized = true;
    }
    this.init = init;
  }
}

module.exports = OrderSaveManager;
