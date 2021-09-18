class Property {
  // clone constructor(id, value) {
  constructor(id, name, props) {
    let value;
    if ((typeof props) !== 'object') {
      value = props;
      props = {};
    }
    const existingProp = Property.list[id];
    let clone = false;
    if (existingProp) {
      this.name = existingProp.name();
      props = existingProp.properties();
      value = name;
      clone = true;
    } else if (value === undefined){
      props = props || {};
      value = props.value;
    }
    this.id = () => id;
    this.name = () => name;
    this.values = () => JSON.parse(JSON.stringify(props.values));
    this.description = () => props.description;
    this.value = (val) => {
      if (val !== undefined) value = val;
      return value;
    }
    this.properties = () => props;
    this.clone = (val) => {
      return new Property(id, name, val, props);
    }
    if(!clone) Property.list[id] = this;
  }
}

Property.list = {};

module.exports = Property
