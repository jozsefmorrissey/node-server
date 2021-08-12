
class Input {
  constructor(props) {
    let hidden = props.hide || false;
    const instance = this;
    this.type = props.type;
    this.label = props.label;
    this.name = props.name;
    this.id = props.id || `input-${randomString(7)}`;
    const forAll = Input.forAll(this.id);
    this.hidden = () => hidden;
    this.hide = () => forAll((elem) => {
      const cnt = up('.input-cnt', elem);
      hidden = cnt.hidden = true;
    });
    this.show = () => forAll((elem) => {
      const cnt = up('.input-cnt', elem);
      hidden = cnt.hidden = false;
    });
    this.placeholder = props.placeholder;
    this.class = props.class;
    this.list = props.list || [];

    let valid;
    let value = props.value;
    props.targetAttr = props.targetAttr || 'value';
    this.targetAttr = () => props.targetAttr;

    props.errorMsg = props.errorMsg || 'Error';

    this.errorMsgId = props.errorMsgId || `error-msg-${this.id}`;
    const idSelector = `#${this.id}`;

    const html = this.constructor.html(this);
    if ((typeof html) !== 'function') throw new Error('props.html must be defined as a function');
    this.html = () =>
     html();

    function valuePriority (func) {
      return (elem, event) => func(elem[props.targetAttr], elem, event);
    }
    this.attrString = () => Input.attrString(this.targetAttr(), this.value());

    function getElem(id) {return document.getElementById(id);}

    this.on = (eventType, func) => matchRun(eventType, idSelector, valuePriority(func));
    this.valid = () => valid === undefined ? this.setValue() : valid;
    this.setValue = (val) => {
      const elem = getElem(this.id);
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
    this.value = (typeof value === 'function') ? value() : () => value || '';
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
      matchRun(`mousedown`, `#${this.id}`, () => {
        const elem = getElem(this.id);
        if (elem) elem.value = '';
      });
    }
    matchRun(`change`, `#${this.id}`, validate);
    matchRun(`keyup`, `#${this.id}`, validate);
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

Input.id = () => new Input({
  type: 'text',
  placeholder: 'Id',
  name: 'id',
  class: 'center',
  validation: /^\s*[^\s]{1,}\s*$/,
  errorMsg: 'You must enter an Id'
});

Input.propertyId = () => new Input({
  type: 'text',
  placeholder: 'Property Id',
  name: 'propertyId',
  class: 'center',
  validation: /^[a-zA-Z\.]{1}$/,
  errorMsg: 'Alpha Numeric Value seperated by \'.\'.<br>I.E. Cabinet=>1/2 Overlay = Cabinet.12Overlay'
});

Input.propertyValue = () => new Input({
  type: 'text',
  placeholder: 'Property Value',
  name: 'propertyValue',
  class: 'center'
});

Input.CostId = () => new Input({
  type: 'text',
  placeholder: 'Id',
  name: 'id',
  class: 'center',
  validation: (id, values) =>
      id !== '' && (!values.referenceable || Object.values(Cost.defined).indexOf(id) === -1),
  errorMsg: 'You must an Id: value must be unique if Referencable.'
});

Input.Name = () => new Input({
  type: 'text',
  placeholder: 'Name',
  name: 'name',
  class: 'center',
  validation: /^\s*[^\s].*$/,
  errorMsg: 'You must enter a Name'
});

Input.color = () => new Input({
  type: 'color',
  validation: /.*/,
  placeholder: 'color',
  name: 'color',
  class: 'center'
});

Input.optional = () => new Input({
  label: 'Optional',
  name: 'optional',
  type: 'checkbox',
  default: false,
  validation: [true, false],
  targetAttr: 'checked'
});

Input.modifyDemension = () => new Input({
  label: 'Modify Demension',
  name: 'modifyDemension',
  type: 'checkbox',
  default: false,
  validation: [true, false],
  targetAttr: 'checked'
});

Input.partNumber = () => new Input({
  label: 'Part Number',
  name: 'partNumber',
  type: 'text'
});

Input.count = (value) => new Input({
  label: 'Count',
  name: 'count',
  type: 'number',
  value: value || 1
});

Input.quantity = (value) => new Input({
  label: 'Quantity',
  name: 'quantity',
  type: 'number',
  value: value || 0
});

Input.hourlyRate = () => new Input({
  label: 'Hourly Rate',
  name: 'hourlyRate',
  type: 'number',
});

Input.hours = (value) => new Input({
  label: 'Hours',
  name: 'hours',
  type: 'number',
  value: value || 0
});

Input.laborType = (type) => new Input({
  name: 'laborType',
  placeholder: 'Labor Type',
  label: 'Type',
  class: 'center',
  clearOnClick: true,
  list: Labor.types,
  value: type
});
