
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const Input = require('../../../../public/js/utils/input/input');
const Radio = require('../../../../public/js/utils/input/styles/radio');
const Table = require('../../../../public/js/utils/input/styles/table');
const MultipleEntries = require('../../../../public/js/utils/input/styles/multiple-entries');
const du = require('../../../../public/js/utils/dom-utils.js');

let count = 0;
const getInput = () => new Input({
  label: `Label${++count}`,
  name: `Name${count}`,
  inline: true,
  class: 'center',
});

let tree;
function updateEntireTree() {
  const body = tree.html(null, true);
  du.id('config-body').innerHTML = body;
}

function addInput(elem) {
  const node = DecisionInputTree.getNode(elem);
  node.payload().inputArray.push(getInput());
  if (node.payload().isRoot()) updateEntireTree();
  else {
    const html = node.payload().html(null, true);
    du.find.up('.decision-input-cnt', elem).outerHTML = html;
  }
}






















du.on.match('click', '.add-btn', addInput);
function proccess() {
  const input1 = getInput();
  const input2 = getInput();
  const input3 = getInput();
  tree = new DecisionInputTree('root', {inputArray: [input1, input2, input3]});

  tree.onComplete(console.log);
  tree.onSubmit(console.log);

  updateEntireTree();
}

// const radio = new Radio({
//   name: 'radeo',
//   description: 'Pussy farts',
//   list: ['one', 2, 3, 'four']
// });
// du.id('test-ground').innerHTML = radio.html();
// du.id('test-ground').innerHTML = Radio.yes_no({name: 'yn'}).html();
// du.id('test-ground').innerHTML = Radio.true_false({name: 'tf'}).html();

const table = new Table({
  name: 'tabal',
  description: 'Pussy fartsss',
  columns: ['one', 2, 3, 'four'],
  rows: ['bill', 'scott', 'joe', 'fred']
});
du.id('test-ground').innerHTML = table.html();

// const input1 = getInput();
// const input2 = getInput();
// const input3 = getInput();
// const me = new MultipleEntries([input1, input2, input3], {label: 'oneTwoThree'});
// du.id('test-ground').innerHTML = me.html();

exports.proccess = proccess;
