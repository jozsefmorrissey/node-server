const fs = require('fs');
const shell = require('shelljs');
const { Mutex, Semaphore } = require('async-mutex');

const host = process.argv[2];

function HachyImport(url, dest) {
  const curlCmd = `curl -X GET --insecure '${url}'`;
  const code = shell.exec(curlCmd, {silent: true}).stdout;
  if (code !== '') {
    fs.writeFile(`./generated/hacky/${dest}`, code, () =>
        console.warn(`HackyImport: \n\t./generated/hacky/${dest}\n\t${url}`));
  }
}

HachyImport(`${host}/endpoints`, 'EPNTS.js');

const Builder = require('../../building/builder');

const { HtmlBundler } = require('../../building/bundlers/html.js');
const htmlDumpLoc = './generated/html-templates.js';

const cleanReg = /^(\.\.\/\.\.\/public\/html\/templates\/|.\/public\/html\/templates\/)(.*).html/;
const cleanName = (name) => name.replace(cleanReg, '$2');
const htmlBundler = new HtmlBundler(htmlDumpLoc, cleanName);

new Builder(htmlBundler.change, htmlBundler.write, !global.build)
        .add('./public/html/templates/');




// const { JsBundler } = require('../../building/bundlers/js.js');
//
// const jsDumpLoc = './public/js/index';
// const jsBundler = new JsBundler(jsDumpLoc, [], {projectDir: __dirname, main: 'app/app.js'});
// const jsWatcher = new Builder(jsBundler.change, jsBundler.write, !global.build)
//         .add('../../public/js/$t.js')
//         .add(htmlDumpLoc)
//         .add('../../public/js/utils/')
//         .add('./src/')
//         .add('./app');
