
const Input = require('../input');
const $t = require('../../$t');
const du = require('../../dom-utils');

class Radio extends Input {
  constructor(props) {
    super(props);
    if (props.list === undefined) throw new Error('Radio Input is useless without a list of possible values');
    const isArray = Array.isArray(props.list);
    let value;
    if (isArray) {
      value = props.list.indexOf(props.value) === -1 ? props.list[0] : props.value;
    } else {
      const key = Object.keys(props.list)[0];
      value = props.value || key;
    }
    props.value = undefined;

    this.setValue(value);
    this.isArray = () => isArray;
    const uniqueName = String.random();
    this.uniqueName = () => uniqueName;//`${this.name()}-${this.id()}`
    this.list = () => props.list;
    this.description = () => props.description;

    this.getValue = (val) => {
      return this.setValue();
    }
    const parentSetVal = this.setValue;
    this.setValue = (val) => {
      const initialVal = value;
      const all = du.find.all(`[name='${this.uniqueName()}']`);
      for (let index = 0; index < all.length; index++) {
        const input = all[index];
        if (input.value === val || input.checked) {
          value = input.value;
        }
      }
      // if (initialVal !== value) this.trigger('change');
      return value;
    }

    const parentHidden = this.hidden;
    this.hidden = () => props.list.length < 2 || parentHidden();

    this.selected = (value) => value === this.value();

    du.on.match('change', `#${this.id()}`, (elem) => {
      this.setValue(elem.value);
    });
  }
}

Radio.template = new $t('input/radio');
Radio.html = (instance) => () => Radio.template.render(instance);

Radio.yes_no = (props) => (props.list = ['Yes', 'No']) && new Radio(props);
Radio.true_false = (props) => (props.list = ['True', 'False']) && new Radio(props);

module.exports = Radio;
