const MeasurementInput = require('../../../../public/js/utils/input/styles/measurement.js');
const Cost = require('../cost/cost.js');
const Select = require('../../../../public/js/utils/input/styles/select.js');
const Material = require('../cost/types/material.js');
const Company = require('../objects/company.js');
const Input = require('../../../../public/js/utils/input/input.js');
const Labor = require('../cost/types/labor.js');
const Joint = require('../objects/joint/joint.js');
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');

const inputFunc = (name, input) => input instanceof Function ?
        input : input.clone;

function add (name, input) {
  if (inputs[name]) {
    throw new Error(`Input by the name of '${name}' is already defined`)
  }
  inputs[name] = inputFunc(name, input);
}

const inputs = (name, properties) => inputs[name](properties || {});
module.exports = inputs;


add('len', new MeasurementInput({
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

add('Name', new Input({
  name: 'name',
  placeholder: 'Name',
  label: 'Name',
  class: 'center'
}));

add('xyz', new Select({
  name: 'xyz',
  list: {'x': 'X', 'y': 'Y', 'z':'Z'},
  inline: true
}));

add('whd', new Select({
  name: 'xyz',
  list: {'0': 'W', '1': 'H', '2':'D'},
  inline: true
}));

add('joint', (props) => {
  props ||= {};
  const joint = props.joint ||= {constructor: {name:  'Butt'}};
  const selectType = new Select({
    name: '_TYPE',
    list: Object.keys(Joint.types),
    class: 'type',
    value: joint.constructor.name
  });

  let depthInput = new Input({
    label: 'Depth',
    name: 'maleOffset',
    value: joint.maleOffset
  });

  const dit = new DecisionInputTree('Type', {inputArray: [selectType]}, {noSubmission: true});
  const type = dit.root();
  type.then('depth', {inputArray: [depthInput]});
  const cond = DecisionInputTree.getCondition('_TYPE', 'Dado');
  type.conditions.add(cond, 'depth');
  props.onChange && dit.on.change(props.onChange);
  props.onComplete && dit.on.change(props.onComplete);
  return dit;
});

add('dividerJointType', (opening) => {
  return new Select({
    label: 'Type',
    name: 'dividerType',
    list: opening.divider().constructor.Types,
    class: 'divider-type-selector',
    value: opening.divider().type(),
    inline: true
  });
});

add('sectionType', (section, label) => {
  return new Select({
    label: label === false ? '' : label || 'Section Type:',
    name: 'dividerType',
    list: ['Open'].concat(section.constructor.list()
            .map(o => section.coverType.sentance(o.name))),
    class: 'section-type-selector',
    value: section.coverType.sentance(),
    inline: true
  });
});

add('dividerType', (divider, label) => {
  return new Select({
    label: label === false ? '' : label || 'Divider Type',
    name: 'dividerType',
    list: divider.constructor.Types,
    class: 'divider-type-selector',
    value: divider.type(),
    inline: true
  });
});

add('style', (part) => {
  return new Select({
    label: 'Style',
    name: 'style',
    list: ['Overlay', 'Reveal', 'Inset'],
    value: part.resolve('style')
  });
});

add('code', (part) => {
  return new Input({
    label: 'Code',
    name: 'partCode',
    value: part.partCode()
  });
});

add('partName', (part) => {
  return new Input({
    label: 'Name',
    name: 'name',
    value: part.partCode()
  });
});

add('partType', (part) => {
  return new Select({
    name: 'type',
    value: part.type,
    class: 'template-input',
    list: Object.class.filter(c => c.manuallyConfigurable).map(c => c.name)
  });
});
