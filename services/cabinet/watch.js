const fs = require('fs');
const shell = require('shelljs');
const { Mutex, Semaphore } = require('async-mutex');

const host = process.argv[2];

function HachyImport(url, dest) {
  const curlCmd = `curl -X GET --insecure '${url}'`;
  console.log(curlCmd)
  const code = shell.exec(curlCmd, {silent: true}).stdout;
  if (code !== '') {
    fs.writeFile(`./generated/hacky/${dest}`, code, () =>
        console.warn(`HackyImport: \n\t./generated/hacky/${dest}\n\t${url}`));
  }
}

HachyImport(`${host}/endpoints`, 'EPNTS.js');

class Watcher {
  constructor(onChange, onUpdate) {
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
          console.log('ran file: ', `${file.name} - ${position}`);
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

    const pending = {};
    const dirs = {};
    function watch(item, parent) {
      const path = item.isDirectory() || parent === undefined ?
            item.name : `${parent}${item.name}`.replace(/\/{2,}/g, '/');
      pending[path] = {};
      console.log(`Watching: ${path} - ${positions[item.name]}`);
      fs.watch(path, { encoding: 'utf8' }, (eventType, filename) => {
        function wait(release) {
          if (pending[path][filename]) {release();return;}
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
      });
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
        console.log(fileOdir)
        stats.name = fileOdir;
        if (stats.isDirectory() || stats.isFile()){
          watch(stats);
        }
      });
      return this;
    }
    this.positions = positions;
  }
}

const { HtmlBundler } = require('./building/bundlers/html.js');
const htmlDumpLoc = './generated/html-templates.js';
const cleanName = (name) => name.replace(/\.\/public\/html\/templates\/(.*).html/, '$1');
const htmlBundler = new HtmlBundler(htmlDumpLoc, cleanName);

new Watcher(htmlBundler.change, htmlBundler.write)
        .add('./public/html/templates/');




const { JsBundler } = require('./building/bundlers/js.js');
const jsDumpLoc = './public/js/index';
const jsBundler = new JsBundler(jsDumpLoc, []);

new Watcher(jsBundler.change, jsBundler.write)
        .add('./globals/')
        .add('./public/js/3d-modeling/lightgl.js')
        .add('./public/js/3d-modeling/csg.js')
        .add('./public/js/3d-modeling/viewer.js')
        .add('../../public/js/$t.js')
        .add(htmlDumpLoc)
        .add('./generated/hacky/EPNTS.js')
        .add('./app-src');
