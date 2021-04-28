
const fs = require('fs');
const shell = require('shelljs');
const { Bundler } = require('../bundler');

class JsBundler extends Bundler {
  constructor(file, externals) {
    super();
    const id = file.replace(/^.*\/([^\/]*)$/, "$1");
    externals.push('afterLoad');
    const jsFiles = {};
    const afterFiles = {};
    const allJsFiles = {};
    let position = 0;
    const refRegex = /(class|function)\s{1}([\$a-zA-Z][a-zA-Z0-9\$]*)/g;

    class JsFile {
      constructor(filename, contents, position) {
        allJsFiles[filename] = this;
        const instance = this;
        this.filename = filename;
        this.contents = contents;
        this.position = position;
        let after;
        function updateAfter () {
          let firstLine = instance.contents.split('\n')[0];
          if (after) {
            afterFiles[after][instance.filename] = undefined;
          }
          after = firstLine.replace(/^\s*\/\/\s*(.*)\s*$/, '$1');
          if (after && after !== firstLine && after.trim().match(/^\.\/.*$/)) {
              after = after.trim();
              if (afterFiles[after] === undefined) afterFiles[after] = {};
              afterFiles[after][instance.filename] = instance;
              delete jsFiles[instance.filename];
          } else {
            after = undefined;
            jsFiles[instance.filename] = instance;
          }
        }
        this.updateContents = function (cont) {
          this.contents = cont;
          const newRefs = {};

          const matches = contents.match(refRegex);
          if (matches) {
            matches.map(function (elem) {
              const name = elem.replace(refRegex, '$2');
              newRefs[name] = true;
            });
          }
          updateAfter();
          this.references = newRefs;
        }
        this.replace = function () {
          this.overwrite = true;
        }
        this.updateContents(contents);
      }
    }
    function fileExistes(filename) {
      return shell.test('-f', filename, {silent: true});
    }

    function change(filename, contents, position) {
      console.log('filename', filename)
      if (!fileExistes(filename)) {
        delete jsFiles[filename];
        delete allJsFiles[filename];
      } else if (allJsFiles[filename]) {
        allJsFiles[filename].updateContents(contents);
      } else {
        console.log('creating new', filename)
        new JsFile(filename, contents, position);
      }
    }

    function sortFileNames (jsF1, jsF2) {
      // console.log(jsF1.filename, jsF1.position)
      // console.log(jsF2.filename, jsF2.position);
      const test = jsF1.position - jsF2.position || jsF1.filename.match(/[^.]{2,}?\//g).length -
        jsF2.filename.match(/[^.]{2,}?\//g).length
      // console.log(test);
      return test;
    }

    function write() {
      let bundle = `let ${id} = function () {\nconst afterLoad = []\n`;

      function addAfterFiles(filename) {
        if (afterFiles[filename]) {
          Object.values(afterFiles[filename]).forEach((child, i) => {
            if (child && child.contents) {
              console.log(filename, child.filename)
              bundle += child.contents + ';';
              addAfterFiles(child.filename);
            }
          });
        }
      }
      Object.values(jsFiles).sort(sortFileNames).forEach((item, i) => {
            bundle += item.contents + '\n\n';
            console.log(item.filename)
            addAfterFiles(item.filename);
      });
      bundle += `\nreturn {${externals.join()}};
        }
        try {
          ${id} = ${id}();
          ${id}.afterLoad.forEach((item) => {item();});
        } catch (e) {
            console.log(e);
        }`;
      console.log(`Writing ./${id}.js`);
      fs.writeFile(`./${file}.js`, bundle, () => {});
    }

    this.write = write;
    this.change = change;
  }
}

exports.JsBundler = JsBundler;
