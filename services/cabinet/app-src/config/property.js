
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const Measurement = require('../../../../public/js/utils/measurment.js');



class Property extends Lookup {
  // clone constructor(code, value) {
  constructor(code, name, props) {
    super();
    let value;
    const children = [];

    const initVals = {
      code, name
    }
    Object.getSet(this, initVals, 'value', 'code', 'name', 'properties');

    this.value = (val) => {
      if (val !== undefined && value !== val) {
        const measurment = new Measurement(val);
        const measurmentVal = measurment.value();
        value = Number.isNaN(measurmentVal) ? val : measurment;
      }
      return value instanceof Measurement ? value.value() : value;
    }

    this.display = () => {
      return value instanceof Measurement ? value.display() : value;
    }

    this.description = () => this.properties().description;
    this.measurementId = () => value instanceof Measurement ? value.id() : undefined;

    if ((typeof props) !== 'object' ||  props === null) {
      this.value(props);
      props = {};
    }
    this.properties(props || {});

    const existingProp = Property.list[code];
    let clone = false;
    if (existingProp) {
      value = existingProp.value();
      if ((typeof value) === 'number')
        value = new Measurement(value, true);
      name = existingProp.name();
      this.properties(existingProp.properties());
      clone = true;
    } else if (value === undefined){
      this.value(this.properties().value);
    }

    this.addChild = (property) => {
      if (property instanceof Property && property.code() === this.code()) {
            if (children.indexOf(property) === -1) children.push(property);
            else throw new Error('Property is already a child');
      }
      else throw new Error('Child is not an instance of Property or Code does not match');
    }

    this.children = () => JSON.clone(children);

    this.equals = (other) => false ||
        other instanceof Property &&
        this.value() === other.value() &&
        this.code() === other.code() &&
        this.name() === other.name() &&
        this.description() === other.description();

    this.clone = (val) => {
      const cProps = this.properties();
      cProps.clone = true;
      cProps.value = val;
      return new Property(code, name, props);
    }
    if(!clone) Property.list[code] = this;
    else if (!this.properties().copy && Property.list[code]) Property.list[code].addChild(this);
  }
}
Property.list = {};

new Property();
const p = Object.fromJson({
    "_TYPE": "Property",
    "id": "b7r4yen",
    "code": "r",
    "name": "Reveal",
    "value": 0.125,
    "properties": {
        "_TYPE": "Property",
        "id": "22222",
        "code": "ree",
        "name": "req",
        "value":12,
        "properties": {toocheei: 'madamuelle'}
    }
});
console.log(p.id(), p.code(), p.name(), p.value(), p.properties())


module.exports = Property
