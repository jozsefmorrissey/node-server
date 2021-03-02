
const fs = require('fs');
const shell = require('shelljs');
const $t = require('../bin/builder').$t;
const { Bundler } = require('../bundler');

class HtmlBundler extends Bundler {
  constructor(fileDumpLoc) {
    super();
    this.change = (filename, contents) => {
      if (!filename) return;
      new $t(contents, filename.replace(/^.\/html\/(.*)\.html$/, '$1'));
    }

    this.write = () => {
      try {
        shell.touch(fileDumpLoc);
        console.log('Writing file', fileDumpLoc)
        fs.writeFileSync(fileDumpLoc, '// ./src/index/services/$t.js\n' + $t.dumpTemplates());
      } catch (e) {
        console.log(e);
      }
    }
  }
}

exports.HtmlBundler = HtmlBundler;
