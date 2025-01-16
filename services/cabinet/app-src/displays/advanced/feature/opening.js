const $t = require('../../../../../../public/js/utils/$t.js');
const du = require('../../../../../../public/js/utils/dom-utils.js');
const Lookup = require('../../../../../../public/js/utils/object/lookup.js');
const SectionProperties = require('../../../objects/assembly/assemblies/section/section-properties.js');
const MeasurementInput = require('../../../../../../public/js/utils/input/styles/measurement.js');

const template = new $t('sections/helpers/opening');


const render = (section) => {
  const sectionProps = section instanceof SectionProperties ? section : section.parentAssembly();
  const shelveCount = sectionProps.value('shelves') || 0;
  return template.render({section, shelveCount});
};

du.on.match('change', '.opening-feature-cnt [name="shelveCount"]', (elem) => {
  const container = du.find.up('[section-id]', elem);
  const section = Lookup.get(container.getAttribute('section-id'));
  const shelveCount = Number.parseInt(elem.value) || 0;
  const sectionProps = section instanceof SectionProperties ? section : section.parentAssembly();
  sectionProps.value('shelves', shelveCount);
  console.log(sectionProps.value('shelves'));
});


module.exports = render;
