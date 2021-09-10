



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


module.exports = MeasurementInput;
