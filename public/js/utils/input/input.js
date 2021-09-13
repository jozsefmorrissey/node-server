




const $t = require('../$t');
const du = require('../dom-utils');
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
class Input {
  constructor(props) {
    props.hidden = props.hide || false;
    props.list = props.list || [];
    Object.getSet(this, props, 'hidden', 'type', 'label', 'name', 'id', 'placeholder',
                            'class', 'list', 'value');

    const immutableProps = {
      _IMMUTABLE: true,
      id: props.id || `input-${String.random(7)}`,
      targetAttr: props.targetAttr || 'value',
      errorMsg: props.errorMsg || 'Error',
      errorMsgId: props.errorMsgId || `error-msg-${props.id}`,
    }
    Object.getSet(this, immutableProps)

    this.clone = (properties) => {
      const json = this.toJson();
      delete json.id;
      delete json.errorMsgId;
      Object.set(json, properties);
      return new this.constructor(json);
    }

    const instance = this;
    const forAll = Input.forAll(this.id());

    this.hide = () => forAll((elem) => {
      const cnt = du.find.up('.input-cnt', elem);
      hidden = cnt.hidden = true;
    });
    this.show = () => forAll((elem) => {
      const cnt = du.find.up('.input-cnt', elem);
      hidden = cnt.hidden = false;
    });

    let valid;
    let value = props.value;

    const idSelector = `#${this.id()}`;

    const html = this.constructor.html(this);
    if ((typeof html) !== 'function') throw new Error('props.html must be defined as a function');
    this.html = () =>
     html();

    function valuePriority (func) {
      return (elem, event) => func(elem[props.targetAttr], elem, event);
    }
    this.attrString = () => Input.attrString(this.targetAttr(), this.value());

    function getElem(id) {return document.getElementById(id);}
    this.get = () => getElem(this.id());

    this.on = (eventType, func) => du.on.match(eventType, idSelector, valuePriority(func));
    this.valid = () => valid === undefined ? this.setValue() : valid;
    this.setValue = (val) => {
      const elem = getElem(this.id());
      if (val === undefined){
        if (elem) val = elem[props.targetAttr]
        if (val === undefined) val = props.default;
      }
      if(this.validation(val)) {
        valid = true;
        value = val;
        if (elem) elem[props.targetAttr] = val;
        return true;
      }
      valid = false;
      value = undefined;
      return false;
    }
    this.value = () => {
      const unformatted = (typeof value === 'function') ? value() : value || '';
      return (typeof props.format) !== 'function' ? unformatted : props.format(unformatted);
    }
    this.doubleCheck = () => {
      valid = undefined;
      validate();
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

    const validate = (target) => {
      target = target || getElem(instance.id);
      if (target) {
        if (this.setValue(target[props.targetAttr])) {
          getElem(this.errorMsgId).innerHTML = '';
          valid = true;
        } else {
          getElem(this.errorMsgId).innerHTML = props.errorMsg;
          valid = false;
        }
      }
    }

    if (props.clearOnClick) {
      du.on.match(`mousedown`, `#${this.id()}`, () => {
        const elem = getElem(this.id());
        if (elem) elem.value = '';
      });
    }
    du.on.match(`change`, `#${this.id()}`, validate);
    du.on.match(`keyup`, `#${this.id()}`, validate);
  }
}

Input.forAll = (id) => {
  const idStr = `#${id}`;
  return (func) => {
    const elems = document.querySelectorAll(idStr);
    for (let index = 0; index < elems.length; index += 1) {
      func(elems[index]);
    }
  }
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

module.exports = Input;
