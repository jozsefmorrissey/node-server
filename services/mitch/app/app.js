const $t = require('../../../public/js/utils/$t.js');
$t.loadFunctions(require('../generated/html-templates'));

require('../../../public/js/utils/utils.js');
// Run Tests
// require('../tests/run');

const du = require('../../../public/js/utils/dom-utils.js');

let url = du.url.breakdown().path;
url = url.replace(/^\/mitch/, '');

const pageJs = require(`./pages${url}`);
pageJs.proccess();
