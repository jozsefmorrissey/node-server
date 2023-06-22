




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
    props ||= {};
    if (props.name === 'jozsefMorrissey') {
      console.log('created')
    }
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

    const parentToJson = this.toJson;
    this.toJson = () => {
      const json = parentToJson();
      delete json.id;
      delete json.errorMsgId;
      json.validation = props.validation;
      return json;
    }

    this.clone = (properties) => {
      const json = this.toJson();
      Object.set(json, properties);
      if (this.constructor.fromJson)
        return this.constructor.fromJson(json);
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
    this.trigger = (eventType) => du.trigger(eventType, this.get());
    this.valid = () => this.setValue();
    function getValue() {
      const elem = getElem(instance.id());
      let val = value;
      if (elem) val = elem[instance.targetAttr()];
      if (val === undefined) val = props.default;
      if (instance.type() === 'checkbox') {
        if (elem) val = elem.checked;
        return val == true;
      }
      return val;
    }

    // TODO: this should probably be a seperate class.... whatever
    this.checked = () => this.type() === 'checkbox' && this.value() == true ?
                                'checked' : '';

    this.getValue = getValue;
    this.updateDisplay = () => {
      const elem = getElem(instance.id());
      if (elem) elem[instance.targetAttr()] = this.value();
    };
    let chosen = false;
    this.setValue = (val, force, eventTriggered) => {
      if (val === 'me') {
        console.log('meeeeee')
      }
      if (val === undefined) val = this.getValue();
      if (this.optional() && val === '') return true;
      if(force || this.validation(val)) {
        valid = true;
        if (!chosen && eventTriggered) chosen = true;
        value = val;
        const elem = getElem(instance.id());
        if (elem && elem.type !== 'radio') elem.value = value;
        return true;
      }
      valid = false;
      value = undefined;
      return false;
    }
this.name()
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
      const elem = getElem(instance.id());
      val = val === undefined && elem ? elem.value : val;
      if (val === undefined) return false;
      // if (valid !== undefined && val === value) return valid;
      let valValid = true;
      if (props.validation instanceof RegExp) {
        valValid = val.match(props.validation) !== null;
      }
      else if ((typeof props.validation) === 'function') {
        valValid = props.validation.apply(null, arguments);
      }
      else if (Array.isArray(props.validation)) {
        valValid = props.validation.indexOf(val) !== -1;
      } else {
        valValid = val !== '';
      }

      setValid(valValid);
      return valValid;
    };

    function setValid(vld) {
      valid = vld;
      const errorElem = getElem(instance.errorMsgId());
      if (errorElem) {
        const hideMsg = !(!valid && instance.value() !== '');
        errorElem.hidden = hideMsg;
      }

      const elem = getElem(instance.id());
      if (elem) {
        if (!valid) du.class.add(elem, 'error');
        else du.class.remove(elem, 'error');
      }
    }

    this.indicateValidity = setValid;

    this.validate = (target, eventTriggered) => {
      target = target || getElem(instance.id());
      if (target) {
        if (this.setValue(target[this.targetAttr()], false, eventTriggered)) {
          setValid(true);
        } else setValid(false);
      }
    }

    this.empty = () => this.value() === '';

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

du.on.match(`click`, `input,select,textarea`, runValidate);
du.on.match(`change`, `input,select,textarea`, runValidate);
du.on.match(`keyup`, `input,select,textarea`, runValidate);

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
  const closest = du.find.closest('[input-id]', elem);
  if (closest === undefined) return undefined;
  const id = closest.getAttribute('input-id');
  return Input.get(id);
}

Input.fromJson = (json) => new (Object.class.get(json._TYPE))(json);

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
