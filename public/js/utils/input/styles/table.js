
const Input = require('../input');
const $t = require('../../$t');

class Table extends Input {
  constructor(props) {
    super(props);

    const inputs = [];
    props.type ||= 'radio';
    for (let rIndex = 0; rIndex < props.rows.length; rIndex++) {
      inputs[rIndex] = [];
      const row = props.rows[rIndex];
      for (let cIndex = 0; cIndex < props.columns.length; cIndex++) {
        const column = props.columns[cIndex];
        let input;
        if (column instanceof Input) input = column.clone();
        else input = new Input({type: props.type});
        input.label('');
        input.name(`table-${this.id()}-${rIndex}-${cIndex}`);
        const clone = input.clone();
        if (props.value) clone.value(props.value[row][input.name()]);
        inputs[rIndex].push(clone);
      }
    }

    this.value = () => {
      const values = {};
      const rows = this.rows();
      const cols = this.columnNames();
      for (let rIndex = 0; rIndex < inputs.length; rIndex++) {
        const column = inputs[rIndex];
        const row = rows[rIndex];
        values[row] = {};
        for (let cIndex = 0; cIndex < column.length; cIndex++) {
          let input = column[cIndex];
          values[row][cols[cIndex]] = input.value();
        }
      }
      return values;
    }


    props.value = undefined;
    this.list = () => props.list;
    this.columns = (rowIndex) => rowIndex === undefined ?
          props.columns : inputs[rowIndex];
    this.columnNames = () => {
      const names = [];
      for (let index = 0; index < props.columns.length; index++) {
        const col = props.columns[index];
        if (col instanceof Input) names.push(col.label());
        else names.push(col);
      }
      return names;
    }
    this.rows = () => props.rows;
    this.description = () => props.description;
    // const parentValue = this.value;
    // this.value = (val) => parentValue(val) || props.list[Object.keys(props.list)[0]];

    this.selected = (value) => value === this.value();
  }
}

Table.fromJson = (json) => {
  const columns = Object.fromJson(json.columns);
  json.columns = columns;
  return new Table(json);
}

Table.template = new $t('input/table');
Table.html = (instance) => () => Table.template.render(instance);

module.exports = Table;
