



const Input = require('../input');
const $t = require('../../$t');
const Measurement = require('../../measurement');

class MeasurementInput extends Input {
  constructor(props) {
    props.value = new Measurement(props.value, true);
    super(props);
    props.validation = (value) => !Number.isNaN(new Measurement(value).value());
    props.errorMsg = 'Invalid Mathematical Expression';
    const parentValue = this.value;
    this.value = (val) => {
      if (val !== undefined) return parentValue(new Measurement(val, true)).display();
      return parentValue().display();
    }
  }
}

MeasurementInput.template = new $t('input/measurement');
MeasurementInput.html = (instance) => () => MeasurementInput.template.render(instance);


module.exports = MeasurementInput;
