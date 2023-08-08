



const Input = require('../input');
const $t = require('../../$t');
const du = require('../../dom-utils');
const Measurement = require('../../measurement');

class MeasurementInput extends Input {
  constructor(props) {
    let units = props.units;
    let value = new Measurement(props.value, units || true);
    props.value = () => value;
    super(props);

    this.valid = (val) => {
      let testVal;
      if (val) {
        if (val instanceof MeasurementInput) testVal = val.value();
        else testVal = val;
      } else testVal = value.value();
      const valid = !Number.isNaN(testVal);
      this.indicateValidity(valid);
      return valid;
    }

    props.errorMsg = 'Invalid Mathematical Expression';
    this.value = () => {
      return value.display();
    }
    const parentSetVal = this.setValue;
    this.setValue = (val) => {
      let newVal = this.valid(val) ? ((val instanceof Measurement) ?
                        val : new Measurement(val, units || true)) : value;
      if (props.polarity) {
        if (props.polarity === 'positive') {
          if (newVal.decimal() < 0) newVal = new Measurement(0);
        } else if (props.polarity === 'negitive') {
          if (newVal.decimal() > 0) newVal = new Measurement(0);;
        }
      }
      const updated = newVal !== value;
      value = newVal;
      return updated;
    }
  }
}

MeasurementInput.template = new $t('input/measurement');
MeasurementInput.html = (instance) => () => MeasurementInput.template.render(instance);

du.on.match('focusout', '.measurement-input', (elem) => {
  const input = MeasurementInput.get(elem.id);
  elem.value = input.value();
})

module.exports = MeasurementInput;
