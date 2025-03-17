
const fs = require('fs');
const shell = require('shelljs');
const $t = require('../../public/js/utils/$t');
const { Bundler } = require('../bundler');

class HtmlBundler extends Bundler {
  constructor(fileDumpLoc, cleanNameFunc) {
    super();
    const dirPath = fileDumpLoc.replace(/^(.*\/).*$/, '$1');
    if (dirPath !== fileDumpLoc) shell.mkdir('-p', dirPath);
    shell.touch(fileDumpLoc);
    cleanNameFunc = cleanNameFunc || ((name) => name.replace(/^(.*)\.html$/, '$1'));
    this.change = (filename, contents) => {
      try {
        if (!filename) return;
        new $t(contents, cleanNameFunc(filename));
      } catch (e) {
        Bundler.alarm();
        console.error(e);
      }
    }

    this.write = () => {
      try {
        shell.touch(fileDumpLoc);
        console.log('Writing file', fileDumpLoc)
        fs.writeFileSync(fileDumpLoc, $t.dumpTemplates(true));
      } catch (e) {
        Bundler.alarm();
        console.error(e);
      }
    }
  }
}

exports.HtmlBundler = HtmlBundler;
