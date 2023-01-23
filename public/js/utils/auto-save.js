
const du = require('dom-utils');

class AutoSave {
  constructor(cntId, contentFunc, suggestedName) {
    if ((typeof contentFunc) !== 'function') throw new Error('Must give a content function or else whats the point?');
    if (!cntId || (typeof cntId) !== 'string') throw new Error('A container Id is required to activate the autoSave function');
    let cabinetConfig, propertyConfig, costConfig;
    let workingDir, ordersDir;
    let orderDirectories = {};
    let activeOrderDir, activeVersion;
    let activeVersionId = 'original';
    let counter = 0;
    let autoSaveOn = null;
    const instance = this;

    const getElem = (selector) => () => du.find.down(selector, du.id(cntId));
    const getStatusElem = getElem('.status');
    const getAutoSaveBtn = getElem('button');
    const activeOrderName = () => activeOrderDir ? activeOrderDir.name : suggestedName;

    const cookieId = () => `last-active-order-${cntId}`;
    const cookieValue = () => `${activeOrderName()},${activeVersionId}`;
    const setCookie = () => du.cookie.set(cookieId(), cookieValue());
    const getCookie = () => du.cookie.get(cookieId());

    this.save = async function () {
      if (activeVersion) {
        counter++;
        getStatusElem().innerHTML = 'Saving...'
        const writable = await activeVersion.createWritable();
        await writable.write({type: 'write', data: contentFunc()});
        await writable.close();
        getStatusElem.innerHTML = '';
      }
    }

    const decoder = new TextDecoder();
    async function read() {
      activeVersion = await activeOrderDir.getFileHandle(activeVersionId, {create: true});
      const file = await activeVersion.getFile();
      const stream = file.stream()
      const reader = stream.getReader();
      const fileSize = file.size;
      const buffer = new DataView(new ArrayBuffer(fileSize));
      const gibberish = await reader.read(buffer);
      const text = decoder.decode(gibberish.value);
      return text;
    }

    this.open = async function () {
      let orderName = getCookie();
      if (orderDirectories[orderName] === undefined)
        orderName = Object.keys(orderDirectories)[0];
      let orderDir = orderDirectories[orderName];
      if (!orderDir) {
        orderDir = await ordersDir.getDirectoryHandle(activeOrderName(), {create: true});
      }
      activeOrderDir = orderDir;
      const contents = await read();

      setCookie();
      return activeVersion;
    }

    function autoSave() {
      console.log('auto start:', autoSaveOn);
      if (autoSaveOn) {
        console.log('auto:', autoSaveOn);
        setTimeout(autoSave, 10000);
        instance.save();
      }
    }

    async function init() {
      workingDir = await window.showDirectoryPicker();
      let perms = await workingDir.queryPermission()
      ordersDir = await workingDir.getDirectoryHandle('orders', {create: true});
      cabinetConfig = await workingDir.getFileHandle('cabinet.json', { create: true });
      propertyConfig = await workingDir.getFileHandle('property.json', { create: true });
      costConfig = await workingDir.getFileHandle('cost.json', { create: true });
      const values = await ordersDir.values();
      let next;
      do {
        next = await values.next();
        if (next.value && next.value.kind === 'directory') {
          orderDirectories[next.value.name] = next.value;
        }
      } while(!next.done);
      instance.open();
      autoSaveOn = true;
      autoSave();
    }

    du.on.match('click', `#${cntId}>button`, (elem) =>{
      if (autoSaveOn === null) return init();
      if (autoSaveOn) {
        autoSaveOn = false;
        elem.innerHTML = 'Autosave off';
      } else {
        autoSaveOn = true;
        elem.innerHTML = 'Autosave on!';
        autoSave();
      }
    });
  }
}

module.exports = AutoSave;
