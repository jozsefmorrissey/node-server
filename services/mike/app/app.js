
require('../../../public/js/utils/utils.js');
// Run Tests
require('../tests/run');

const du = require('../../../public/js/utils/dom-utils.js');
const $t = require('../../../public/js/utils/$t.js');
$t.loadFunctions(require('../generated/html-templates'));

const report = require('./pages/report');
const reports = require('./pages/reports');
const configure = require('./pages/configure');

let url = du.url.breakdown().path;
url = url.replace(/^\/mike/, '');

switch (url) {
  case '/configure':
    configure.proccess();
    break;
  case '/report':
    report.proccess();
    break;
  case '/reports':
    reports.proccess();
    break;
}
