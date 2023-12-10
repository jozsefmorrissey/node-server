
const CustomEvent = require('../custom-event');
const JsonReaderWriter = require('json-reader-writer');

const ROOT_OBJ_NAME = '_AUTO_SAVE_root.json';
// TODO: I would prefer if name was not an argument... but i tried removing it
//       and everything broke. My theory was that only one instance of a given
//       file or directory can be referenced at a time. Since the root directory
//       is never accessed when reading and writing, this eliminates the multiple
//       reference problem.(If that was the problem...)
class AutoSave {
  constructor(contentFunc, rootDirectoryHelper, name, autoSaveOn) {
    if ((typeof contentFunc) !== 'function') throw new Error('Must give a content function or else whats the point?');
    let promise  = rootDirectoryHelper;
    this.ready = () => !(rootDirectoryHelper instanceof Promise);
    if (this.ready()) promise = undefined;
    else (async () =>
      rootDirectoryHelper = await promise)();
    this.name = () => name;
    this.directoryName = () => rootDirectoryHelper.name();
    this.rootDirectoryHelper = () => rootDirectoryHelper;
    this.onInit = async (func) => {
      if (promise) await promise;
      if ((typeof func) === 'function') func();
    }
    this.directory = async () => rootDirectoryHelper.getDirectory(name, true);

    const instance = this;
    const savedEvent = new CustomEvent('saved');
    const savingEvent = new CustomEvent('saving');
    const readEvent = new CustomEvent('read');
    const readingEvent = new CustomEvent('reading');
    let maxLen = 10000;
    let readerWriter = new JsonReaderWriter();

    this.isOn = () => autoSaveOn === true;
    this.onSaved = savedEvent.on;
    this.onSaving = savingEvent.on;
    this.onRead = readEvent.on;
    this.onReading = readingEvent.on;
    this.maxLen = (val) => readerWriter.maxLen(val);

    this.save = async function () {
      await this.onInit();
      if (!hasRead) throw new Error('Must attempt to read file before saving');
      const data = contentFunc(this.name(), this);
      if (readerWriter.changesMade(data, await this.directory())) {
        savingEvent.trigger();
        if (await readerWriter.write(data, await this.directory())) {
          savedEvent.trigger();
          return true;
        }
      }
      return false;
    }

    let hasRead = false;
    async function read() {
      await this.onInit();
      const data = await readerWriter.read(await this.directory());
      hasRead = true;

      return data;
    }
    this.read = read;

    let activeSaver = 0;
    this.on_off_toggle = (true_false_undefined) => {
      const tfu = true_false_undefined;
      if (autoSaveOn === tfu || (tfu !== undefined && tfu !== true && tfu !== false)) {
        return autoSaveOn;
      }
      switch (true_false_undefined) {
        case true: autoSaveOn = true; break;
        case false: autoSaveOn = false; break;
        case undefined: autoSaveOn = !autoSaveOn; break;
      }
      if (autoSaveOn) autoSave(++activeSaver);
      return autoSaveOn;
    }

    let int = 10000;
    this.timeInterval = (interval) => interval ? (int = interval) : int;

    function autoSave(saverId) {
      if (saverId !== activeSaver) return;
      if (autoSaveOn) {
        setTimeout(() => autoSave(saverId), int);
        if (hasRead) instance.save();
      }
    }
  }
}

class AutoSaveInterface {
  constructor(rootDirectoryHelper, initialPath, dataFunc, defaultTimeInterval, onByDefault) {
    const savers = {};
    let closed = false;
    let targetPath;
    let onlyTargetAutoSaving = true;
    let interfaceOn = onByDefault || false;

    this.onlyTargetAutoSaving = (tf) => (tf === true || tf === false) ? (onlyTargetAutoSaving = tf) : onlyTargetAutoSaving;
    this.isClosed = () => closed;
    const isOpen = () => {
      if (!closed) return true;
      throw new Error('attempting to use AutoSaveInterface that has been closed');
    };

    const target = () => savers[targetPath];

    this.get = (path, getDataFunc) => {
      isOpen();
      path ||= targetPath;
      if (savers[path]) return savers[path];
      if ((typeof getDataFunc) !== 'function') throw new Error('if getting path for first time a data function must be supplied');
      savers[path] = new AutoSave(getDataFunc, rootDirectoryHelper, path);
      if (defaultTimeInterval) savers[path].timeInterval(defaultTimeInterval);
      return savers[path];
    }

    this.set = (path, getDataFunc) => {
      isOpen();
      if(path === undefined) throw new Error('AutoSaveInterface must always have a target path');
      if (targetPath === path) return;
      if (targetPath && onlyTargetAutoSaving) this.get().on_off_toggle(false);
      targetPath = path;
      if (!savers[path]) this.get(path, getDataFunc);
      const on = onByDefault ? (interfaceOn = true) : interfaceOn;
      savers[path].on_off_toggle(on);
    }
    this.set(initialPath, dataFunc);

    this.save = (path) => isOpen() && this.get(path).save();
    this.read = async (path) => isOpen() && await (this.get(path)).read();
    // On off toggle(true false undefined)..... I want this to catch on.
    this.oft = (tfu, path) => {
      isOpen();
      if (tfu === true || tfu === false) interfaceOn = tfu;
      this.get(path).on_off_toggle(tfu);
    }
    this.list = () => isOpen() && Object.keys(savers);
    this.close = (path) => {
      if (!closed && path === targetPath) throw new Error('Cannot close targetPath autoSaver');
      if (path !== undefined) {
        savers[path].on_off_toggle(false);
        return delete savers[path];
      }
      const list = this.list();
      closed = true;
      for (let index = 0; index < list.length; index++) {
        this.close(list[index]);
      }
      return true;
    }

  }
}

AutoSave.Interface = AutoSaveInterface;
module.exports = AutoSave;
