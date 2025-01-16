const $t = require('../../../../../../public/js/utils/$t.js');
const du = require('../../../../../../public/js/utils/dom-utils.js');
const Lookup = require('../../../../../../public/js/utils/object/lookup.js');
const Handle = require('../../../objects/assembly/assemblies/hardware/pull.js');
const MeasurementInput = require('../../../../../../public/js/utils/input/styles/measurement.js');

const template = new $t('sections/helpers/pulls');

const sizeInputHtmlFunc = (hasPulls) => (index) => {
  const value = new Measurement(hasPulls.pull(index).centerToCenter()).display();
  const units = [Measurement.units()[1], Measurement.units()[2]];
  const unit = units[0];
  const label = 'c2c';
  return new MeasurementInput({value, unit, units, name: label, label}).html();
}

const render = (hasPulls, prefix, open) => {
  const sizeInputHtml = sizeInputHtmlFunc(hasPulls);
  return template.render({hasPulls, sizeInputHtml, prefix, open});
};

const getPrefix = (target) => du.find.closest('.pulls-mod-cnt', target).getAttribute('prefix');

du.on.match('click', '.pulls-mod-cnt .add-pull', (elem) => {
  const id = du.find.up.attribute('has-pulls-id', elem);
  const hasPulls = Lookup.get(id);
  hasPulls.addPull(Handle.location.CENTER);
  const prefix = getPrefix(elem);
  du.find.up('.pulls-mod-cnt', elem).outerHTML = render(hasPulls, prefix, true);
});

du.on.match('click', '.pulls-mod-cnt .remove-btn', (elem) => {
  const id = du.find.up.attribute('has-pulls-id', elem);
  const hasPulls = Lookup.get(id);
  const index = du.find.up('[index]', elem).getAttribute('index');
  hasPulls.removePull(hasPulls.pulls()[index]);
  const prefix = getPrefix(elem);
  du.find.up('.pulls-mod-cnt', elem).outerHTML = render(hasPulls, prefix, true);
});

du.on.match('change', '.pulls-mod-cnt [name="location"]', (elem) => {
  const id = du.find.up.attribute('has-pulls-id', elem);
  const hasPulls = Lookup.get(id);
  const index = du.find.up.attribute('index', elem);
  hasPulls.pulls()[index].location(Handle.location[elem.value]);
});

du.on.match('change', '.pulls-mod-cnt [name="c2c"]', (elem) => {
  const input = MeasurementInput.get(elem.id);
  const id = du.find.up.attribute('has-pulls-id', elem);
  const hasPulls = Lookup.get(id);
  const index = du.find.up.attribute('index', elem);
  hasPulls.pulls()[index].centerToCenter(input.measurement().value());
  console.log(input);
});


module.exports = render;
