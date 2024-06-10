
const Global = require('../../services/global.js');
const $t = require('../../../../../public/js/utils/$t.js');
const du = require('../../../../../public/js/utils/dom-utils.js');

const template = new $t('cabinet/notes');

function html() {
  const cabinet = Global.cabinet();
  return template.render({cabinet});
}

du.on.match('keyup', '.cab-notes', (elem) => {
  const cabinet = Global.cabinet();
  cabinet.notes(elem.value);
});
module.exports = html
