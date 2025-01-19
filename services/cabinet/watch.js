require('../../public/js/utils/std-lib/init');
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
        .add('./public/json/cabinets/')
        .add('./app-src/')
        .add('./web-worker/shared/')
        .add('./web-worker/external/')
        .add('./web-worker/internal/services/');


if (global.ENV === 'local') {
  jsWatcher.add('./test')
}


const wwDumpLoc = './public/js/web-worker-bundle';
const wwBundler = new JsBundler(wwDumpLoc, [], {main: './services/cabinet/web-worker/internal/init.js', projectDir: '../../'});
const wwWatcher = new Builder(wwBundler.change, wwBundler.write, !global.build)
        .add('../../public/js/utils/std-lib/')
        .add('../../public/js/utils/tolerance.js')
        .add('../../public/js/utils/tolerance-map.js')
        .add('../../public/js/utils/string-math-evaluator.js')
        .add('../../public/js/utils/services/function-cache.js')
        .add('../../public/js/utils/object/lookup.js')
        .add('../../public/js/utils/3d-modeling/')
        .add('../../public/js/utils/canvas/')
        .add('./app-src/two-d/layout/')
        .add('./web-worker/shared/')
        .add('./web-worker/internal/')


const stlDumpLoc = './public/js/STL';
const stlBundler = new JsBundler(stlDumpLoc, [], {main: './public/js/utils/test/tests/STL.js', projectDir: '../../'});
const stlWatcher = new Builder(stlBundler.change, stlBundler.write, !global.build)
        .add('../../public/js/utils/3d-modeling/')
        .add('../../public/js/utils/test/tests/STL.js')
        .add('../../public/js/utils/std-lib/init.js')
        .add('../../public/js/utils/canvas/')
        .add('../../public/js/utils/tolerance.js')
        .add('../../public/js/utils/tolerance-map.js')
        .add('../../public/js/utils/dom-utils.js')
        .add('../../public/js/utils/display/orientation-arrows.js')
        .add('../../public/js/utils/expression-definition.js')
        .add('../../public/js/utils/$t.js')
        .add('../../public/json/alpha-numeric-point-maps/')
        .add('../../public/js/utils/object/lookup.js')
        .add('../../public/js/utils/custom-event.js')
        .add(htmlDumpLoc)
