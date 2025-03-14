const du = require('../../../../../public/js/utils/dom-utils');
const Lookup = require('../../../../../public/js/utils/object/lookup');

du.on.match('change', '[prop-input]', (elem) => {
  const assem = Lookup.get(du.find.up.attribute('lookup-id', elem));
  assem.value(elem.name, elem.value);
});
