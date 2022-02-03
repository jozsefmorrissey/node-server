
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const Measurement = require('../../../../public/js/utils/measurment.js');

let percision = '1/32';

class Property extends Lookup {
  // clone constructor(code, value) {
  constructor(code, name, props) {
    super();
    let value;
    if ((typeof props) !== 'object' ||  props === null) {
      value = props;
      props = {};
    }
    const initVals = {
      _IMMUTABLE: true,
      description: props.description,
      code, name
    }
    Object.getSet(this, props, 'code', 'name', 'description', 'properties');
    Object.getSet(this, {}, 'value', 'name', 'description');
    const existingProp = Property.list[code];
    let clone = false;
    if (existingProp) {
      value = name !== undefined ? name : existingProp.value();
      name = existingProp.name();
      props = existingProp.properties();
      clone = true;
    } else if (value === undefined){
      props = props || {};
      value = props.value;
    }

    let decimal = NaN;
    let imperial = NaN;
    function evalValue() {
      decimal = new Measurement(value).decimal(percision);
      imperial = new Measurement(value).fraction(percision);
    }
    this.decimal = () => new Measurement(value).decimal(percision);
    this.value = (val) => {
      if (val !== undefined && value !== val) {
        value = val;
        evalValue();
      }
      return value;
    }
    this.standard = () => new Measurement(value).fraction(percision);
    this.properties = () => JSON.parse(JSON.stringify(props));
    this.clone = (val) => {
      return new Property(code, val);
    }
    if(!clone) Property.list[code] = this;
    evalValue();
  }
}

Property.list = {};

module.exports = Property
