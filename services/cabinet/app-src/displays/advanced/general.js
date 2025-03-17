const du = require('../../../../../public/js/utils/dom-utils');
const Lookup = require('../../../../../public/js/utils/object/lookup');
const Canvas = require('../canvas');

du.on.match('change', '[prop-input]', (elem) => {
  const assem = Lookup.get(du.find.up.attribute('lookup-id', elem));
  assem.value(elem.name, elem.value);
});

du.on.match('change:keyup', '[lookup-id] .xyz-input[set-name] input', (elem) => {
  const assem = Lookup.get(du.find.up.attribute('lookup-id', elem));
  const setName = du.find.up.attribute('set-name', elem);
  const xOyOz = du.find.up.attribute('name', elem);
  const measurementInput = Lookup.get(elem.id);
  const funcName = `set${setName}`;
  const old = assem.position()[funcName](xOyOz);
  const neW = measurementInput.decimal();
  if (old !== neW) {
    assem.position()[funcName](xOyOz, neW);
    change = true;
  }
});

let change = false;
const renderView = () =>
  change && Canvas.view().render();
Global.on.change.cabinet(() => change = true);
Canvas.on.switch.before(renderView);
du.on.match('blur:enter', '[lookup-id] .xyz-input[set-name] input', renderView);
