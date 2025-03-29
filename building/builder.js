const fs = require('fs');
const shell = require('shelljs');
require('../public/js/utils/parse-arguments');

class Builder {
  constructor(onChange, onUpdate, watchFiles) {
    const id = String.random();
    const largNumber = Number.MAX_SAFE_INTEGER;
    const positions = {};
    function readFile(file, position, fileCount) {
      function notify() {
        onUpdate.lastCall(id, 50);
      }

      function read(err, contents) {
        if (err) {
          console.error(err);
        }
        onChange && onChange(file.name, contents, position);
        setTimeout(notify, 50);
      }
      // console.log.lastCall(`File Change Notification: ${file.name}`);
      fs.readFile(file.name, 'utf8', read);
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
        console.log.lastCall(`File Changed: ${filename} - ${eventType}`);
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
        });
      };
    }

    const dirs = {};
    function watch(item, parent) {
      const path = item.isDirectory() || parent === undefined ?
            item.name : `${parent}${item.name}`.replace(/\/{2,}/g, '/');
      if (watchFiles) {
        // console.log(`Watching: ${path} - ${positions[item.name]}`);
        fs.watch(path, { encoding: 'utf8' }, process(path, item));
      }
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
