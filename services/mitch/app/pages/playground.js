
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const ModDecisionTree = require('../../../../public/js/utils/input/decision/modification.js');
const PayloadHandler = require('../../../../public/js/utils/input/decision/payload-handler.js');
require('../../../../public/js/utils/input/init');
const Input = require('../../../../public/js/utils/input/input');
const Radio = require('../../../../public/js/utils/input/styles/radio');
const Table = require('../../../../public/js/utils/input/styles/table');
const MultipleEntries = require('../../../../public/js/utils/input/styles/multiple-entries');
const du = require('../../../../public/js/utils/dom-utils.js');

let count = 0;
let mod;
let modify = true;

du.on.match('click', '#modify-btn', (elem) => {
  mod.toggle();

  if (mod.active()) du.class.add(elem, 'modify');
  else du.class.remove(elem, 'modify');
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

du.on.match('click', '#update-tree-display-btn', (elem) => {
  updateEntireTree();
});

function proccess() {
  const input1 = getInput();
  const input2 = getInput();
  const input3 = getInput();
  // tree = new DecisionInputTree('Questionaire', {name: 'Questionaire'});
  tree = DecisionInputTree.fromJson(treeJson);
  // const ph = new PayloadHandler("<button class='mod-decision-node'>Modify</button>");
  // tree.payloadHandler(ph);

  tree.onComplete(console.log);
  tree.onSubmit(console.log);

  updateEntireTree();
  mod = new ModDecisionTree(tree);
}


du.id('test-ground').innerHTML = '<button id="json">JSON</button>';
du.on.match('click', '#json', () => {
  du.copy(JSON.stringify(tree.toJson(), null, 2));
})


exports.proccess = proccess;
