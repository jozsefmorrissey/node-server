
const $t = require('../../$t');
const du = require('../../dom-utils');
const CustomEvent = require('../../custom-event');
const Input = require('../input');

class InputObject extends Input {
  constructor(props) {
    super(props);
    Object.getSet(this);
    const instance = this;
    const optionalConfig = [];
    props.list.forEach(input => optionalConfig.push(input.optional()));


    this.value = () => {
      const values = {};
      props.list.forEach(input => input.validation() && (values[input.name()] = input.value()));
      return values;
    }

    const dynamicEvent = CustomEvent.dynamic();
    this.on = dynamicEvent.on;

    function triggerEvent(value, input, event) {
      dynamicEvent.trigger(event, {value, input});
    }
    props.list.forEach(input => input.on('change:click:keyup', triggerEvent));

    this.setValue = () => {
      throw new Error('This function should never get called');
    }

    this.valid = () => {
      if (this.optional()) return true;
      let valid = true;
      props.list.forEach(input => valid &&= input.optional() || input.valid());
      return valid;
    }

    let optional;
    this.optional = (value) => {
      if (value !== true && value !== false) return optional;
      optional = value;
      if (optional)
        props.list.forEach(input => input.optional(true));
      else
        props.list.forEach((input, index) => input.optional(optionalConfig[index]));
    }
    this.optional(props.optional || false);

    this.clone = (properties) => {
      const json = this.toJson();
      json.validation = (properties || props).validation;
      json.list.forEach(i => delete i.id);
      Object.set(json, properties);
      return InputObject.fromJson(json);
    }

    this.empty = () => {
      for (let index = 0; index < props.list.length; index++) {
        if (!props.list[index].empty()) return false
      }
      return true;
    }

  }
}

InputObject.fromJson = (json) => {
  json.list = Object.fromJson(json.list);
  return new InputObject(json);
}

InputObject.template = new $t('input/object');
InputObject.html = (instance) => () => InputObject.template.render(instance);



module.exports = InputObject;
