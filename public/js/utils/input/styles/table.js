
const Input = require('../input');
const $t = require('../../$t');

class Table extends Input {
  constructor(props) {
    super(props);
    const isArray = Array.isArray(props.list);
    let value;
    if (isArray) {
      value = props.list.indexOf(props.value) === -1 ? props.list[0] : props.value;
    } else {
      const key = Object.keys(props.list)[0];
      value = props.value || key;
    }
    props.type ||= 'radio';
    props.value = undefined;
    this.setValue(value);
    this.isArray = () => isArray;
    this.list = () => props.list;
    this.columns = () => props.columns;
    this.rows = () => props.rows;
    this.description = () => props.description;
    // const parentValue = this.value;
    // this.value = (val) => parentValue(val) || props.list[Object.keys(props.list)[0]];

    this.selected = (value) => value === this.value();
  }
}

Table.template = new $t('input/table');
Table.html = (instance) => () => Table.template.render(instance);

module.exports = Table;
