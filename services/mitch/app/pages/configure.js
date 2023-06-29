
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
  du.id('save').hidden = !mod.active();
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

const sectionName = new Input({
  label: `Section Name`,
  name: `sectionName`,
  inline: true,
  class: 'center',
  validation: () => true
});

let tree;
const ph = new PayloadHandler("{{sectionName}}", sectionName);
function updateEntireTree() {
  const body = tree.html(null, modify);
  du.id('config-body').innerHTML = body;
}

du.on.match('click', '#update-tree-display-btn', (elem) => {
  updateEntireTree();
  mod.hideAll();
});


function proccess() {
  const input1 = getInput();
  const input2 = getInput();
  const input3 = getInput();

  request.get('/json/configure.json', (json) => {
    try {
      json.noSubmission = true;
      tree = DecisionInputTree.fromJson(json);
    } catch {
      tree = new DecisionInputTree('Questionaire', {name: 'Questionaire', noSubmission: true});
    }
    tree.payloadHandler(ph);

    tree.onComplete(console.log);
    tree.onSubmit(console.log);

    updateEntireTree();
    mod = new ModDecisionTree(tree);
    mod.on.create((update) => {
      tree = update.tree;
      mod = update.modDecisionTree;
      updateEntireTree();
    });
  });
}


exports.proccess = proccess;
