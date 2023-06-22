
const Input = require('../input');
const Radio = require('../styles/radio');
const $t = require('../../$t');
const du = require('../../dom-utils');

tableInputNameFunc = (id, rIndex, cIndex) => `table-${id}-${rIndex}-${cIndex}`;

class RadioTable extends Input {
  constructor(props) {
    super(props);
    const rows = {};
    props.type = 'radio';
    for (let rIndex = 0; rIndex < props.rows.length; rIndex++) {
      const list = props.columns.copy();
      const label = props.rows[rIndex];
      const name = label.toCamel();
      const value = props.values ? props.values[name] : list[0];
      rows[name] = {name, label, value};
    }

    this.value = () => {
      const values = {};
      for (let index = 0; index < props.rows.length; index++) {
        const key = props.rows[index].toCamel();
        values[key] = rows[key].value;
      }
      return values;
    }

    this.columns = () => props.columns;
    props.value = undefined;
    this.setValue = (elem) => rows[elem.name].value = elem.value;
    this.list = () => rows;
    this.rowDetail = () => Object.values(rows);
    this.rows = () => props.rows;
    this.description = () => props.description;
  }
}

du.on.match('change', '.radio-table-input-cnt>input', (elem) => {
  Input.getFromElem(elem).setValue(elem);
});

Object.class.register(RadioTable);
RadioTable.template = new $t('input/radio-table');
RadioTable.html = (instance) => () => RadioTable.template.render(instance);


class Table extends Input {
  constructor(props) {
    super(props);

    const inputs = [];
    props.type ||= 'radio';
    if (props.type === 'radio') return new RadioTable(props);
    for (let rIndex = 0; rIndex < props.rows.length; rIndex++) {
      inputs[rIndex] = [];
      let nameFunc = tableInputNameFunc;
      if (props.type === 'radio') {
        const uniqueId = String.random();
        nameFunc = () => uniqueId;
      } else {
        const row = props.rows[rIndex];
        for (let cIndex = 0; cIndex < props.columns.length; cIndex++) {
          const column = props.columns[cIndex];
          let input;
          if (column instanceof Input) input = column.clone();
          else input = new Input({type: props.type});
          input.name(nameFunc(this.id(), rIndex, cIndex));
          const clone = input.clone();
          clone.label('');
          if (props.value) clone.value(props.value[row][input.name()]);
          inputs[rIndex].push(clone);
        }
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
        if (col instanceof Input) names.push(col.label() || col.name());
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
