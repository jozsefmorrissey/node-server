const $t = require('../../../../../../public/js/utils/$t.js');
const du = require('../../../../../../public/js/utils/dom-utils.js');
const Lookup = require('../../../../../../public/js/utils/object/lookup.js');
const Handle = require('../../../objects/assembly/assemblies/hardware/pull.js');

const template = new $t('sections/helpers/pulls');

const render = (hasPulls) => {
  return template.render({hasPulls});
};

du.on.match('click', '.pulls-mod-cnt .add-pull', (elem) => {
  const id = du.find.up.attribute('has-pulls-id', elem);
  const hasPulls = Lookup.get(id);
  hasPulls.addPull(Handle.location.CENTER);
  du.find.up('.pulls-mod-cnt', elem).outerHTML = render(hasPulls);
});

du.on.match('change', '.pulls-mod-cnt [name="location"]', (elem) => {
  const id = du.find.up.attribute('has-pulls-id', elem);
  const hasPulls = Lookup.get(id);
  const index = du.find.up.attribute('index', elem);
  hasPulls.pulls()[index].location(Handle.location[elem.value]);
});


module.exports = render;
