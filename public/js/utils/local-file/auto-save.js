
const CustomEvent = require('../custom-event');
const Navigator = require('navigator');

const ROOT_OBJ_NAME = '_AUTO_SAVE_root.json';
class AutoSave {
  constructor(contentFunc, rootDirectoryHelper, rootPath, autoSaveOn) {
    if ((typeof contentFunc) !== 'function') throw new Error('Must give a content function or else whats the point?');
    this.rootPath = () => rootPath;
    this.rootDirectoryHelper = () => rootDirectoryHelper;

    const instance = this;
    const savedEvent = new CustomEvent('saved');
    const savingEvent = new CustomEvent('saving');
    const readEvent = new CustomEvent('read');
    const readingEvent = new CustomEvent('reading');
    let maxLen = 10000;

    this.isOn = () => autoSaveOn === true;
    this.onSaved = savedEvent.on;
    this.onSaving = savingEvent.on;
    this.onRead = readEvent.on;
    this.onReading = readingEvent.on;
    this.maxLen = (val) => val ? (maxLen = val) : maxLen;

    function getPath(path) {
      path = path !== '' ? Navigator.concatPaths(rootPath, path) : rootDirectoryHelper.absPath(rootPath);
      return path + '.json';
    }

    this.save = async function () {
      if (!hasRead) throw new Error('Must attempt to read file before saving');
      try {
        savingEvent.trigger();
        const data = contentFunc(rootPath, this);
        const jsonD = JSON.deconstruct(data, maxLen, 2);
        const paths = Object.keys(jsonD);
        for (let index = 0; index < paths.length; index++) {
          let path = getPath(paths[index].split('.').join('/'));
          const file = await rootDirectoryHelper.getFile(path, true);
          await file.write(jsonD[paths[index]]);
        }
        savedEvent.trigger();
      } catch (e) {
        this.on_off_toggle(false);
        console.error(e);
      }
    }

    let hasRead = false;
    async function read() {
      try {
        const deconstruction = {};
        const fileHelpers = await rootDirectoryHelper.find(null, (helper) => helper.isFile());
        try {
          const rootFile = await rootDirectoryHelper.get(rootDirectoryHelper.absPath() + '.json');
          deconstruction[''] = await rootFile.read();
        } catch (e) {}
        const list = Object.values(fileHelpers);
        for (let index = 0; index < list.length; index++) {
          const fileHelper = list[index];
          const text = await fileHelper.read();
          let objPath = fileHelper.relPath(rootDirectoryHelper).split('/').join('.');
          objPath = objPath.replace(/(.*)\.json/, '$1');
          deconstruction[objPath] = text;
        }
        hasRead = true;
        const built = JSON.reconstruct(deconstruction);
        return built[rootPath] || {};
      } catch (e) {
        return null;
      }
    }
    this.read = read;

    let activeSaver = 0;
    this.on_off_toggle = (true_false_undefined) => {
      switch (true_false_undefined) {
        case true: autoSaveOn = true; break;
        case false: autoSaveOn = false; break;
        default: autoSaveOn = !autoSaveOn; break;
      }
      if (autoSaveOn) autoSave(++activeSaver);
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
