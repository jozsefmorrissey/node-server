
const $t = require('../../../../../../public/js/utils/$t.js');
const du = require('../../../../../../public/js/utils/dom-utils.js');
const Lookup = require('../../../../../../public/js/utils/object/lookup.js');
const Measurement  = require('../../../../../../public/js/utils/measurement.js')

const template = new $t('advanced/cabinet/divider');
const render = (divider) => {
  divider ||= {};
  return template.render({divider, Measurement});
}

module.exports = render;
