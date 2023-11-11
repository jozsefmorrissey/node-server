const fs = require('fs');
const shell = require('shelljs');
const { Mutex, Semaphore } = require('async-mutex');
require('../../arguement-parcer')
const Builder = require('../../building/builder');

const { HtmlBundler } = require('../../building/bundlers/html.js');
const htmlDumpLoc = './generated/html-templates.js';

const cleanName = (name) => name.replace(/(..\/..|\.)\/public\/html\/templates\/(.*).html/, '$2');
const htmlBundler = new HtmlBundler(htmlDumpLoc, cleanName);

new Builder(htmlBundler.change, htmlBundler.write, !global.build)
        .add('../../public/html/templates/orientation-arrows.html');

const { JsBundler } = require('../../building/bundlers/js.js');
const jsDumpLoc = './public/js/index';
const jsBundler = new JsBundler(jsDumpLoc, [], {main: './services/canvas-buddy/app/app.js', projectDir: '../../'});

const jsWatcher = new Builder(jsBundler.change, jsBundler.write, !global.build)
        .add('./app/')
        .add('../../public/js/utils/dom-utils.js')
        .add('../../public/js/utils/utils.js')
        .add('../../public/js/utils/measurement.js')
        .add('../../public/js/utils/object/lookup.js')
        .add('../../public/js/utils/services/function-cache.js')
        .add('../../public/js/utils/string-math-evaluator.js')
        .add('../../public/js/utils/$t.js')
        .add('../../public/js/utils/custom-event.js')
        .add('../../public/js/utils/expression-definition.js')
        .add('../../public/js/utils/approximate.js')
        .add('../../public/js/utils/tolerance.js')
        .add('../../public/js/utils/display/pop-up.js')
        .add('../../public/js/utils/display/drag-drop.js')
        .add('../../public/js/utils/display/catch-all.js')
        .add('../../public/js/utils/display/resizer.js')
        .add('../../public/js/utils/display/orientation-arrows.js')
        .add('../../public/js/utils/tolerance-map.js')
        .add('../../public/js/utils/canvas/')
        .add('../../public/js/utils/3d-modeling/')
        .add('./generated/html-templates.js');
        // .add(htmlDumpLoc)
