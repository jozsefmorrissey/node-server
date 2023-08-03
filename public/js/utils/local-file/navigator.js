
const CustomEvent = require('../custom-event');

const initEvent = new CustomEvent('AutoSave:Init');
const decoder = new TextDecoder();
const prevDirReg = /\/[^/]*\/\.\./;
const rootReg = /^\//;
const currDirReg = /^\.(\/|)$/;
const selfRefReg = /\/\.\//;
const falseStartReg = /^\/\.\./;
const groundedPathReg = /^\/([^/]{1,}|$)/;
const leadingSlashReg = /^\//;
const parentDirReg = /(^.*)\/[^/]*$/;
let workingDir;

const sortByDepth = (handler1, handler2) => handler2.absPath.count('/') - handler1.absPath.count('/');

const concatPaths = (first, second) => {
  const firstTermSlash = first.endsWith('/');
  const secondTermSlash = second.startsWith('/');
  if ((firstTermSlash && !secondTermSlash) || (!firstTermSlash && secondTermSlash))
    return `${first}${second}`;
  if (!firstTermSlash && !secondTermSlash) return `${first}/${second}`;
  return `${first}${second.substring(1)}`;
}

const createFile = async (dirH, method, name, create) =>  {
  if ((typeof method) === 'string') return await dirH[method](name, {create});
  if (method !== undefined || create === true) throw new Error('unkown method of file creation');
  const list = await N.ls(dirH);
  if (list[name] === undefined) {
    if (create) throw new Error(`'${concatPaths(dirH.absPath, name)}' does not exist`);
    else return;
  }
  if (N.isFile(list[name])) return await dirH.getFileHandle(name);
  return await dirH.getDirectoryHandle(name);
}

async function getParentDirectory(handler) {
  const path = handler.absPath.replace(leadingSlashReg, '');
  const pathArr = path.split('/');
  const parentPath = '/' + pathArr.slice(0, -1).join('/');
  const parent = await N.get(workingDir, parentPath);
  await N.get(parentPath);
  return parent;
}

function getCreate(createMethod) {
  return async (handlerDir, path, create) => {
    handlerDir ||= workingDir;
    if(!path || path === './') return handlerDir;
    const absPath = N.absPathIffMustBeTaken(handlerDir.absPath, path);
    let currDir = handlerDir;
    if (absPath) path = absPath;
    if (path.match(leadingSlashReg)) currDir = workingDir;
    path = path.replace(leadingSlashReg, '');
    const pathArr = Array.isArray(path) ? path : path.split('/');
    for (let index = 0; index < pathArr.length - 1; index++) {
      const absPath = concatPaths(currDir.absPath, pathArr[index]);
      currDir = await currDir.getDirectoryHandle(pathArr[index], {create});
      currDir.absPath = absPath;
    }

    let name = pathArr[pathArr.length - 1]
    let target = await createFile(currDir, createMethod, name, create);
    if (target) target.absPath = concatPaths(currDir.absPath, name);
    return target;
  };
}

const Navigator = {
  init: async () => {
    if (workingDir) return;
    workingDir = await window.showDirectoryPicker();
    workingDir.absPath = "/";
    let permission = await workingDir.queryPermission();
    createMethods();
    initEvent.trigger();
  },
  concatPaths,
  absPath: (groundedPath, relitivePath) => {
    if (!relitivePath) return groundedPath;
    if (relitivePath.match(rootReg)) return relitivePath;
    if (relitivePath.match(currDirReg)) return groundedPath;
    let absPath =  concatPaths(groundedPath, relitivePath);
    if (!groundedPath.match(groundedPathReg)) throw new Error(`Path not grounded '${absPath}'\n\t\t\tTo calculate absPath, path must be grounded to the root directory '/'`);
    absPath = absPath.replaceIterativly(selfRefReg, '/');
    absPath = absPath.replaceIterativly(prevDirReg, '');
    if (absPath.match(falseStartReg)) throw new Error(`Invalid Path: \n\t\t\tgroundedPath: ${groundedPath}\n\t\t\trelativePath: ${relitivePath}\n\t\t\tresolvedPath: ${absPath}`);
    return absPath;
  },
  relPath: (refAbsPath, targetAbsPath) => {
    if (refAbsPath === targetAbsPath) return './';
    if (!refAbsPath.match(leadingSlashReg)) throw new Error(`path not an absolute path: '${refAbsPath}'`);
    if (!targetAbsPath.match(leadingSlashReg)) throw new Error(`path not an absolute path: '${targetAbsPath}'`);
    const refSplit = refAbsPath.split('/');
    const tarSplit = targetAbsPath.split('/');
    let sameCount = 0;
    while (refSplit[sameCount] === tarSplit[sameCount]) sameCount++;
    const prefix = refSplit.slice(0, sameCount).join('/');
    const upDirs = (new Array(refSplit.length - sameCount)).fill('..').join('/');
    const suffix = tarSplit.slice(sameCount).join('/');
    return upDirs.length > 0 ? `${upDirs}/${suffix}` : suffix;
  },
  absPathIffMustBeTaken: (groundedPath, relitivePath) => {
    const absPath = Navigator.absPath(groundedPath, relitivePath);
    if (absPath !== concatPaths(groundedPath, relitivePath)) return absPath;
  },
  onInit: initEvent.on
};
const N = Navigator;

module.exports = N;

function createMethods() {
  N.workingDir = () => workingDir;

  N.exists = async (handlerDir, path) => {
    try {
      await N.get(handlerDir, path);
      return true;
    } catch(e) {
      return false;
    }
  }

  N.foreach = async function (handlerDir, func, filter) {
    const values = await handlerDir.values();
    const runFilter = (typeof filter) === 'function';
    let next;
    do {
      next = await values.next();
      if (next.value && (!runFilter || filter(next.value))) {
        const handler = next.value;
        handler.absPath = concatPaths(handlerDir.absPath, handler.name);
        await func(handler);
      }
    } while(!next.done);
  };

  N.getDirectory = getCreate('getDirectoryHandle');
  N.getFile = getCreate('getFileHandle');
  N.get = getCreate();

  const swapReg = /^.*\.crswap$/g
  N.ls = async function (handlerDir, path, filter) {
    const targetDir = await N.getDirectory(handlerDir, path);
    const list = {};
    await N.foreach(handlerDir, handler =>
        !handler.name.match(swapReg) && (list[handler.name] = handler),
        filter);
    return list;
  };

  N.empty = async (handlerDir) => {
    const list = await Object.keys(N.ls(handlerDir));
    return list.length === 0;
  }

  N.find = async function (handlerDir, path, filter) {
    const targetDir = await N.get(handlerDir, path);
    if (targetDir === undefined) return;
    if (N.isFile(targetDir)) {
      const retVal = {};
      retVal[targetDir.absPath] = targetDir;
      return retVal;
    }
    const runFilter = (typeof filter) === 'function';
    const list = {};
    if (!runFilter || filter(targetDir)) list[targetDir.absPath] = targetDir;
    await N.foreach(targetDir, async (handler) => {
      if (!handler.name.match(swapReg)) {
        if (N.isFile(handler)) {
          if (!runFilter || filter(handler)) list[handler.absPath] = handler;
        } else {
          const childList = await N.find(handler, null, filter);
          Object.keys(childList).forEach(key => list[key] = childList[key]);
        }
      }
    });
    return list;
  };

  N.delete = async function (handler, path, filter) {
    try {
      console.log(path);
      if (path || filter) {
        const handlers = Object.values(await N.find(handler, path, filter));
        handlers.sort(sortByDepth);
        for (let index = 0; index < handlers.length; index++) {
          await N.delete(handlers[index]);
        }
      } else if (N.isDirectory(handler)){
        const handlers = Object.values(await N.find(handler));
        handlers.sort(sortByDepth);
        for (let index = 0; index < handlers.length; index++) {
          const h = handlers[index];
          const dir = await N.get(workingDir, h.absPath.replace(parentDirReg, '$1'));
          await dir.removeEntry(h.name);
        }
      } else {
        const dir = await N.get(workingDir, handler.absPath.replace(parentDirReg, '$1'));
        await dir.removeEntry(handler.name);
      }
    } catch (e) {
      console.log(e);
    }
  };

  N.move = async function (handler, to) {
    const parentDir = await getParentDirectory(handler);
    if (N.isFile(handler)) {
      const newFile = await N.getFile(parentDir, to, true);
      N.write(newFile, await N.read(handler));
      await N.delete(handler);
      return newFile;
    }
    const handlers = Object.values(await N.find(handler));
    const moveObjs = [];
    for (let index = 0; index < handlers.length; index++) {
      const h = handlers[index];
      const relitivePath = N.relPath(handler.absPath, h.absPath);
      if (N.isFile(h)) {
        const contents = await N.read(h);
        moveObjs.push({type: 'file', relitivePath, contents})
      } else {
        moveObjs.push({type: 'directory', relitivePath})
      }
    }

    await N.delete(handler);
    const toHandler = await N.getDirectory(parentDir, to, true);
    for (let index = 0; index < moveObjs.length; index++) {
      const obj = moveObjs[index];
      if (obj.type === 'file') {
        const newFile = await N.getFile(toHandler, obj.relitivePath, true);
        N.write(newFile, obj.contents);
      } else {
        await N.getDirectory(toHandler, obj.relitivePath, true);
      }
    }



    return toHandler;
  }

  N.isDirectory = (handler) => handler && handler.kind === 'directory';
  N.isFile = (handler) => handler && handler.kind === 'file';

  N.write = async function (fileHandle, data) {
    const writable = await fileHandle.createWritable().catch(console.error);
    if (writable.locked !== true) {
      await writable.write({type: 'write', data});
      await writable.close();
    }
  };

  N.read = async function (fileHandle) {
    const file = await fileHandle.getFile();
    const stream = file.stream()
    const reader = stream.getReader();
    const fileSize = file.size;
    const buffer = new DataView(new ArrayBuffer(fileSize));
    const gibberish = await reader.read(buffer);
    const text = decoder.decode(gibberish.value);
    return text;
  };


  const helperObj = (handlerObj) => {
    const helperObj = {};
    Object.keys(handlerObj).forEach((key) => helperObj[key] = N.helper(handlerObj[key]));
    return helperObj;
  }

  const foreachWrapper = (func) => (typeof filter) === 'function' ?
                          (handler) => func(N.helper(handler)) : undefined;
  const few = foreachWrapper;
  const filterWrapper = (filter) => (typeof filter) === 'function' ?
                          (handler) => filter(N.helper(handler)) : undefined;
  const fw = filterWrapper;
  class LocalDirectoryHelper {
    constructor(dir) {
      this.workingDir = () => dir,
      this.name = () => dir.name;
      this.foreach = async (func, filter) => N.foreach(dir, few(func), fw(filter)),
      this.getDirectory = async (path, create) => N.helper(await N.getDirectory(dir, path, create)),
      this.getFile = async (path, create) => N.helper(await N.getFile(dir, path, create)),
      this.get = async (path) => N.helper(await N.get(dir, path)),
      this.ls = async (path, filter) => helperObj(await N.ls(dir, path, fw(filter)));
      this.read = async (path) => await N.read(await N.get(dir, path));
      this.find = async (path, filter) => helperObj(await N.find(dir, path, fw(filter)));
      this.write = async (path, data) => await N.write(await N.getFile(dir, path, true), data);
      this.move = async (to) => N.helper(await N.move(dir, to));
      this.delete = async (path, filter) => await N.delete(dir, path, fw(filter));
      this.empty = async () => N.empty(dir);
      this.relPath = (dirHelper) => N.relPath(dirHelper.absPath(), dir.absPath);
      this.absPath = (path) => N.absPath(dir.absPath, path);
      this.exists = (path) => N.exists(dir, path);

      this.isFile = () => false;
      this.isDirectory = () => true;
    }
  }

  class LocalFileHelper {
    constructor(file) {
      this.file = () => file;
      this.name = () => file.name;
      this.absPath = () => file.absPath;
      this.read = async () => await N.read(file);
      this.write = async (data) => await N.write(file, data);
      this.move = async (to) => N.helper(await N.move(file, to));
      this.delete = async () => await N.delete(file);
      this.relPath = (dirHelper) => N.relPath(dirHelper.absPath(), file.absPath);

      this.isFile = () => true;
      this.isDirectory = () => false;
    }
  }

  N.helper = (dirOfile) => {
    if (N.isFile(dirOfile)) return new LocalFileHelper(dirOfile);
    return new LocalDirectoryHelper(dirOfile || Navigator.workingDir());
  }
}
