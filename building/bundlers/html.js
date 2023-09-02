
const fs = require('fs');
const shell = require('shelljs');
const $t = require('../bin/builder').$t;
const { Bundler } = require('../bundler');

class HtmlBundler extends Bundler {
  constructor(fileDumpLoc, cleanNameFunc) {
    super();
    const dirPath = fileDumpLoc.replace(/^(.*\/).*$/, '$1');
    if (dirPath !== fileDumpLoc) shell.mkdir('-p', dirPath);
    shell.touch(fileDumpLoc);
    cleanNameFunc = cleanNameFunc || ((name) => name.replace(/^(.*)\.html$/, '$1'));
    this.change = (filename, contents) => {
      if (!filename) return;
      new $t(contents, cleanNameFunc(filename));
    }

    this.write = () => {
      try {
        shell.touch(fileDumpLoc);
        console.log('Writing file', fileDumpLoc)
        fs.writeFileSync(fileDumpLoc, $t.dumpTemplates(true));
      } catch (e) {
        console.log(e);
      }
    }
  }
}

exports.HtmlBundler = HtmlBundler;
