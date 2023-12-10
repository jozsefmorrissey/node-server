
const $t = require('../../$t');
const du = require('../../dom-utils');
const CustomEvent = require('../../custom-event');
const Input = require('../input');

class InputList extends Input {
  constructor(props) {
    super(props);
    Object.getSet(this);
    const instance = this;

    this.value = () => {
      const values = {};
      props.list.forEach((input, index) => input.validation() && (values[input.name() || index] = input.value()));
      return values;
    }

    const dynamicEvent = CustomEvent.dynamic();
    this.on = dynamicEvent.on;

    function triggerChangeEvent(value, input, event) {
      dynamicEvent.trigger(event, {value, input});
    }
    props.list.forEach(input => input.on('change:click:keyup', triggerChangeEvent));

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
      props.list.forEach(input => input.optional(optional));
    }
    this.optional(props.optional || false);

    this.clone = (properties) => {
      const json = this.toJson();
      json.validation = (properties || props).validation;
      json.list.forEach(i => delete i.id);
      Object.set(json, properties);
      return InputList.fromJson(json);
    }

    this.empty = () => {
      for (let index = 0; index < props.list.length; index++) {
        if (!props.list[index].empty()) return false
      }
      return true;
    }

  }
}

InputList.fromJson = (json) => {
  json.list = Object.fromJson(json.list);
  return new InputList(json);
}

InputList.template = new $t('input/list');
InputList.html = (instance) => () => InputList.template.render(instance);



module.exports = InputList;
