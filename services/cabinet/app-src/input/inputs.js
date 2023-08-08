const MeasurementInput = require('../../../../public/js/utils/input/styles/measurement.js');
const Cost = require('../cost/cost.js');
const Select = require('../../../../public/js/utils/input/styles/select.js');
const Material = require('../cost/types/material.js');
const Company = require('../objects/company.js');
const Input = require('../../../../public/js/utils/input/input.js');
const Labor = require('../cost/types/labor.js');


const defined = {};
function add (name, input) {
  if (defined[name]) {
    throw new Error(`Input by the name of '${name}' is already defined`)
  }
  defined[name] = input;
}

module.exports = (name, properties) => defined[name].clone(properties);


add('length', new MeasurementInput({
  type: 'text',
  placeholder: 'Length',
  name: 'length',
  class: 'center'
}));

add('width', new MeasurementInput({
  type: 'text',
  label: 'x',
  placeholder: 'Width',
  name: 'width',
  class: 'center'
}));

add('depth', new MeasurementInput({
  type: 'text',
  label: 'x',
  placeholder: 'Depth',
  name: 'depth',
  class: 'center'
}));

add('cost', new MeasurementInput({
  type: 'number',
  label: '$',
  placeholder: 'Cost',
  name: 'cost'
}));

add('pattern', new MeasurementInput({
  type: 'text',
  class: 'pattern-input',
  polarity: 'positive'
}));


add('offsetLen', new MeasurementInput({
  type: 'text',
  label: 'Offset',
  placeholder: 'Length',
  name: 'offsetLength',
  class: 'center',
}));

add('offsetWidth', new MeasurementInput({
  type: 'text',
  label: 'x',
  placeholder: 'Width',
  name: 'offsetWidth',
  class: 'center',
}));

add('offsetDepth', new MeasurementInput({
  type: 'text',
  label: 'x',
  placeholder: 'Depth',
  name: 'offsetDepth',
  class: 'center',
}));


add('costType', new Select({
  placeholder: 'Type',
  name: 'type',
  class: 'center',
  list: Cost.typeList
}));

add('method', new Select({
  name: 'method',
  class: 'center',
  list: Material.methodList,
}));

add('company', new Select({
  name: 'company',
  label: 'Company',
  class: 'center',
  list: [''].concat(Object.keys(Company.list)),
  value: ''
}));

add('childCost', new Select({
    name: 'child',
    label: 'Default',
    class: 'center',
}));


add('id', new Input({
  type: 'text',
  placeholder: 'Id',
  name: 'id',
  class: 'center',
  validation: /^\s*[^\s]{1,}\s*$/,
  errorMsg: 'You must enter an Id'
}));

add('propertyId', new Input({
  type: 'text',
  placeholder: 'Property Id',
  name: 'propertyId',
  class: 'center',
  validation: /^[a-zA-Z\.]{1}$/,
  errorMsg: 'Alpha Numeric Value seperated by \'.\'.<br>I.E. Cabinet=>1/2 Overlay = Cabinet.12Overlay'
}));

add('propertyValue', new Input({
  type: 'text',
  placeholder: 'Property Value',
  name: 'propertyValue',
  class: 'center'
}));

add('costId', new Input({
  type: 'text',
  placeholder: 'Id',
  name: 'id',
  class: 'center',
  validation: (id, values) =>
      id !== '' && (!values.referenceable || Object.values(Cost.defined).indexOf(id) === -1),
  errorMsg: 'You must an Id: value must be unique if Referencable.'
}));

add('name', new Input({
  type: 'text',
  placeholder: 'Name',
  name: 'name',
  value: 'peach',
  class: 'center',
  validation: /^\s*[^\s].*$/,
  errorMsg: 'You must enter a Name'
}));

add('color', new Input({
  type: 'color',
  validation: /.*/,
  placeholder: 'color',
  name: 'color',
  class: 'center'
}));

add('optional', new Input({
  label: 'Optional',
  name: 'optional',
  type: 'checkbox',
  default: false,
  validation: [true, false],
  targetAttr: 'checked'
}));

add('modifyDemension', new Input({
  label: 'Modify Demension',
  name: 'modifyDemension',
  type: 'checkbox',
  default: false,
  validation: [true, false],
  targetAttr: 'checked'
}));

add('partNumber', new Input({
  label: 'Part Number',
  name: 'partNumber',
  type: 'text'
}));

add('count', new Input({
  label: 'Count',
  name: 'count',
  type: 'number',
  value: 1
}));

add('quantity', new Input({
  label: 'Quantity',
  name: 'quantity',
  type: 'number',
  value: 0
}));

add('hourlyRate', new Input({
  label: 'Hourly Rate',
  name: 'hourlyRate',
  type: 'number',
}));

add('hours', new Input({
  label: 'Hours',
  name: 'hours',
  type: 'number',
  value: 0
}));

add('laborType', new Input({
  name: 'laborType',
  placeholder: 'Labor Type',
  label: 'Type',
  class: 'center',
  clearOnClick: true,
  list: Labor.types
}));

add('formula', new Input({
  name: 'formula',
  placeholder: 'Formula',
  label: 'Formula',
  class: 'center'
}));
