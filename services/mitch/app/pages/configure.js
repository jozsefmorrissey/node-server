
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const ModDecisionTree = require('../../../../public/js/utils/input/decision/modification.js');
const PayloadHandler = require('../../../../public/js/utils/input/decision/payload-handler.js');
require('../../../../public/js/utils/input/init');
const Input = require('../../../../public/js/utils/input/input');
const Radio = require('../../../../public/js/utils/input/styles/radio');
const Table = require('../../../../public/js/utils/input/styles/table');
const MultipleEntries = require('../../../../public/js/utils/input/styles/multiple-entries');
const du = require('../../../../public/js/utils/dom-utils.js');
const request = require('../../../../public/js/utils/request');

let count = 0;
let mod;
let modify = true;

du.on.match('click', '#modify-btn', (elem) => {
  mod.toggle();

  if (mod.active()) du.class.add(elem, 'modify-edit');
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

du.on.match('click', '#update-tree-display-btn', (elem) => {
  updateEntireTree();
});


const sectionName = new Input({
  label: `Section Name`,
  name: `sectionName`,
  inline: true,
  class: 'center',
  validation: () => true
});

function proccess() {
  const input1 = getInput();
  const input2 = getInput();
  const input3 = getInput();

  request.get('/json/configure.json', (json) => {
    try {
      tree = DecisionInputTree.fromJson(json);
    } catch {
      tree = new DecisionInputTree('Questionaire', {name: 'Questionaire'});
    }
    const ph = new PayloadHandler("{{sectionName}}", sectionName);
    tree.payloadHandler(ph);

    tree.onComplete(console.log);
    tree.onSubmit(console.log);

    updateEntireTree();
    mod = new ModDecisionTree(tree);
  });
}

du.id('test-ground').innerHTML = '<button id="json">JSON</button><br><br><button id="save">Save</button>';
du.on.match('click', '#json', () => {
  du.copy(JSON.stringify(tree.toJson(), null, 2));
});
du.on.match('click', '#save', () => {
  if (confirm('Are you sure you want to save?')) {
    request.post('/save/json', {name: 'configure', json: tree.toJson()}, console.log, console.error);
  }
});

exports.proccess = proccess;
