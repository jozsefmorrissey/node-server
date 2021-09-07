
const fs = require('fs');
const CssFile = require('../../src/index/css.js').CssFile;
const { Bundler } = require('../bundler');

class CssBundler extends Bundler {
  constructor(fileDumpLoc) {
    super();
    this.change = (filename, contents) => {
      if (!filename) return;
      new CssFile(filename, contents);
    }

    this.write = () => {
      console.log('Writing', fileDumpLoc);
      fs.writeFileSync(fileDumpLoc, '// ./src/index/css.js\n' + CssFile.dump());
    }
  }
}

exports.CssBundler = CssBundler;
