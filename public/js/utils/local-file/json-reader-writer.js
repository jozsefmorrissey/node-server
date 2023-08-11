
const Navigator = require('navigator');

class JsonReaderWriter {
  constructor() {
    let maxLen = 10000;
    this.maxLen = (val) => val ? (maxLen = val) : maxLen;

    function getPath(directoryHelper, path) {
      path = path !== '' ? path.replace(/\./g, '/') : directoryHelper.absPath();
      return path + '.json';
    }

    async function removeExisting(rootDirectoryHelper) {
      await rootDirectoryHelper.delete('', (h) => h.absPath() !== rootDirectoryHelper.absPath());
      await rootDirectoryHelper.delete(getPath(rootDirectoryHelper, ''));
    }

    this.read = async (rootDirectoryHelper) => {
      try {
        const deconstruction = {};
        const fileHelpers = await rootDirectoryHelper.find('', (helper) => helper.isFile());
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
        const built = JSON.reconstruct(deconstruction);
        if (built) {
          const hash = JSON.stringify(built).hash();
          lastHashes[rootDirectoryHelper.absPath()] = hash;
        }
        return built || {};
      } catch (e) {
        console.error(e);
        return null;
      }
    }

    async function getReplaceLocation(absPath, isFile) {
      const match = absPath.match(/(.*)\/(.{1,})/);
      const path = match[1];
      const name = match[2];
      const repPath = `${path}/.json_writer-${name}`;
      if (isFile) {
        return Navigator.helper(await Navigator.getFile(null, repPath, true));
      } else {
        return Navigator.helper(await Navigator.getDirectory(null, repPath, true));
      }
    }

    let lastHashes = {};
    this.write = async (data, rootDirectoryHelper) => {
      const hash = JSON.stringify(data).hash();
      if (lastHashes[rootDirectoryHelper.absPath()] === hash) {
        console.log('saimzyes'); return false;
      }
      console.log('not saimzyes');
      const replaceLoc = await getReplaceLocation(rootDirectoryHelper.absPath());
      const rootJsonFileName = rootDirectoryHelper.absPath() + '.json';
      let replaceFile;
      try {
        const jsonD = JSON.deconstruct(data, maxLen, 2);
        const paths = Object.keys(jsonD);
        for (let index = 0; index < paths.length; index++) {
          let path = getPath(replaceLoc, paths[index]);
          if (paths[index] !== '') {
            const file = await replaceLoc.getFile(path, true);
            await file.write(jsonD[paths[index]]);
          } else {
            replaceFile = await getReplaceLocation(rootJsonFileName, true);
            await replaceFile.write(jsonD[paths[index]]);
          }
        }
        await removeExisting(rootDirectoryHelper);
        replaceLoc.move(rootDirectoryHelper.absPath());
        if (replaceFile) await replaceFile.move(rootJsonFileName);
        // TODO: should create hash function that takes returns true is an object
        //       structure is the same. Since keys are not ordered this method
        //       may return true for identical objects with a diffrent reference order.
        lastHashes[rootDirectoryHelper.absPath()] = hash;
        return true;
      } catch (e) {
        throw e;
      }
    }
  }
}

module.exports = JsonReaderWriter;