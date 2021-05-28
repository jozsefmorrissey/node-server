
class Input {
  constructor(props) {
    const instance = this;
    this.type = props.type;
    this.label = props.label;
    this.name = props.name;
    this.id = props.id || `input-${randomString(7)}`;
    this.placeholder = props.placeholder;
    this.class = props.class;
    this.list = props.list || [];
    this.valid = false;

    props.errorMsg = props.errorMsg || 'Error';

    this.errorMsgId = props.errorMsgId || `error-msg-${this.id}`;
    const idSelector = `#${this.id}`;

    const html = this.constructor.html(this);
    if ((typeof html) !== 'function') throw new Error('props.html must be defined as a function');
    this.html = html;

    this.on = (eventType, func) => matchRun(eventType, idSelector, func);
    this.validation = (value) => {
      let valid = true;
      if (props.validation instanceof RegExp) {
        valid = value.match(props.validation) !== null;
      }
      else if ((typeof props.validation) === 'function') {
        valid = props.validation(value);
      }
      else if (Array.isArray(props.validation)) {
        valid = props.validation.indexOf(value) !== -1;
      }

      if (valid) this.value = value;
      return valid;
    };

    matchRun(`change`, `#${this.id}`, (target) => {
      if (this.validation(target.value)) {
        document.getElementById(this.errorMsgId).innerHTML = '';
      } else {
        document.getElementById(this.errorMsgId).innerHTML = props.errorMsg;
      }
    });
  }
}

Input.template = new $t('input/input');
Input.html = (instance) => () => Input.template.render(instance);

Input.id = () => new Input({
    type: 'text',
    placeholder: 'Id',
    name: 'id',
    class: 'center',
    validation: /^\s*[^\s]{1,}$/,
    errorMsg: 'You must enter an Id'
  });

Input.color = () => new Input({
    type: 'color',
    placeholder: 'color',
    name: 'color',
    class: 'center'
  });
