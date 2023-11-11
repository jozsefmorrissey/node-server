const fs = require('fs');
const shell = require('shelljs');
const { Mutex, Semaphore } = require('async-mutex');
require('../arguement-parcer');

class Builder {
  constructor(onChange, onUpdate, watchFiles) {
    const largNumber = Number.MAX_SAFE_INTEGER;
    const semaphore = new Semaphore(largNumber);
    const mutex = new Mutex();
    const positions = {};
    function readFile(file, position) {
      semaphore.acquire().then(function([value, release]) {

        function notify() {
          value--;
          release();
          if (value === largNumber - 1 && onUpdate) onUpdate();
        }

        function read(err, contents) {
          if (err) {
            console.error(err);
          }
          onChange(file.name, contents, position);
          setTimeout(notify, 300);
        }
        fs.readFile(file.name, 'utf8', read);
      });
    }

    function runAllFiles(watchDir, position) {
      watchDir = `${watchDir}/`.replace(/\/{2,}/g, '/');
      const files = shell.ls('-ld', `${watchDir}*`);
      for (let index = 0; index < files.length; index += 1) {
        const item = files[index];
        if (item.isFile()) {
          readFile(item, position);
        } else if (item.isDirectory() && !dirs[item.name]) {
          dirs[item.name] = true;
          positions[item.name] = position;
          watch(item, watchDir);
        }
      }
    }

    // TODO: create seperate object that watches
    function process(path, item) {
      return (eventType, filename) => {
        function wait(release) {
          if (pending[path][filename]) {release();return;}
          console.log('File Changed:', `${filename} - ${eventType}`);
          pending[path][filename] = true;
          release();
          const filePath = item.isFile() ? path : `${path}/${filename}`.replace(/\/{2,}/g, '/');
          fs.stat(filePath, function (err, stat) {
            if (err) {console.log(err); return;}
            stat.name = filePath;
            if (stat.isDirectory() && !dirs[stat.name]) {
              dirs[stat.name] = true;
              positions[stat.name] = positions[item.name];
              watch(stat);
            } else if (stat.isFile()) {
              readFile(stat, positions[item.name]);
            }
            mutex.acquire().then((release) => {
                pending[path][filename] = false;release();})
          });
        }

        mutex.acquire().then(wait);
      };
    }

    const pending = {};
    const dirs = {};
    function watch(item, parent) {
      const path = item.isDirectory() || parent === undefined ?
            item.name : `${parent}${item.name}`.replace(/\/{2,}/g, '/');
      pending[path] = {};
      // console.log(`Watching: ${path} - ${positions[item.name]}`);
      if (watchFiles) fs.watch(path, { encoding: 'utf8' }, process(path, item));
      if (item.isDirectory()) {
        runAllFiles(path, positions[item.name]);
      } else if (item.isFile()) {
        readFile(item, positions[item.name]);
      }
    }

    let position = 0;
    this.add = function (fileOdir) {
      fileOdir = fileOdir.trim().replace(/^(.*?)\/*$/, '$1');
      positions[fileOdir] = position++;
      const stat = fs.stat(fileOdir, function(err, stats) {
        if (stats === undefined) {
          console.error(`Location: ${fileOdir}\n\tHas the following error:\n\t\t${err}`);
        } else {
          stats.name = fileOdir;
          if (stats.isDirectory() || stats.isFile()){
            watch(stats);
          }
        }
      });
      return this;
    }

    this.positions = positions;
  }
}

module.exports = Builder;
