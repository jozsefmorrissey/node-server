
const Input = require('../input');
const Select = require('../styles/select');
const NumberInput = require('../styles/number');
const Measurement = require('../../measurement');
const MeasurementInput = require('../styles/measurement');
const Textarea = require('../styles/textarea');
const MultipleEntries = require('../styles/multiple-entries');
const DecisionInputTree = require('../decision/decision');
const Table = require('../styles/table.js');
const InputList = require('../styles/list.js');
const RadioTable = Table.Radio;
const Radio = require('../styles/radio.js');
const $t = require('../../$t');
const du = require('../../dom-utils');



const noSubmitInputTree = () =>
  new InputInput({noSubmission: true});


class InputInput extends DecisionInputTree {
  constructor(props) {
    props ||= {};
    props.validation ||= {};
    if (props.value){
      console.log('gere')
    }
    let details = {};
    const name = new Input({
      name: 'name',
      label: 'Name',
      class: 'center',
      validation: props.validation.name
    });
    const inline = new Input({
      name: 'inline',
      value: props.inline,
      label: 'Inline',
      class: 'center',
      type: 'checkbox'
    });
    const format = new Select({
      label: 'Format',
      name: 'format',
      class: 'center',
      list: ['Text', 'Checkbox', 'Number', 'Radio', 'Select', 'Date', 'Time', 'Table', 'Multiple Entries', 'Measurement'],
      validation: props.validation.format
    });
    const step = new NumberInput({name: 'step', optional: true, label: 'Step'});
    const min = new NumberInput({name: 'min', optional: true, label: 'Minimum'});
    const max = new NumberInput({name: 'max', optional: true, label: 'Maximum'});
    const tableType = new Select({
      label: 'Type',
      name: 'type',
      class: 'center',
      list: ['Text', 'checkbox', 'radio', 'date', 'time', 'column specific']
    });
    const textCntSize = new Select({
      label: 'Size',
      name: 'size',
      class: 'center',
      list: ['Small', 'Large']
    });
    const units = new Select({
      label: 'Units',
      name: 'units',
      class: 'center',
      list: Measurement.units()
    });
    const label = new Input({
      name: 'label',
      label: 'Label',
      class: 'centnodeConds[index].satisfied()) reer',
      validation: (val) => val !== ''
    });
    const option = new Input({
      name: 'option',
      label: 'Option',
    });
    const row = new Input({
      name: 'row',
      class: 'center',
    });
    const col = new Input({
      name: 'col',
      class: 'center',
    });
    const labels = new MultipleEntries(label, {name: 'labels'});
    const options = new MultipleEntries(option, {name: 'options'});
    const colType = new MultipleEntries(noSubmitInputTree, {name: 'columns', label: 'Columns'});
    const columns = new MultipleEntries(col, {name: 'columns', label: 'Columns'});
    const rows = new MultipleEntries(row, {name: 'rows', label: 'Rows'});
    const rowCols = [tableType, rows];


    const inputs = [name, format];
    const multiEnt = new MultipleEntries(noSubmitInputTree, {name: 'templates'});

    super(props.name || 'Input', {inputArray: inputs, noSubmission: props.noSubmission, class: 'modify'});
    const root = this.root();

    const dic = (value, attr) => DecisionInputTree.getCondition(attr || 'format', value);
    function addNode(name, inputArray, value, attr, node) {
      const targetNode = (node || root);
      const newNode = targetNode.then(name, {inputArray});
      targetNode.conditions.add(dic(value, attr), name);
      return newNode;
    }

    addNode('text', [textCntSize], 'Text');
    addNode('select', [options], 'Select');
    addNode('radio', [inline, labels], 'Radio');
    const tableNode = addNode('table', rowCols, 'Table');
    addNode('tableColumnList', [columns], ['Text', 'checkbox', 'radio', 'date', 'time'], 'type', tableNode);
    addNode('tableColumnTemplate', [colType], 'column specific', 'type', tableNode);
    addNode('multi', [inline, multiEnt], 'Multiple Entries');
    addNode('measure', [units], 'Measurement');
    addNode('number', [step, min, max], 'Number');

    this.setValue = (inputOrDetails) => {
      if (!inputOrDetails) return;
      let details = inputOrDetails;
      if (inputOrDetails instanceof Input) details = getInputDetails(details);
      const setValue = (path) => {
        const nodePath = path.split('.');
        const inputName = nodePath.splice(-1)[0];
        const node = this.getByPath.apply(this, nodePath);
        const input = node.find.input(inputName);
        input.setValue(details.pathValue(path));
      }
      setValue('name');
      setValue('name');
      // setValue('inline');
      setValue('format');
      setValue('number.step');
      setValue('number.min');
      setValue('number.max');
      setValue('table.type');
      setValue('text.size');
      setValue('measure.units');
      setValue('radio.labels');
      setValue('select.options');
      setValue('table.tableColumnTemplate.columns');
      setValue('multi.templates');
      setValue('table.tableColumnList.columns');
      setValue('table.rows');
    }

    this.clone = () => new InputInput(props);
    this.empty = () => this.values().name === '';
    // tree.onSubmit(addInput);
    // tree.clone = () => DecisionInputTree.inputTree(node, noSubmission);
    // tree.empty = () => {
    //   let empty = true;
    //   tree.root().forEach((node) =>
    //     node.payload().inputArray.forEach(input => empty &&= input.empty()));
    //   return empty;
    // }

    this.setValue(props.input);
  }
}

function getInputDetails(input)  {
  const details = {};
  details.name = input.label();
  details.inline = input.inline();
  details.vaalue = input.value();
  let list;
  if (input instanceof Textarea) {
    details.format = 'Text';
    details.text = {size: 'Large'};
  }

  else if (input instanceof NumberInput) {
    details.format = 'Number';
    details.number = {step: input.step()};
    details.number.min = input.min();
    details.number.max = input.max();
  }

  else if (input instanceof Radio) {
    details.format = 'Radio';
    details.radio = {labels: input.list()};
  }

  else if (input instanceof Select) {
    details.format = 'Select';
    const options = input.list();
    details.select = {options};
  }

  else if (input instanceof MeasurementInput) {
    details.format = 'Measurement';
    details.measure = {units: input.units()};
  }

  else if (input instanceof Table || input instanceof RadioTable) {
    details.format = 'Table';
    details.table = {rows: input.rows()};
    const isList = !(input.columns()[0] instanceof Input);
    if (isList) {
      details.table.tableColumnList = {columns: input.columns()};
    } else {
      const columns = input.columns.map((ci) => getInputDetails(ci));
      details.table.tableColumnTemplate = {columns};
    }
    details.table.type = input.type();
  }

  else if (input instanceof MultipleEntries) {
    details.format = 'Multiple Entries';
    details.multi = {templates: []};

    const inputList = input.inputTemplate();
    const list = inputList.list();
    for (let index = 0; index < list.length; index++) {
      const inp = list[index];
      const inpDets = getInputDetails(inp);
      details.multi.templates.push(inpDets);
    }
  }

  else {
    switch (input.type()) {
      case 'date': details.format = 'Date'; break;
      case 'time': details.format = 'Time'; break;
      case 'checkbox': details.format = 'Checkbox'; break;
      default:
        details.format = 'Text';
        details.text = {size: 'Small'};
        break;

    }
  }

  return details;
}

function getInput(details, validationCall)  {
  const name = details.name.toCamel();
  const label = details.name;
  let inline = details.inline;
  let list, input;
  switch (details.format) {
    case 'Text':
      if (details.text.size === 'Large') {
        input = new Textarea({name, label});
        break;
      } else {
        input = new Input({type: 'text', name, label, inline});
				break;
      }
    case 'Number':
      const step = details.number.step;
      const min = details.number.min;
      const max = details.number.max;
      input = new NumberInput({name, label, min, max, step});
			break;
    case 'Date':
      input = new Input({type: 'date', name, label, inline});
			break;
    case 'Time':
      input = new Input({type: 'time', name, label, inline});
			break;
    case 'Checkbox':
      input = new Input({type: 'checkbox', name, label, inline});
			break;
    case 'Radio':
      inline = details.radio.inline;
      list = details.radio.labels;
      input = new Radio({name, label, list, inline});
			break;
    case 'Select':
      list = details.select.options;//.map(input => input.value());
      input = new Select({name, label, list});
			break;
    case 'Table':
      const props = details.table;
      let isList = props.tableColumnList !== undefined;
      let columns = isList ?  props.tableColumnList.columns : props.tableColumnTemplate.columns;
      let rows = props.rows;
      if (!isList) {
        columns.forEach((definition, index) => columns[index] = getInput(definition));
      }
      const type = props.type;
      input = new Table({name, label, rows, columns, type});
			break;
    case 'Measurement':
      const units = details.measure.units;
      input = new MeasurementInput({name, label, units});
			break;
    case 'Multiple Entries':
      const templates = details.multi.templates;
      list = [];
      inline = details.multi.inline;
      for (let index = 0; index < templates.length; index++) {
        const values = templates[index];
        values.inline = inline;
        const input = getInput(values);
        list.push(input);
      }
      input = new MultipleEntries(new InputList({list, inline}), {name, label});
			break;
    default:
      throw new Error('In the future this will not be reachable');
  }
  if (!validationCall) validateGetInputDetais(details, input);
  return input;
}

function validateGetInputDetais(details, input) {
  const genDets = getInputDetails(input);
  const genInput = getInput(genDets, true);
  const constructorEq = genInput.constructor === input.constructor;
  const typeEq = genInput.type() === input.type();
  if (!constructorEq || !typeEq){
    console.warn('invalid generated details');
    getInputDetails(input);
  }
}

InputInput.getInput = getInput;
InputInput.getInputDetails = getInputDetails;



module.exports = InputInput;









// TODO: Should probably locate somewhere else hacky fix. cosider making editHtml sperate for all Inputs.
RadioTable.editTemplate = Table.editTemplate = new $t('input/edit/table');

const objectItemTemplate = new $t('input/edit/list/object');
const stringItemTemplate = new $t('input/edit/list/string');
function listHtml (list) {
  const props = {list: [], class: 'input-list-multi'};
  let template;
  for (let index = 0; index < list.length; index++) {
    const item = list[index];
    if (item instanceof Input) {
      const ii = new InputInput({input: item, noSubmission: true});
      props.list.push(ii);
      template ||= new InputInput({noSubmission: true});
    } else if (item instanceof Object) {
      props.list.push(new InputObject({value: item}));
      template ||= new InputObject();
    } else {
      props.list.push(new Input({type: 'simple-string', value: item}));
      template ||= new Input({type: 'simple-string'});
    }
  }
  const multi = new MultipleEntries(template, props);
  return multi.html();
}
RadioTable.editHtml = Table.editHtml = (table) => Table.editTemplate.render({table, listHtml});

function buildList(elem) {
  const input = Input.getFromElem(elem);
  const targetInput = Input.getFromElem(elem.previousElementSibling);
  const columnValues = targetInput.value();
  const list = [];
  for (let index = 0; index < columnValues.length; index++) {
    const col = columnValues[index];
    if ((typeof col) === 'string') list.push(col);
    else list.push(InputInput.getInput(col));
  }
  return {input, list};
}

du.on.match('click', '#table-column-edit-btn', (elem) => {
  const listput = buildList(elem)
  listput.input.setColumns(listput.list);
  listput.input.updateDisplay();
});
du.on.match('click', '#table-row-edit-btn', (elem) => {
  const listput = buildList(elem)
  listput.input.setRows(listput.list);
  listput.input.setColumns();
  listput.input.updateDisplay();
});
