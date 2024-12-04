
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const Measurement = require('../../../../public/js/utils/measurement.js');



class Property {
  // clone constructor(code, value) {
  constructor(code, name, props) {
    let value;// = (typeof props) === 'object' && props !== null ? props.value : undefined;
    const children = [];

    const initVals = {
      code, name, description: props instanceof Object ? props.description : undefined
    }
    Object.getSet(this, initVals, 'value', 'code', 'name', 'description', 'properties');

    this.value = (val, notMetric) => {
      if (val !== undefined && value !== val) {
        if (this.properties().measurement) {
          const measurement = new Measurement(val, notMetric);
          const measurementVal = measurement.value();
          val = Number.isNaN(measurementVal) ? val : measurement;
        }
        value = val;
      }
      return value instanceof Measurement ? value.value() : value;
    }

    this.display = () => {
      return value instanceof Measurement ? value.display() : value;
    }

    this.measurementId = () => value instanceof Measurement ? value.id() : undefined;

    let valueIsFunc = false;
    let clone = false;
    if ((typeof props) !== 'object' ||  props === null) {
      this.properties((props = {measurement: true}));
      this.value(props);
    } else {
      if (!Boolean.is(props.measurement)) props.measurement = true;
      this.properties(props);
      const existingProp = Property.list[code];
      if (props.value !== undefined) {
        if (props.value instanceof Function) {
          valueIsFunc = true;
          this.value = props.value;
        }
        else this.value(props.value, props.notMetric);
      }
    }

    // if (existingProp) {
    //   value = value || existingProp.value();
    //   name = existingProp.name();
    //   this.properties(existingProp.properties());
    //   clone = true;
    // }

    if ((typeof value) === 'number')
      value = new Measurement(value, this.properties().notMetric);


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
      cProps.value = val !== undefined ? val : (valueIsFunc ? this.value : this.value());
      cProps.description = this.description();
      delete cProps.notMetric;
      return new Property(this.code(), this.name(), cProps);
    }

    const parentToJson = this.toJson;
    this.toJson = () => valueIsFunc ? `Function:${this.code()}` : parentToJson();

    if(!clone) Property.list[code] = this;
    else if (!this.properties().copy && Property.list[code]) Property.list[code].addChild(this);
  }
}
Property.list = {};
Property.DO_NOT_CLONE = true;
Property.fromJson = Object.class.staticFromJson(Property);

new Property();

module.exports = Property
