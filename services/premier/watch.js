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
        .add('../../public/html/templates/')
        .add('./public/html/templates/');


function onObjectChange(jsFile, bundler) {
  const hyphenToCamel = (match, one, two, three) => three.toUpperCase();
  let header = '';
  let resolver = `function objectResolver(obj) {
    const type = obj._TYPE;
    switch(type) {\n`
  bundler.allFileNames().forEach((fileName) => {
    let className = fileName.replace(/^.*\/(.*?)\.js$/, '$1');
    className = className.replace(/((^|[^a-z^A-Z^0-9])([a-z]))/g, hyphenToCamel);
    header += `const ${className} = require('${fileName}');\n`;
    resolver += `      case '${className}': return new ${className}(obj.id).fromJson(obj);\n`;
  });

  footer = `      default: return JSON.clone(obj);
    }
  }

  exports = objectResolver;`;
  const script = header + resolver + footer;
  fs.writeFile(`./generated/object-resolver.js`, script);
}


const { JsBundler } = require('../../building/bundlers/js.js');

const jsDumpLoc = './public/js/index';
const jsBundler = new JsBundler(jsDumpLoc, [], {projectDir: __dirname, main: 'app/app.js'});
const jsWatcher = new Builder(jsBundler.change, jsBundler.write, !global.build)
        .add('../../public/js/$t.js')
        .add(htmlDumpLoc)
        .add('../../public/js/utils/')
        .add('./src/utils.js')
        .add('./src/objects')
        .add('./src/object-resolver.js')
        .add('./app');
