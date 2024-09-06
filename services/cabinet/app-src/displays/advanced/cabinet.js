
const $t = require('../../../../../public/js/utils/$t.js');
const du = require('../../../../../public/js/utils/dom-utils.js');
const Lookup = require('../../../../../public/js/utils/object/lookup.js');
const dividerHtml = require('./cabinet/divider');
const Vertex3D = require('../../three-d/objects/vertex.js');
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Divider = require('../../objects/assembly/assemblies/divider.js');
const SectionProperties = require('../../objects/assembly/assemblies/section/section-properties.js');

const partHtml = (part) => {
  if (part instanceof Divider) return dividerHtml(part);
  return 'Not Configured';
}

const template = new $t('advanced/cabinet');
const render = (cabinet) => {
  const parts = Object.values(cabinet.subassemblies).filter(sa => !(sa instanceof SectionProperties))
  return template.render({cabinet, partHtml, parts});
}

du.on.match('click', '[name="has-frame"]', (elem) => {
  const id = du.find.up.attribute('lookup-id', elem);
  const divider = Lookup.get(id);
  divider.value('fls', !elem.checked);
  du.find.closest('.frame-width-cnt', elem).hidden = !elem.checked;
});

module.exports = render;
