
const fs = require('fs');
const shell = require('shelljs');
const { Bundler } = require('../bundler');
const { RequireJS } = require('./require.js');


class JsBundler extends Bundler {
  constructor(file, externals, options) {
    options = options || {};
    const requireJs = new RequireJS(options.projectDir, options.main);
    // requireJs.guess(true);
    super();
    const instance = this;
    options = options || {};
    const bundler = this;
    let encaps = !(options.encapsulate === false);
    const id = file.replace(/^.*\/([^\/]*)$/, "$1");
    const dirPath = file.replace(/^(.*\/).*$/, '$1');
    if (dirPath !== file) shell.mkdir('-p', dirPath);
    shell.touch(file + '.js');
    externals.push('afterLoad');
    const jsFiles = {};
    const afterFiles = {};
    const allJsFiles = {};
    let position = 0;
    const refRegex = /(class|function)\s{1}([\$a-zA-Z][a-zA-Z0-9\$]*)/g;
    this.allFileNames = () => Object.keys(jsFiles);

    class JsFile {
      constructor(filename, contents, position) {
        allJsFiles[filename] = this;
        const instance = this;
        this.filename = filename;
        this.contents = contents;
        this.position = position;
        let after;

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
          jsFiles[instance.filename] = instance;
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

    let lastCall = Number.MAX_SAFE_INTEGER;
    function change(filename, contents, position) {
      if (!fileExistes(filename)) {
        delete jsFiles[filename];
        delete allJsFiles[filename];
      } else if (allJsFiles[filename]) {
        allJsFiles[filename].updateContents(contents);
      } else {
        new JsFile(filename, contents, position);
      }
      const currTime = new Date().getTime();
      if ((typeof options.onChange === 'function') && currTime < lastCall - 50) {
        lastCall = currTime;
        setTimeout(() => {
          options.onChange(this, bundler);
        }, 1000);
      }
    }

    function sortFileNames (jsF1, jsF2) {
      const test = jsF1.position - jsF2.position || jsF1.filename.match(/[^.]{2,}?\//g).length -
        jsF2.filename.match(/[^.]{2,}?\//g).length
      return test;
    }

    function formatScript(filename, script) {
      const promise = new Promise((resolve) => {
        const formatted = encaps ? requireJs.encapsulate(filename, script) : script;
        resolve(formatted);
      });
      return promise;
    }

    function write() {
      let maxFileCount = 0;
      let fileCount = 0;
      let bundle = encaps ? requireJs.header() : '';

      function writeBundle () {
        bundle += encaps ? requireJs.footer() : '';
        console.log(`Writing ${maxFileCount} files into ./${id}.js`);
        fs.writeFile(`./${file}.js`, bundle, () => {});
        instance.trigger(bundle);
      }

      function addScript(item, i) {
        function addIt() {
            setTimeout(async function () {
              let contents = item.contents;
              if (item.filename.endsWith('.json')) {
                contents = 'module.exports = ' + contents;
              } else if (!item.filename.endsWith('.js')) {
                contents = `module.exports = \`${contents}\``;
              }
              const formatted = await formatScript(item.filename, contents);
              bundle += formatted;
              fileCount--;
              if (fileCount === 0) setTimeout(writeBundle, 300);
            });
        }
        if (item && item.contents) {
          fileCount++;
          maxFileCount = maxFileCount < fileCount ? fileCount : maxFileCount;
          addIt(item, i);
        }
      }

      // let testBundles = ['',''];
      // const build = () => ' ';
      // async function constructAndAppend(data) {
      //    testBundles[0] += await build();
      //    const built = await build();
      //    testBundles[1] += built;
      //    console.log(testBundles[0].length === testBundles[1].length, `${testBundles[0].length} === ${testBundles[1].length}`);
      // }
      //
      // new Array(10).fill((v,i) => i).forEach(constructAndAppend);

      Object.values(jsFiles).sort(sortFileNames).forEach(addScript);
    }

    this.write = write;
    this.change = change;
  }
}

exports.JsBundler = JsBundler;
