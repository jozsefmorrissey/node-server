
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const PayloadHandler = require('../../../../public/js/utils/input/decision/payload-handler.js');
require('../../../../public/js/utils/input/init');
const Input = require('../../../../public/js/utils/input/input');
const Radio = require('../../../../public/js/utils/input/styles/radio');
const Table = require('../../../../public/js/utils/input/styles/table');
const MultipleEntries = require('../../../../public/js/utils/input/styles/multiple-entries');
const du = require('../../../../public/js/utils/dom-utils.js');

let count = 0;
let modify = true;

du.on.match('click', '#modify-btn', (elem) => {
  modify = !modify
  if (modify) du.class.add(elem, 'modify-edit');
  else du.class.remove(elem, 'modify-edit');
  // updateEntireTree();
});

const getInput = () => new Input({
  label: `Label${++count}`,
  name: `Name${count}`,
  inline: true,
  class: 'center',
});

let tree;
function updateEntireTree() {
  const body = tree.html(null, modify);
  du.id('config-body').innerHTML = body;
}



function proccess() {
  const input1 = getInput();
  const input2 = getInput();
  const input3 = getInput();
  // tree = new DecisionInputTree('ancestry', {name: 'Ancestry'});
  tree = DecisionInputTree.fromJson(treeJson);
  tree.payloadHandler(new PayloadHandler('ancestry', new Input({name: 'name', label: 'Name', optional: true})));

  tree.onComplete(console.log);
  tree.onSubmit(console.log);

  updateEntireTree();
}

du.id('test-ground').innerHTML = '<button id="json">JSON</button>';
du.on.match('click', '#json', () => {
  du.copy(JSON.stringify(tree.toJson(), null, 2));
})


exports.proccess = proccess;