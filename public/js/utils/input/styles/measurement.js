



const Input = require('../input');
const $t = require('../../$t');
const du = require('../../dom-utils');
const Measurement = require('../../measurement');
const Lookup = require('../../object/lookup.js');

class MeasurementInput extends Input {
  constructor(props) {
    let _unit = props.unit;
    let units = props.units;
    let value = new Measurement(props.value, _unit || true);
    props.value = () => value;
    super(props);

    this.unit = (unit) => unit === undefined ? _unit : (_unit = unit);
    this.units = () => units;
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
      return value.display(null, _unit);
    }
    const parentSetVal = this.setValue;
    this.setValue = (val) => {
      let newVal = this.valid(val) ? ((val instanceof Measurement) ?
                        val : new Measurement(val, _unit)) : value;
      if (props.polarity) {
        if (props.polarity === 'positive') {
          if (newVal.decimal() < 0) newVal = new Measurement(0, _unit);
        } else if (props.polarity === 'negitive') {
          if (newVal.decimal() > 0) newVal = new Measurement(0, _unit);
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

function convert(elem) {
  const container = du.find.up('[input-id]', elem);
  const unitElem = du.find.down('[type="radio"]:checked', container);
  const unit = unitElem && unitElem.value;
  const input = du.find.closest('.measurement-input', elem);
  input.setAttribute('unit', unit);
  let measInput = MeasurementInput.get(input.id);
  measInput.unit(elem.value);
  input.value = measInput.measurement().display(null, elem.value);
  // setValue(elem);
  console.log('change');
}

function setValue(elem) {
    let input = MeasurementInput.get(elem.id);
    if (elem.getAttribute('unit') !== input.unit()) convert(elem);
    const container = du.find.up('[input-id]', elem);
    if (input === undefined) {
      input = new MeasurementInput({value: elem.value});
      elem.id = input.id();
    } else {
      input.setValue(elem.value, true);
    }

    const id = elem.parentElement.getAttribute('lookup-id');
    const name = elem.name;
    if (name && id && Lookup && Lookup.get(id)) {
      const target = Lookup.get(id);
      input.setValue(target.pathValue(name, input.measurement().decimal()), true);
    }
    elem.value = input.value();
}

du.on.match('click', '.measurement-input-cnt [type="radio"]', convert);
du.on.match('change,focusout', '.measurement-input', setValue);

module.exports = MeasurementInput;
