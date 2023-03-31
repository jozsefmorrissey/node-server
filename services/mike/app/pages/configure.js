
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const Input = require('../../../../public/js/utils/input/input');
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
  const body = tree.payload().html(null, true);
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
  tree = new DecisionInputTree()
  const input1 = getInput();
  const input2 = getInput();
  const input3 = getInput();
  tree.leaf('root', [input1, input2, input3]);
  updateEntireTree();
}

exports.proccess = proccess;
