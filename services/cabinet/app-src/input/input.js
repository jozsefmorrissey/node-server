
class Input {
  constructor(props) {
    const instance = this;
    this.type = props.type;
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
      if (props.validation instanceof RegExp) {
        return value.match(props.validation) !== null;
      }
      if ((typeof props.validation) === 'function') {
        return props.validation(value);
      }
      if (Array.isArray(props.validation)) {
        return props.validation.indexOf(value) !== -1;
      }

      return true;
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

// afterLoad.push(() =>
// document.body.innerHTML = new Input({
//   type: 'select',
//   placeholder: '1 || 2 || 3',
//   name: 'var',
//   class: 'center',
//   list: ['one', 'two', 'three', 'four'],
//   validation: /^(one|two|four)$/,
//   errorMsg: 'lucky number...'
// }).html()
// );
