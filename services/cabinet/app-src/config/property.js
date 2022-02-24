
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const Measurement = require('../../../../public/js/utils/measurment.js');



class Property extends Lookup {
  // clone constructor(code, value) {
  constructor(code, name, props) {
    super();
    let value;
    const children = [];

    const initVals = {
      code, name, description: props instanceof Object ? props.description : undefined
    }
    Object.getSet(this, initVals, 'value', 'code', 'name', 'description', 'properties');

    this.value = (val, metric) => {
      if (val !== undefined && value !== val) {
        const measurment = new Measurement(val, metric);
        const measurmentVal = measurment.value();
        value = Number.isNaN(measurmentVal) ? val : measurment;
      }
      return value instanceof Measurement ? value.value() : value;
    }

    this.display = () => {
      return value instanceof Measurement ? value.display() : value;
    }

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

    this.equals = (other) =>
        other instanceof Property &&
        this.value() === other.value() &&
        this.code() === other.code() &&
        this.name() === other.name() &&
        this.description() === other.description();

    this.clone = (val) => {
      const cProps = this.properties();
      cProps.clone = true;
      cProps.value = val;
      cProps.description = this.description();
      return new Property(code, name, cProps);
    }
    if(!clone) Property.list[code] = this;
    else if (!this.properties().copy && Property.list[code]) Property.list[code].addChild(this);
  }
}
Property.list = {};

new Property();

module.exports = Property
