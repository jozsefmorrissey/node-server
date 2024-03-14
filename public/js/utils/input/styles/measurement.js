



const Input = require('../input');
const $t = require('../../$t');
const du = require('../../dom-utils');
const Measurement = require('../../measurement');
const Lookup = require('../../object/lookup.js');

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
    this.measurement = () => value;

    props.errorMsg = 'Invalid Mathematical Expression';
    this.value = () => {
      return value.display();
    }
    const parentSetVal = this.setValue;
    this.setValue = (val, notMetric) => {
      notMetric = notMetric || notMetric === false ? notMetric : true;
      let newVal = this.valid(val) ? ((val instanceof Measurement) ?
                        val : new Measurement(val, notMetric)) : value;
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
  let input = MeasurementInput.get(elem.id);
  if (input === undefined) {
    input = new MeasurementInput({value: elem.value});
    elem.id = input.id();
  } else {
    input.setValue(elem.value);
  }
  const id = elem.parentElement.getAttribute('lookup-id');
  const name = elem.name;
  if (name && id && Lookup && Lookup.get(id)) {
    const target = Lookup.get(id);
    input.setValue(target.pathValue(name, input.measurement().decimal()), false);
  }
  elem.value = input.value();
})

module.exports = MeasurementInput;
