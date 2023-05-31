



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
    props.validation = (val) =>
        !Number.isNaN(val && val.display ? value : new Measurement(val, units || true).value());
    props.errorMsg = 'Invalid Mathematical Expression';
    this.value = () => {
      return value.display();
    }
    const parentSetVal = this.setValue;
    this.setValue = (val) => {
      let newVal = props.validation(val) ? ((val instanceof Measurement) ?
                        val : new Measurement(val, units || true)) : value;
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
