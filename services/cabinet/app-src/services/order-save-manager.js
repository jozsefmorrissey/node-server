
const du = require('../../../../public/js/utils/dom-utils.js');
const CustomEvent = require('../../../../public/js/utils/custom-event');

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

    const loadingEvent = new CustomEvent('loading');
    const loadedEvent = new CustomEvent('loaded');
    const savingEvent = new CustomEvent('saving');
    const savedEvent = new CustomEvent('saved');
    const fileSystemChangeEvent = new CustomEvent('fileSystemChange');
    const versionChangeEvent = new CustomEvent('versionChange');
    this.onLooading = loadingEvent.on;
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
    this.remove = (orderName) => {
      ordersDir.removeEntry(orderName);
      delete orderVersionObj[orderName];
    }
    this.toggle = () => this.on(!autoSaveOn);
    this.open = async (orderName, versionId) => {
      orderName ||= initialOrderName;
      versionId ||= initialVersionId;
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
      if (orderVersionObj[orderName] === undefined) return 'new order';
      if (orderVersionObj[orderName].indexOf(versionId) === -1) return 'new version';
      const isActiveOrder = orderName === this.activeOrderName();
      if (isActiveOrder) {
        const isActiveVersion = versionId === this.activeVersionId();
        if (isActiveVersion) return 'active'
        else return 'switch version';
      }
      return  'switch order';
    }

    this.activeOrderName = activeOrderName;
    this.activeVersionId = activeVersionId;
    this.orderNames = () => Object.keys(orderVersionObj);
    this.versionIds = (orderName) => orderVersionObj[orderName];
    this.save = async function (orderName, versionId, data) {
      data ||= contentFunc();
      const version = activeVersion;
      const argsDefined = orderName && versionId && data;
      if (argsDefined) version = await this.open(orderName, versionId).versionFileHandle;
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

    const decoder = new TextDecoder();
    async function read(versionHandle) {
      const file = await (versionHandle || activeVersion).getFile();
      const stream = file.stream()
      const reader = stream.getReader();
      const fileSize = file.size;
      const buffer = new DataView(new ArrayBuffer(fileSize));
      const gibberish = await reader.read(buffer);
      const text = decoder.decode(gibberish.value);
      return text;
    }

    this.read = read;

    this.switch = async function (orderName, versionId) {
      const opened = await this.open(orderName, versionId);
      activeOrderDir = opened.orderDirectoryHandle;
      orderName = activeOrderDir.name;
      activeVersion = opened.versionFileHandle;
      versionId = activeVersion.name;
      const contents = await read();
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
          const value = nameOnly ? next.value.name : next.value;
          list.push(clean(value));
        }
      } while (!next.done)
      return list;
    }

    async function changeOrderName(newOrderName) {
      const versionHandlers = versionList(activeOrderDir);
      for (let index = 0; index < versionHandlers.length; index++) {
        const vHandle = versionHandlers[index];
        const contents = await read(vHandle);
        const vId = vHandle.name;
        this.save(newOrderName, vId, contents);
      }
      this.remove(activeOrderName());
      this.switch(newOrderName, activeVersionId());
    }
    this.changeOrderName = changeOrderName;

    async function init() {
      loadingEvent.trigger(null, instance);
      workingDir = await window.showDirectoryPicker();
      let perms = await workingDir.queryPermission();
      ordersDir = await workingDir.getDirectoryHandle('orders', {create: true});
      cabinetConfig = await workingDir.getFileHandle('cabinet.json', { create: true });
      propertyConfig = await workingDir.getFileHandle('property.json', { create: true });
      costConfig = await workingDir.getFileHandle('cost.json', { create: true });
      const values = await ordersDir.values();
      let next;
      do {
        next = await values.next();
        if (next.value && next.value.kind === 'directory') {
          const orderHandler = next.value;
          orderVersionObj[orderHandler.name] = await versionList(orderHandler, true);
        }
      } while(!next.done);
      await instance.switch();
      const text = await read();
      loadedEvent.trigger(null, instance);
      fileSystemChangeEvent.trigger(null, instance);
      autoSaveOn = true;
      autoSave();
    }
    this.init = init;
  }
}

module.exports = OrderSaveManager;
