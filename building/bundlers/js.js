
const fs = require('fs');
const shell = require('shelljs');
const { Bundler } = require('../bundler');
const { RequireJS } = require('./require.js');
const { Mutex, Semaphore } = require('async-mutex');


class JsBundler extends Bundler {
  constructor(file, externals, options) {
    options = options || {};
    const requireJs = new RequireJS(options.projectDir, options.main);
    // requireJs.guess(true);
    super();
    options = options || {};
    const bundler = this;
    let encaps = !(options.encapsulate === false);
    const id = file.replace(/^.*\/([^\/]*)$/, "$1");
    console.log('file', file);
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

    let lastCall = Number.MAX_SAFE_INTEGER;
    function change(filename, contents, position) {
      console.log('filename:', filename)
      if (!fileExistes(filename)) {
        delete jsFiles[filename];
        delete allJsFiles[filename];
      } else if (allJsFiles[filename]) {
        allJsFiles[filename].updateContents(contents);
      } else {
        console.log('creating new', filename)
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
      // console.log(jsF1.filename, jsF1.position)
      // console.log(jsF2.filename, jsF2.position);
      const test = jsF1.position - jsF2.position || jsF1.filename.match(/[^.]{2,}?\//g).length -
        jsF2.filename.match(/[^.]{2,}?\//g).length
      // console.log(test);
      return test;
    }

    function formatScript(filename, script) {
      const promise = new Promise((resolve) => {
        const formatted = encaps ? requireJs.encapsulate(filename, script) : script;
        resolve(formatted);
      });
      return promise;
    }

    const writersLock = new Semaphore(1);
    let maxFileCount = 0;
    let fileCount = 0;
    function write() {
      let bundle = encaps ? requireJs.header() : '';

      function writeBundle () {
        bundle += encaps ? requireJs.footer() : '';
        console.log(`Writing ${maxFileCount} files into ./${id}.js`);
        fs.writeFile(`./${file}.js`, bundle, () => {});;
      }

      function addScript(item, i) {
        function addIt() {
            setTimeout(function () {
              writersLock.acquire().then(async function([value, release]) {
                // TODO: this does not make sense to me.... the lock should prevent async speed up...??
                bundle += await formatScript(item.filename, item.contents);
                fileCount--;
                // TODO: Not sure if this is a proper fix, only became a problem
                //      when source code contained 111 files and ~17,400 lines
                //      of code.
                if (fileCount === 0) setTimeout(writeBundle, 100);
                release();
              });
              addAfterFiles(item.filename);
            }, 0);
        }
        if (item && item.contents) {
          writersLock.acquire().then(function([value, release]) {
            fileCount++;
            maxFileCount = maxFileCount < fileCount ? fileCount : maxFileCount;
            release();
            addIt(item, i);
          });
        }
      }

      function addAfterFiles(filename) {
        if (afterFiles[filename]) {
          Object.values(afterFiles[filename]).forEach(addScript);
        }
      }
      Object.values(jsFiles).sort(sortFileNames).forEach(addScript);
    }

    this.write = write;
    this.change = change;
  }
}

exports.JsBundler = JsBundler;
