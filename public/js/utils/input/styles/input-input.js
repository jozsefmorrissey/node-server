
const Input = require('../input');
const Select = require('./select');
const Measurement = require('./measurement');
const MultipleEntries = require('./multiple-entries');
const DecisionInputTree = require('../decision/decision');

class InputInput extends Input {
  constructor(name, props) {
    super(name, props);
    const labels = new MultipleEntries(label, {name: 'labels'});
    const rowCols = [tableType, new MultipleEntries(col, {name: 'col', inline: true}),
                      new MultipleEntries(row, {name: 'row'})];


    // ['Text', 'Radio', 'Table', 'Multiple Entries', 'Measurement']
    const inputs = [name, format];

    const tree = new DecisionInputTree('InputTree', {inputArray: inputs, noSubmission: true});
    const root = tree.root();
    // root.then('InputTree');

    const dic = (value) => new DecisionInputTree.Condition('format', value);
    function addFormatNode(name, inputArray, value) {
      const node = root.then(name, {inputArray});
      node.conditions.add(dic(value));
      node.relatedTo('format');
      return node;
    }

    addFormatNode('text', [textCntSize], 'Text');
    addFormatNode('radio', [labels], 'Radio');
    addFormatNode('table', rowCols, 'Table');
    // addFormatNode('InputTree', null, 'Multiple Entries');
    addFormatNode('measure', [units], 'Measurement');

    let multiNodeAdded = false;
    root.onChange((values) => {
      if (multiNodeAdded) return;
      if (values.format === 'Multiple Entries') {
        const inputTemplate = new MultipleEntries(DecisionInputTree.inputTree(), {name: 'templates'});
        addFormatNode('multiInput', [inputTemplate], 'Multiple Entries');
        multiNodeAdded = true;
        const rootElem = du.find(`.decision-input-cnt[node-id='${tree.root().id()}']`);
        DecisionInputTree.update()(rootElem);
      }
    });

    const tJson = tree.toJson();
    console.log(tree.toString());
    console.log(DecisionInputTree.fromJson(tJson));
    console.log(DecisionInputTree.fromJson(tJson).toString());
    console.log(DecisionInputTree.fromJson(tJson).toString());

    this.valid = tree.completed;
    tree.clone = DecisionInputTree.inputTree;
    this.value = tree.value();
  }
}

const name = new Input({
  name: 'name',
  inline: true,
  label: 'Name',
  class: 'center',
  validation: (val) => val !== ''
});
const format = new Select({
  label: 'Format',
  name: 'format',
  inline: true,
  class: 'center',
  list: ['Text', 'Checkbox', 'Radio', 'Date', 'Time', 'Table', 'Multiple Entries', 'Measurement']
});
const tableType = new Select({
  label: 'Type',
  name: 'type',
  inline: true,
  class: 'center',
  list: ['Text', 'checkbox', 'radio', 'date', 'time']
});
const textCntSize = new Select({
  label: 'Size',
  name: 'size',
  inline: true,
  class: 'center',
  list: ['Small', 'Large']
});
const units = new Select({
  label: 'Units',
  name: 'units',
  inline: true,
  class: 'center',
  list: Measurement.units()
});
const label = new Input({
  name: 'label',
  inline: true,
  label: 'Label',
  class: 'centnodeConds[index].satisfied()) reer',
  validation: (val) => val !== ''
});
const row = new Input({
  name: 'row',
  inline: true,
  label: 'Row',
  class: 'center',
  validation: (val) => val !== ''
});
const col = new Input({
  name: 'col',
  inline: true,
  label: 'Column',
  class: 'center',
  validation: (val) => val !== ''
});

module.exports = InputInput;
