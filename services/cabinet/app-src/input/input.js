
class Input {
  constructor(props) {
    const instance = this;
    this.type = props.type;
    this.label = props.label;
    this.name = props.name;
    this.hide = props.hide;
    this.id = props.id || `input-${randomString(7)}`;
    this.placeholder = props.placeholder;
    this.class = props.class;
    this.list = props.list || [];
    let valid;
    let value = props.value;
    props.targetAttr = props.targetAttr || 'value';

    props.errorMsg = props.errorMsg || 'Error';

    this.errorMsgId = props.errorMsgId || `error-msg-${this.id}`;
    const idSelector = `#${this.id}`;

    const html = this.constructor.html(this);
    if ((typeof html) !== 'function') throw new Error('props.html must be defined as a function');
    this.html = () =>
     html();

    this.on = (eventType, func) => matchRun(eventType, idSelector, func);
    this.valid = () => valid === undefined ? this.setValue() : valid;
    this.setValue = (val) => {
      if (val === undefined){
        const elem = document.getElementById(this.id);
        if (elem) val = elem[props.targetAttr]
        if (val === undefined) val = props.default;
      }
      if(this.validation(val)) {
        valid = true;
        value = val;
        return true;
      }
      valid = false;
      value = undefined;
      return false;
    }
    this.value = () => value;
    this.validation = (val) => {
      if (val === undefined) return false;
      if (valid !== undefined && val === value) return valid;
      let valValid = true;
      if (props.validation instanceof RegExp) {
        valValid = val.match(props.validation) !== null;
      }
      else if ((typeof props.validation) === 'function') {
        valValid = props.validation(val);
      }
      else if (Array.isArray(props.validation)) {
        valValid = props.validation.indexOf(val) !== -1;
      }

      return valValid;
    };

    const validate = (target) => {
      if (this.setValue(target[props.targetAttr])) {
        document.getElementById(this.errorMsgId).innerHTML = '';
        valid = true;
      } else {
        document.getElementById(this.errorMsgId).innerHTML = props.errorMsg;
        valid = false;
      }
    }

    matchRun(`change`, `#${this.id}`, validate);
    matchRun(`keyup`, `#${this.id}`, validate);
  }
}

Input.template = new $t('input/input');
Input.html = (instance) => () => Input.template.render(instance);


Input.id = () => new Input({
  type: 'text',
  placeholder: 'Id',
  name: 'id',
  class: 'center',
  validation: /^\s*[^\s]{1,}\s*$/,
  errorMsg: 'You must enter an Id'
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

Input.partNumber = () => new Input({
  label: 'Part Number',
  name: 'partNumber',
  type: 'text'
});
