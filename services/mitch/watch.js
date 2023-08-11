const fs = require('fs');
const shell = require('shelljs');
const { Mutex, Semaphore } = require('async-mutex');
const Builder = require('../../building/builder');

const { HtmlBundler } = require('../../building/bundlers/html.js');
const htmlDumpLoc = './generated/html-templates.js';

const cleanReg = /^(\.\.\/\.\.\/public\/html\/templates\/|.\/public\/html\/templates\/)(.*).html/;
const cleanName = (name) => name.replace(cleanReg, '$2');
const htmlBundler = new HtmlBundler(htmlDumpLoc, cleanName);

new Builder(htmlBundler.change, htmlBundler.write, !global.build)
        .add('../../public/html/templates/')
        .add('./public/html/templates/');

const { JsBundler } = require('../../building/bundlers/js.js');

const jsDumpLoc = './public/js/index';
const jsBundler = new JsBundler(jsDumpLoc, [], {projectDir: __dirname, main: 'app/app.js'});
const jsWatcher = new Builder(jsBundler.change, jsBundler.write, !global.build)
        .add('../../public/json/configure.json')
        .add('../../public/js/utils/$t.js')
        .add('../../public/js/utils/request.js')
        .add('../../public/js/utils/object/lookup.js')
        .add('../../public/js/utils/object/imposter.js')
        .add('../../public/js/utils/expression-definition.js')
        .add('../../public/js/utils/custom-event.js')
        .add('../../public/js/utils/measurement.js')
        .add('../../public/js/utils/string-math-evaluator.js')
        .add('../../public/js/utils/services/function-cache.js')
        .add('../../public/js/utils/dom-utils.js')
        .add('../../public/js/utils/utils.js')
        .add('../../public/js/utils/data-sync.js')
        .add('../../public/js/utils/conditions.js')
        .add('../../public/js/utils/decision-tree.js')
        .add('../../public/js/utils/input')
        .add('../../public/js/utils/test/')
        .add(htmlDumpLoc)
        // .add('../../public/js/utils/')
        .add('./app/')
        .add('./tests/')
