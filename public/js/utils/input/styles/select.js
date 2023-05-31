




const Input = require('../input');
const $t = require('../../$t');

class Select extends Input {
  constructor(props) {
    props ||= {};
    super(props);
    if (props.list === undefined) props.list = [];
    const isArray = Array.isArray(props.list);
    let value;
    if (isArray) {
      value = props.index && props.list[props.index] ?
      props.list[props.index] : props.list[0];
      value = props.list.indexOf(props.value) === -1 ? props.list[0] : props.value;
    } else {
      const key = Object.keys(props.list)[0];
      value = props.value || key;
    }
    props.value = undefined;
    this.setValue(value);
    this.isArray = () => isArray;
    this.list = () => props.list;
    const parentValue = this.value;
    this.value = (val) => parentValue(val) || props.list[Object.keys(props.list)[0]];
    const parentHidden = this.hidden;
    this.hidden = () => props.list.length < 2 || parentHidden();

    this.selected = (value) => value === this.value();
  }
}

new Select();
Select.template = new $t('input/select');
Select.html = (instance) => () => Select.template.render(instance);

module.exports = Select;
