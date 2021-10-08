
const Lookup = require('../../../../public/js/utils/object/lookup.js');

class Property extends Lookup {
  // clone constructor(code, value) {
  constructor(code, name, props) {
    super();
    let value;
    if ((typeof props) !== 'object') {
      value = props;
      props = {};
    }
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
    this.code = () => code;
    this.name = () => name;
    this.description = () => props.description;
    this.value = (val) => {
      if (val !== undefined) value = val;
      return value;
    }
    this.properties = () => JSON.parse(JSON.stringify(props));
    this.clone = (val) => {
      return new Property(code, val);
    }
    if(!clone) Property.list[code] = this;
  }
}

Property.list = {};

module.exports = Property
