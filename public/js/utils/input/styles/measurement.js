



const Input = require('../input');
const $t = require('../../$t');
const Measurement = require('../../measurement');

class MeasurementInput extends Input {
  constructor(props) {
    let value = new Measurement(props.value, true);
    props.value = () => value;
    super(props);
    props.validation = (val) =>
        !Number.isNaN(val && val.display ? value : new Measurement(val).value());
    props.errorMsg = 'Invalid Mathematical Expression';
    this.value = () => {
      return value.display();
    }
    const parentSetVal = this.setValue;
    this.setValue = (val) => {
      let newVal = props.validation(val) ? ((val instanceof Measurement) ?
                        val : new Measurement(val, true)) : value;
      const updated = newVal !== value;
      value = newVal;
      return updated;
    }
  }
}

MeasurementInput.template = new $t('input/measurement');
MeasurementInput.html = (instance) => () => MeasurementInput.template.render(instance);


module.exports = MeasurementInput;
