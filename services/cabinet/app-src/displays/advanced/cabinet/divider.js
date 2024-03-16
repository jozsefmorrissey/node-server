
const $t = require('../../../../../../public/js/utils/$t.js');
const du = require('../../../../../../public/js/utils/dom-utils.js');
const Lookup = require('../../../../../../public/js/utils/object/lookup.js');
const Measurement  = require('../../../../../../public/js/utils/measurement.js')
const Select = require('../../../../../../public/js/utils/input/styles/select.js');
const Divider = require('../../../objects/assembly/assemblies/divider.js');

const DividerTypeSelector = (divider) => {
  return new Select({
    label: 'Type',
    name: 'type',
    list: Divider.Types,
    class: 'divider-type-select',
    value: divider.type(),
    inline: true
  });
}


const template = new $t('advanced/cabinet/divider');
const render = (divider) => {
  divider ||= {};
  return template.render({Measurement, DividerTypeSelector, divider, Measurement});
}

du.on.match('change', '[lookup-id] input,[lookup-id] select', (elem) => {
  const divider = Lookup.get(du.find.up.attribute('lookup-id', elem));
  divider.pathValue(elem.name, elem.value);
  const updateInput = elem.nextElementSibling;
  if (updateInput && updateInput.disabled) updateInput.value = new Measurement(divider.eval(elem.value)).display();
});

module.exports = render;
