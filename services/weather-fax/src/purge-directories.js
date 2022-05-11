
const shell = require('shelljs');
const dg = require('./debug-gui-interface');

class PurgeDirectories {
  constructor(interval, ...dirs) {
    let funcs = [];
    interval = `+${interval}`;

    const fileInfoReg = /^[-rwx]{10} [0-9]{1,} [^\s].*? [^\s].*? [0-9]{1,} (.*?[0-9]{2}:[0-9]{2}) (.*)$/;
    function purge(dirRegExp) {
      let filesToRm = [];
      dirs.forEach((dir) => {
        if (dir.match(dirRegExp) && shell.ls(dir).code === 0) {
          const findCmd = `find ${dir} -mmin ${interval}`;
          dg.log('findCmd', findCmd);
          const output = shell.exec(findCmd, dir);
          if (output.stdout) {
            const oldFiles = output.stdout.trim().split('\n');
            filesToRm = filesToRm.concat(oldFiles);
          }
        }
      });
      dg.log('purging', filesToRm)
      funcs.forEach((func) => func(filesToRm));
      if (filesToRm.length > 0) {
        shell.rm('-r', ...filesToRm);
        return filesToRm;
      }

      return [];
    }

    this.purge = purge;
    this.on = (func) => {if ((typeof func) === 'function') funcs.push(func);}
  }
}

module.exports = PurgeDirectories;
