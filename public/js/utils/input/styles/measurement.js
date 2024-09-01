



const Input = require('../input');
const $t = require('../../$t');
const du = require('../../dom-utils');
const Measurement = require('../../measurement');
const Lookup = require('../../object/lookup.js');

class MeasurementInput extends Input {
  constructor(props) {
    let _unit = props.unit === undefined ? true : props.unit;
    let units = props.units;
    let value = new Measurement(props.value, _unit);
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
      return value.display();
    }
    const parentSetVal = this.setValue;
    this.setValue = (val, unit) => {
      if (unit === undefined) unit = _unit;
      let newVal = this.valid(val) ? ((val instanceof Measurement) ?
                        val.decimal() : new Measurement(val, unit).decimal()) : value.decimal();
      if (props.polarity) {
        if (props.polarity === 'positive') {
          if (newVal < 0) newVal = 0;
        } else if (props.polarity === 'negitive') {
          if (newVal > 0) newVal = 0;
        }
      }
      const updated = newVal !== value.decimal();
      if (!Number.isNaN(newVal)) {
        value = new Measurement(newVal, false);
        value.unit(_unit);
      }
      return updated;
    }

    this.validate = (target, eventTriggered) => {
      target = target || getElem(instance.id());
      if (target) {
        if (this.setValue(target[this.targetAttr()])) {
          this.indicateValidity(true);
        } else this.indicateValidity(false);
      }
    }
  }
}

MeasurementInput.template = new $t('input/measurement');
MeasurementInput.html = (instance) => () => MeasurementInput.template.render(instance);

function convert(elem) {
  const container = du.find.up('[input-id]', elem);
  const unitElem = du.find.down('[type="radio"]:checked', container);
  let unit = unitElem && unitElem.value;
  const input = du.find.closest('.measurement-input', elem);
  input.setAttribute('unit', unit);
  let measInput = MeasurementInput.get(input.id);
  unit = measInput.unit(unit);
  input.value = measInput.measurement().display(null, unit);
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
