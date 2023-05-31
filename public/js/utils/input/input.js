




const $t = require('../$t');
const du = require('../dom-utils');
const Lookup = require('../object/lookup')
/*
supported attributes: type, placeholder, name, class, value
label: creates a text label preceeding input.
clearOnClick: removes value when clicked.
list: creates a dropdown with list values.
default: the default value if input is invalid.
targetAttr: attribute which defines the inputs value.
format: attribute which defines a function used to format value.
validation: Accepts
                Array: value must be included
                Regex: value must match
                Function: value is arg1, must return true
errorMsg: Message that shows when validation fails.

*/
class Input extends Lookup {
  constructor(props) {
    const id = props.id || `input-${String.random(7)}`;
    super(id);
    props.hidden = props.hide || false;
    props.list = props.list || [];
    props.optional = props.optional === undefined ? false : props.optional;
    Object.getSet(this, props, 'hidden', 'type', 'label', 'name', 'placeholder',
                            'class', 'list', 'value', 'inline');

    const immutableProps = {
      _IMMUTABLE: true,
      targetAttr: props.targetAttr || 'value',
      errorMsg: props.errorMsg || 'Error',
      errorMsgId: props.errorMsgId || `error-msg-${this.id()}`,
    }
    Object.getSet(this, immutableProps)

    this.clone = (properties) => {
      const json = this.toJson();
      json.validation = props.validation;
      delete json.id;
      delete json.errorMsgId;
      Object.set(json, properties);
      return new this.constructor(json);
    }

    const instance = this;
    const forAll = Input.forAll(this.id());

    this.hide = () => forAll((elem) => {
      const cnt = du.find.up('.input-cnt', elem);
      this.hidden(cnt.hidden = true);
    });
    this.show = () => forAll((elem) => {
      const cnt = du.find.up('.input-cnt', elem);
      this.hidden(cnt.hidden = false);
    });

    let valid;
    let value = props.value;

    const idSelector = `#${this.id()}`;

    const html = this.constructor.html(this);
    this.isInitialized = () => true;
    if ((typeof html) !== 'function') throw new Error('props.html must be defined as a function');
    this.html = () => {
      return html(this);
    }

    function valuePriority (func) {
      return (elem, event) => func(elem[instance.targetAttr()], elem, event);
    }
    this.attrString = () => Input.attrString(this.targetAttr(), this.value());

    function getElem(id) {return document.getElementById(id);}
    this.get = () => getElem(this.id());

    this.on = (eventType, func) => du.on.match(eventType, idSelector, valuePriority(func));
    this.valid = () => this.setValue();
    function getValue() {
      const elem = getElem(instance.id());
      let val = value;
      if (elem) val = elem[instance.targetAttr()];
      if (val === undefined) val = props.default;
      if (instance.type() === 'checkbox') return val == true;
      return val;
    }

    this.getValue = getValue;
    this.updateDisplay = () => {
      const elem = getElem(instance.id());
      if (elem) elem[instance.targetAttr()] = this.value();
    };
    let chosen = false;
    this.setValue = (val, force, eventTriggered) => {
      if (val === undefined) val = this.getValue();
      if(force || this.validation(val)) {
        valid = true;
        if (!chosen && eventTriggered) chosen = true;
        value = val;
        const elem = getElem(instance.id());
        if (elem) elem.value = value;
        return true;
      }
      valid = false;
      value = undefined;
      return false;
    }

    this.chosen = () => props.mustChoose ? chosen : true;

    this.value = () => {
      let unformatted;
      if (typeof value === 'function') unformatted = value();
      else {
        unformatted = this.getValue();
        if (unformatted === undefined) unformatted = '';
      }

      return (typeof props.format) !== 'function' ? unformatted : props.format(unformatted);
    }
    this.doubleCheck = () => {
      valid = undefined;
      this.validate();
      return valid;
    }
    this.validation = function(val) {
      const elem = getElem(instance.id);
      val = val === undefined && elem ? elem.value : val;
      if (val === undefined) return false;
      if (valid !== undefined && val === value) return valid;
      let valValid = true;
      if (props.validation instanceof RegExp) {
        valValid = val.match(props.validation) !== null;
      }
      else if ((typeof props.validation) === 'function') {
        valValid = props.validation.apply(null, arguments);
      }
      else if (Array.isArray(props.validation)) {
        valValid = props.validation.indexOf(val) !== -1;
      }

      return valValid;
    };

    function setValid(vld) {
      valid = vld;
      const elem = getElem(instance.errorMsgId());
      if (elem) {
        elem.hidden = vld;
      }
    }

    this.validate = (target, eventTriggered) => {
      target = target || getElem(instance.id());
      if (target) {
        if (this.setValue(target[this.targetAttr()], false, eventTriggered)) {
          setValid(true);
        } else setValid(false);
      }
    }

    if (props.clearOnDblClick) {
      du.on.match(`dblclick`, `#${this.id()}`, () => {
        const elem = getElem(this.id());
        if (elem) elem.value = '';
      });
    } else if (props.clearOnClick) {
      du.on.match(`mousedown`, `#${this.id()}`, () => {
        const elem = getElem(this.id());
        if (elem) elem.value = '';
      });
    }
  }
}

function runValidate(elem, event) {
  const input = Lookup.get(elem.id);
  if (input) input.validate(elem, true);
}

du.on.match(`click`, `input`, runValidate);
du.on.match(`change`, `input`, runValidate);
du.on.match(`keyup`, `input`, runValidate);
du.on.match(`change`, `select`, runValidate);
du.on.match(`keyup`, `select`, runValidate);

Input.forAll = (id) => {
  const idStr = `#${id}`;
  return (func) => {
    const elems = document.querySelectorAll(idStr);
    for (let index = 0; index < elems.length; index += 1) {
      func(elems[index]);
    }
  }
}

Input.getFromElem = (elem) => {
  return Input.get(elem.id);
}

Input.template = new $t('input/input');
Input.html = (instance) => () => Input.template.render(instance);
Input.flagAttrs = ['checked', 'selected'];
Input.attrString = (targetAttr, value) =>{
  if (Input.flagAttrs.indexOf(targetAttr) !== -1) {
    return value === true ? targetAttr : '';
  }
  return `${targetAttr}='${value}'`
}

Input.DO_NOT_CLONE = true;

module.exports = Input;
