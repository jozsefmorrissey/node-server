const fs = require('fs');
const Builder = require('../../building/builder');
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
        .add('../../public/js/utils/')
        .add(htmlDumpLoc)
        .add('./public/json/cabinets.json')
        .add('./app-src/')
        .add('./web-worker/shared/')
        .add('./web-worker/external/')
        // TODO: remove once webworkers are implemented properly this is no longer neccissary
        .add('./web-worker/services/')


if (global.ENV === 'local') {
  jsWatcher.add('./test');
}


const wwDumpLoc = './public/js/web-worker-bundle';
const wwBundler = new JsBundler(wwDumpLoc, [], {main: './services/cabinet/web-worker/internal/init.js', projectDir: '../../'});
const wwWatcher = new Builder(wwBundler.change, wwBundler.write, !global.build)
        .add('../../public/js/utils/utils.js')
        .add('../../public/js/utils/tolerance.js')
        .add('../../public/js/utils/approximate.js')
        .add('../../public/js/utils/tolerance-map.js')
        .add('../../public/js/utils/3d-modeling/csg.js')
        .add('../../public/js/utils/canvas/two-d/objects/')
        .add('../../public/js/utils/canvas/two-d/maps/')
        .add('./app-src/three-d/objects/')
        .add('./web-worker/shared/')
        .add('./web-worker/internal/')
        .add('./web-worker/services/')
