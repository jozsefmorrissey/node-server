
const defined = {};
function add (name, input) {
  if (defined[name]) {
    throw new Error(`Input by the name of '${name}' is already defined`)
  }
  defined[name] = input;
}

module.exports = (name, properties) => defined[name].clone(properties);

add('width', new MeasurementInput({
  type: 'text',
  placeholder: 'Length',
  name: 'length',
  class: 'center'
}));

add('depth', new MeasurementInput({
  type: 'text',
  label: 'x',
  placeholder: 'Width',
  name: 'width',
  class: 'center'
}));

add('height', new MeasurementInput({
  type: 'text',
  label: 'x',
  placeholder: 'Depth',
  name: 'depth',
  class: 'center'
}));
