const fs = require('fs');
const Builder = require('../../building/watcher');

const { HtmlBundler } = require('../../building/bundlers/html.js');
const htmlDumpLoc = './generated/html-templates.js';

const cleanName = (name) => name.replace(/(..\/..|\.)\/public\/html\/templates\/(.*).html/, '$2');
const htmlBundler = new HtmlBundler(htmlDumpLoc, cleanName);

new Builder(htmlBundler.change, htmlBundler.write, !global.build)
        .add('../../public/html/templates/')
        .add('./public/html/templates/');





const ENPTSTemplate = `const Endpoints = require('../../../public/js/utils/endpoints.js');
const json = require('../public/json/endpoints.json');
module.exports = new Endpoints(json, '${global.ENV}').getFuncObj();`;
fs.writeFile(`./generated/EPNTS.js`, ENPTSTemplate, () => {});


const { JsBundler } = require('../../building/bundlers/js.js');
const jsDumpLoc = './public/js/index';
const jsBundler = new JsBundler(jsDumpLoc, [], {main: './services/cabinet/app-src/init.js', projectDir: '../../'});

const jsWatcher = new Builder(jsBundler.change, jsBundler.write, !global.build)
        .add('./globals/')
        .add('./public/json/endpoints.json')
        .add('./generated/EPNTS.js')
        .add('./public/js/3d-modeling/lightgl.js')
        .add('./public/js/3d-modeling/csg.js')
        .add('./public/js/3d-modeling/export-dxf.js')
        .add('./public/js/3d-modeling/viewer.js')
        .add('../../public/js/utils/')
        .add(htmlDumpLoc)
        .add('./public/json/cabinets.json')
        .add('./app-src');

if (global.ENV === 'local') {
  jsWatcher.add('./test');
}
