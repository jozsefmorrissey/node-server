
const Lookup = require('../lookup.js');


class BottomMaterial extends Lookup {
  constructor (name, cost) {
    super(name);
    Object.getSet(this, 'cost');
    this.cost(cost);
  }
}

// TODO: MOVE!
BottomMaterial.select = function () {
  const Select = require('../../../../../public/js/utils/input/styles/select');
  const list = [];
  for (let index = 0; index < arguments.length; index += 1) {
    const bm = arguments[index];
    list.push(bm.id());
  }
  return new Select({
    label: 'Bottom',
    name: 'bottom',
    format: BottomMaterial.get,
    list
  });
}

module.exports = BottomMaterial;
