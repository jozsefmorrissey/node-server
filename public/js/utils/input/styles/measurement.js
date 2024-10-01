



const Input = require('../input');
const $t = require('../../$t');
const du = require('../../dom-utils');
const Measurement = require('../../measurement');
const Lookup = require('../../object/lookup.js');

/** Supported html "directive"
  <input class='measurement-input' name='crownHeight'
            decimal='4.3' units='inch,cm,mm'>
<measurement-input name='crownHeight'
          decimal='4.3' units='inch,cm,mm'/>
**/
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

function initialize(elem) {
  const decimal = elem.getAttribute('decimal');
  const name = elem.getAttribute('name');
  let label = elem.getAttribute('label');
  if (label === null) label = (name && name.toSentance());
  let units = elem.getAttribute('units');
  if (units) units = units.split(',');
  else units = undefined;
  let input = new MeasurementInput({id: elem.id, label, name, units});
  input.setValue(decimal, false);
  elem.outerHTML = input.html();
}

function setValue(elem) {
  let input = MeasurementInput.get(elem.id);
  let unit = elem.getAttribute('unit');
  if (unit === null || unit === 'true') unit = true; if (unit === 'false') unit = false;
  if (unit && unit !== input.unit()) convert(elem);
  const container = du.find.up('[input-id]', elem);
  if (input === undefined) {
    input = new MeasurementInput({value: elem.value});
    elem.id = input.id();
  } else {
    input.setValue(elem.value, unit);
  }

  const id = du.find.up.attribute('lookup-id', elem);
  const name = elem.name;
  if (name && id && Lookup && Lookup.get(id)) {
    const target = Lookup.get(id);
    const decimal = input.measurement().decimal();
    target.pathValue(name, decimal)
    input.setValue(decimal, false);
  }
  elem.value = input.value();
}

du.on.match('click', '.measurement-input-cnt [type="radio"]', convert);
du.on.match('change,focusout', '.measurement-input', setValue);
du.on.match('create', '.measurement-input[decimal],measurement-input[decimal]', initialize);

module.exports = MeasurementInput;
