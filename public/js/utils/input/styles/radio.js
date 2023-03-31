
const Input = require('../input');
const $t = require('../../$t');

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
    this.list = () => props.list;
    this.description = () => props.description;
    // const parentValue = this.value;
    // this.value = (val) => parentValue(val) || props.list[Object.keys(props.list)[0]];
    const parentHidden = this.hidden;
    this.hidden = () => props.list.length < 2 || parentHidden();

    this.selected = (value) => value === this.value();
  }
}

Radio.template = new $t('input/radio');
Radio.html = (instance) => () => Radio.template.render(instance);

Radio.yes_no = (props) => (props.list = ['Yes', 'No']) && new Radio(props);
Radio.true_false = (props) => (props.list = ['True', 'False']) && new Radio(props);

module.exports = Radio;
