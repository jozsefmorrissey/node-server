



const Input = require('../input');
const $t = require('../../$t');
const StringMathEvaluator = require('../../string-math-evaluator');

class MeasurementInput extends Input {
  constructor(props) {
    super(props);
    props.validation = (value) => typeof MeasurementInput.eval(value) === 'number';
    props.errorMsg = 'Invalid Mathematical Expression';
    const parentValue = this.value;
    this.value = () => MeasurementInput.eval(parentValue());
  }
}

MeasurementInput.template = new $t('input/measurement');
MeasurementInput.html = (instance) => () => MeasurementInput.template.render(instance);
MeasurementInput.eval = new StringMathEvaluator(Math).eval;

MeasurementInput.len = (value) => new MeasurementInput({
  type: 'text',
  placeholder: 'Length',
  name: 'length',
  class: 'center',
  value
});
MeasurementInput.width = (value) => new MeasurementInput({
  type: 'text',
  placeholder: 'Width',
  name: 'width',
  class: 'center',
  value
});
MeasurementInput.height = (value) => new MeasurementInput({
  type: 'text',
  label: 'x',
  placeholder: 'Height',
  name: 'height',
  class: 'center',
  value
});
MeasurementInput.depth = (value) => new MeasurementInput({
  type: 'text',
  label: 'x',
  placeholder: 'Depth',
  name: 'depth',
  class: 'center',
  value
});
MeasurementInput.cost = () => new MeasurementInput({
  type: 'number',
  label: '$',
  placeholder: 'Cost',
  name: 'cost',
  value
});
MeasurementInput.pattern = (id, value) => new MeasurementInput({
  type: 'text',
  label: id,
  value,
  placeholder: id,
  name: id,
  class: 'pattern-input',
});

MeasurementInput.offsetLen = () => new MeasurementInput({
  type: 'text',
  label: 'Offset',
  placeholder: 'Length',
  name: 'offsetLength',
  class: 'center',
});
MeasurementInput.offsetWidth = () => new MeasurementInput({
  type: 'text',
  label: 'x',
  placeholder: 'Width',
  name: 'offsetWidth',
  class: 'center',
});
MeasurementInput.offsetDepth = () => new MeasurementInput({
  type: 'text',
  label: 'x',
  placeholder: 'Depth',
  name: 'offsetDepth',
  class: 'center',
});

module.exports = MeasurementInput;




