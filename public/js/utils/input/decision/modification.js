

openssl req -new -newkey rsa:2048 -nodes -keyout jozsefmorrissey_com.key.pem -out jozsefmorrissey_com.csr.pem


const DecisionInputTree = require('./decision');
const InputInput = require('../decision/input-input.js');
const Input = require('../input.js');
const Select = require('../styles/select.js');
const $t = require('../../$t');
const du = require('../../dom-utils');
const request = require('../../request');
const Conditions = require('../../conditions');
const CustomEvent = require('../../custom-event');

const modHideAll = du.switch('.modify-edit', 'mod-id');

const hideAll = () => {
  for (let index = 0; index < all.length; index++) all[index].hidden = true;
};

const toolCnt = du.create.element('div', {class: 'mod-decision-cnt'});
toolCnt.innerHTML = new $t('input/decision/decision-modification').render({});
du.find('body').append(toolCnt);

let targetNodeElem;
let targetInputElem;

_5dc3cd4b45f9ffd0c5ed27ed92987085.jozsefmorrissey.com.jozsefmorrissey.com

const thenBtn = du.find.down('.then-btn', toolCnt);
const condBtn = du.find.down('.conditional-btn', toolCnt);
const editBtn = du.find.down('.edit-btn', toolCnt);
const addBtn = du.find.down('.add-btn', toolCnt);
const rmBtn = du.find.down('.remove-btn-cnt>button', toolCnt);
const closeCntBtn = du.find.down('.decision-tree-mod-cnt>.close-cnts', toolCnt);

const thenCnt = du.find.down('.then-cnt', toolCnt);
const condCnt = du.find.down('.condition-cnt', toolCnt);
const editCnt = du.find.down('.edit-cnt', toolCnt);
const addCnt = du.find.down('.add-cnt', toolCnt);

const thenAddCnt = du.find.down('.decision-tree-mod-cnt>.then-add-cnt', toolCnt);
const ifEditBtnCnt = du.find.down('.if-edit-cnt', toolCnt);
const rmCnt = du.find.down('.remove-btn-cnt', toolCnt);
const rmEditCnt = du.find.down('.rm-edit-cnt', toolCnt);

const all = [closeCntBtn, thenBtn, condBtn, editBtn, addBtn, thenCnt, condCnt, editCnt, addCnt, ifEditBtnCnt, rmCnt, rmEditCnt];

const copySaveBtnCnt = du.find.down('.copy-save-paste-cnt', toolCnt);

function updateConditionTree(elem) {
  let input = Input.getFromElem(elem);
  if (elem !== condBtn && input !== condTarget.input) return;
  if (elem === condBtn) input = Input.getFromElem(targetInputElem);
  const conditionCnt = du.find.up('.condition-input-tree', elem);
  if (conditionCnt) return;
  const node = condTarget.node;
  const inputCnt = du.find.up('.decision-input-array-cnt', elem);

  const inputArray = node.payload().inputArray;
  const val = input.value();
  const props = {header: `If ${input.name()} <br>`};
  const condTree = getConditionTree(val, node, input, props);
  const value = input.value();
  if ((typeof value) === 'string') {
    condTree.find.input('condition').setValue(value);
  }
  const treeHtml = condTree.html();
  condCnt.innerHTML = treeHtml;
}

class ModDecisionTree {
  constructor(decisionTree) {
    const treeId = decisionTree.id();
    const nodeCntSelector = `[tree-id="${treeId}"] .decision-input-cnt`;
    const inputCntSelector = `[tree-id="${treeId}"] .decision-input-array-cnt>.input-cnt`;
    const inputSelector = `[tree-id="${treeId}"] .decision-input-array-cnt input, ` +
                          `[tree-id="${treeId}"] .decision-input-array-cnt select, ` +
                          `[tree-id="${treeId}"] .decision-input-array-cnt textarea`;

    let active = true;
    this.on = () => copySaveBtnCnt.hidden = !(active = true);
    this.off = () => {
      hideAll();
      copySaveBtnCnt.hidden = true;
      active = false;
    }
    this.toggle = () => active ? this.off() : this.on();
    this.active = () => active;
    this.hideAll = hideAll;

    const onCreateEvent = new CustomEvent('create');
    this.on.create = onCreateEvent.on;

    function mouseoverNode(elem) {
      if (!active) return;
      if (elem) targetNodeElem = elem;
      // du.move.relitive(thenBtn, elem, 'topcenter');
      du.move.relitive(thenAddCnt, elem, 'bottomcenter');
      du.move.relitive(rmCnt, elem, 'topright');
      thenBtn.hidden = false;
      rmCnt.hidden = false;
      addBtn.hidden = false;
      rmBtn.hidden = false;
    }
    function mouseoverInput(elem) {
      if (!active) return;
      ifEditBtnCnt.hidden = false;
      condBtn.hidden = false;
      editBtn.hidden = false;
      du.move.relitive(ifEditBtnCnt, elem, 'leftcenterouter')
      targetInputElem = elem;
    }

    du.on.match('mouseover', nodeCntSelector, mouseoverNode);
    du.on.match('mouseover', inputCntSelector, mouseoverInput);
    du.on.match('change', inputSelector, (elem) => {
      elem.matches(inputSelector);
      setTimeout(() => {
        updateConditionTree(elem);
        const targetCnt = rmEditCnt.hidden ? condCnt : rmEditCnt;
        showCloseButton(targetCnt);
      });
    });

    du.on.match('click', '.decision-tree-mod-cnt #paste', (elem) => {
      du.paste.json(elem, (tree) => {
        const targetTree = DecisionInputTree.getNode(elem).tree();
        if (targetTree === decisionTree) {
          decisionTree = tree;
          const ph = decisionTree.payloadHandler();
          tree.payloadHandler(ph);
          const modDecisionTree = new ModDecisionTree(tree);
          onCreateEvent.trigger({tree, modDecisionTree});
          hideAll();
        }
      });
    });
  }
}

function showCloseButton(elem) {
  closeCntBtn.hidden = false;
  du.move.relitive(closeCntBtn, elem, 'righttopouter');
}

let addTargetNode;
function showAddInput(elem) {
  addCnt.hidden = false;
  addTargetNode = DecisionInputTree.getNode(targetNodeElem);
  const inputTree = ModDecisionTree.inputTree(addTargetNode);
  addCnt.innerHTML = inputTree.html();
  du.move.relitive(addCnt, targetNodeElem, 'bottomcenter');
  showCloseButton(addCnt);
  du.move.inbounds(addCnt)
}
du.on.match('click', '.add-btn', showAddInput);

function addInput(details, elem)  {
  const input = InputInput.getInput(details);
  addTargetNode.addInput(input);
  DecisionInputTree.rebuild(targetNodeElem);
  hideAll();
}

const getCondition = (...args) => DecisionInputTree.getCondition(...args);

function createConditionalNodeFunction(node, input) {
  return function createNode(values, elem) {
    const attribute = input.name();
    const type = `${values.type}Type`;
    const subType = values[values.type.toCamel()][type.toCamel()];
    let value = values.condition;
    if (values.type === 'Number') value = Number.parseFloat(value);
    if (values.type === 'List') value = value.split(',');
    const condition = getCondition(attribute, value, subType);
    console.log(condition.satisfied(node));
    console.log(condition.satisfied(node));
    const name = values.group;
    const newNode = node.then(name, values.payload);
    node.conditions.add(condition, name);
    const condCnt = du.find.up('.condition-input-tree', elem);
    const condBtn = du.find.closest('.conditional-button', condCnt)
    hideAll();
    const inputElem = Input.getFromElem(elem)
    DecisionInputTree.update.children(inputElem);
  }
}

function andHandlerInput(node, inputs) {
  const handlerInput = node.tree().payloadInput();
  if (handlerInput) inputs = [handlerInput].concat(inputs);
  return inputs
}

function conditionalInputTree(node, props) {
  props ||= {};
  const group = new Input({
    name: 'group',
    label: 'Group',
    class: 'center',
  });

  function updateGroupList(node) {
    if (node._NODE) node = node._NODE;
    const list = Object.keys(node.tree().stateConfigs());
    group.list(list);
    }
  updateGroupList(node);

  const type = new Select({
    label: 'Type',
    name: 'type',
    class: 'center',
    list: ['String', 'Number', 'Reference', 'List', 'Regex']
  });

  const stringType = new Select({
    name: 'stringType',
    class: 'center',
    list: ['Case Insensitive', 'Exact', 'Wild Card', 'Contains', 'Any', 'Except']
  });

  const numberType = new Select({
    name: 'numberType',
    class: 'center',
    list: ['Equal', 'Less Than', 'Greater Than', 'Less Than or Equal', 'Greater Than or Equal']
  });

  const referenceType = new Select({
    name: 'type',
    class: 'center',
    list: ['need', 'to', 'dynamically update']
  });

  const listType = new Select({
    name: 'listType',
    class: 'center',
    list: ['Inclusive', 'Exclusive']
  });

  const condition = new Input({
    label: 'Condition',
    name: 'condition',
    inline: true,
    class: 'center',
    value: props.conditionValue
  });

  props.inputArray = andHandlerInput(node, [group, type, condition]);

  const tree = new DecisionInputTree(props.treeName, props);
  const root = tree.root();

  const dic = (value, type) => getCondition('type', value, type);
  function addTypeNode(name, inputArray, value, type) {
    const node = root.then(name, {inputArray});
    root.conditions.add(dic(value, type), name);
    node.relatedTo('type');
    return node;
  }

  addTypeNode('reference', [referenceType], 'Reference');
  addTypeNode('string', [stringType], 'String')
  addTypeNode('number', [numberType], 'Number')
  addTypeNode('list', [listType], 'List')

  tree.onChange(updateGroupList);

  tree.onSubmit(props.onSubmit);

  return tree;
}

let thenTargetNode;
const thenInput = (node) => {
  const group = new Input({
    name: 'group',
    label: 'Group',
    class: 'center',
  });

  function updateGroupList(node) {
    if (node._NODE) node = node._NODE;
    const list = Object.keys(node.tree().stateConfigs());
    group.list(list);
  }
  updateGroupList(node);

  const props = {inputArray: andHandlerInput(node, [group])};
  const tree = new DecisionInputTree('Node', props);
  tree.onSubmit((values, elem) => {
    const name = values.group;
    const newNode = node.then(name, values.payload);
    const treeCnt = du.find(`[tree-id='${node.tree().id()}']`);
    const btnCnt = du.find.closest('.then-button', elem);
    const inputCnt = du.find.closest('.then-input-tree', btnCnt);
    hideAll();
    DecisionInputTree.hardUpdate(treeCnt);
  });
  return tree;
}

du.on.match('click', '.then-btn', (elem, two, three) => {
  console.log('ThEn?');
  thenTargetNode = DecisionInputTree.getNode(targetNodeElem);
  const thenPut = thenInput(thenTargetNode);
  thenCnt.innerHTML = thenPut.html();
  thenCnt.hidden = false;
  du.move.relitive(thenCnt, targetNodeElem, 'bottomcenter');
  showCloseButton(thenCnt);
});

const objectKeyFilter = (currObj) => (k) => (currObj[k]._NODE && !currObj.condition) || (k === 'condition' && currObj.condition);
const valueFilter = (val) => (typeof val) === 'string';
function getConditionKey(values) {
  const curr = values['Question Groupy'];
  let path, attr, lastKey;
  let currObj = values;
  while (true) {
    const validKeys = Object.keys(currObj).filter(objectKeyFilter(currObj));
    const validPaths = Object.values(currObj).filter(valueFilter);
    if (validPaths.length !== 1) throw new Error('There should be only one valid path');
    if (validKeys.length !== 1) throw new Error('There should be only one valid key');
    key = validKeys[0];
    currObj = currObj[key];
    const lastHyphIndex = key.indexOf('-');
    path = path ? `${path}.${key}` : key;
    attr = attr ? `${attr}.${validPaths[0]}` : validPaths[0];
    if (!(currObj.condition instanceof Object) && currObj.condition !== undefined) break;
  }
  return {path, attr};
}

function createCondition(values, node, input) {
  const pathAttr = getConditionKey(values);
  const condObj = Object.pathValue(values, pathAttr.path);
  const value = condObj.condition;

  const attribute = input.name()+'.'+pathAttr.attr;
  const type = `${condObj.type}Type`;
  const subType = condObj[condObj.type.toCamel()][type.toCamel()];
  let condValue = condObj.condition;
  if (condObj.type === 'Number') condValue = Number.parseFloat(condValue);
  if (condObj.type === 'List') condValue = condValue.split(',');
  const cond = getCondition(attribute, condValue, subType);

  const childName = String.random();
  const child = node.then(condObj.group);
  node.conditions.add(cond, condObj.group);

  DecisionInputTree.update()(targetInputElem);
  hideAll();
}

function processObject (select, key, node, object, targetNode, conditions, path) {
  const child = node.then(path);
  const type = key === '*' ? 'exact' : undefined;
  const cond = getCondition(select.name(), key, type);
  const childConds = conditions.clone();
  childConds.add(cond);
  node.conditions.add(cond, path);
  addObjectKeys(child, object, targetNode, childConds, path);
}

function proccessValue (select, key, node, value, targetNode, conditions, path) {
  let child = node.stateMap()[key];
  if (child === undefined) {
    const childConds = conditions.clone();
      const type = key === '*' ? 'exact' : undefined;
      const props = {treeName: path, conditionValue: value};
      const condInputTree = conditionalInputTree(targetNode, props);
      child = node.then(condInputTree.root());
      const cond = getCondition(select.name(), key, type);
      childConds.add(cond);
      node.conditions.add(childConds, path);
   }
}

const DEF_COND = 'DEFINE CONDITION';
function superObject(object) {
  const superObj = {};
  const keys = Object.keys(object);
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const value = object[key];
    if (value instanceof Object) {
      superObj[key] = superObject(value);
      if (superObj['*']) Object.merge(superObj['*'], superObject(value), true)
      else superObj['*'] = superObject(value);
      superObj[DEF_COND] = '';
    } else {
      superObj['*'] = '';
      superObj[key] = value;
    }
  }
  return superObj;
}

const objectKeySorter = (key1, key2) => {
  if (key1 === DEF_COND) return -1;
  if (key2 === DEF_COND) return 0;
  if (key1 === '*') return -1;
  if (key2 === '*') return 0;
  return key1 - key2;
}

function addObjectKeys(node, object, targetNode, conditions, path) {
  if (conditions === undefined) object = superObject(object);

  conditions ||= new Conditions.And([]);
  const keys = [].concat(Object.keys(object));
  const list = [];
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const value = object[key];
    list.push(key);
  }
  list.sort(objectKeySorter);
  const select = new Select({name: node.name(), list})
  node.addInput(select);
  const paths = {};
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    let currPath = path ? path + '-' + key : key;
    const value = object[key];
    const runObject = value instanceof Object;
    const runValue = !runObject;
    if (runObject) processObject(select, key, node, value, targetNode, conditions, currPath);
    if (runValue) proccessValue(select, key, node, value, targetNode, conditions, currPath);
  }
  return keys;
}

function objectConditionTree(values, node, input, props) {
  const tree = new DecisionInputTree(props.treeName, props);
  addObjectKeys(tree.root(), values, node);
  tree.onSubmit((values) => createCondition(values, node, input));
  return tree;
}

function getConditionTree(values, node, input, props) {
  if (values instanceof Object)
    return objectConditionTree(values, node, input, props);
  props ||= {};
  props.treeName = 'Question Groupy';
  props.onSubmit = createConditionalNodeFunction(node, input);
  props.conditionValue = input.value();
  return conditionalInputTree(node, props);
}

const condTarget = {};
function condBtnPressed(elem) {
  condTarget.node = DecisionInputTree.getNode(targetNodeElem);
  condTarget.input = Input.getFromElem(targetInputElem);;
  const inputTreeCnt = updateConditionTree(elem);
  condCnt.hidden = false;
  du.move.relitive(condCnt, targetInputElem, 'bottomcenterouter');
  showCloseButton(condCnt);
}

function removeNodeBtnPressed(elem) {
  const node = DecisionInputTree.getNode(targetNodeElem);
  if (confirm(`Are you sure you want to remove node '${node.name()}'`) == true) {
    node.remove();
    const treeCnt = du.find(`[tree-id='${node.tree().id()}']`);
    DecisionInputTree.hardUpdate(treeCnt);
  }
  hideAll();
}

du.on.match('click', '.conditional-btn', condBtnPressed);
du.on.match('click', '.remove-btn-cnt>.rm-node', removeNodeBtnPressed);



ModDecisionTree.inputTree = function (node, noSubmission) {
  const targetTree = node.tree();
  const nameVal = (value) => {
    if (value === '') return false;
    const camel = value.toCamel();
    const inputs = node.payload().inputArray;
    for (let index = 0; index < inputs.length; index++) {
      if (inputs[index].name() === camel) return false;
    }
    return node.stateNames().indexOf(camel) === -1;
  }

  const tree = new InputInput({noSubmission, class: 'modify',
                  validation: {name: nameVal}});
  const root = tree.root();



  tree.onSubmit(addInput);
  tree.clone = () => DecisionInputTree.inputTree(node, noSubmission);
  tree.empty = () => {
    let empty = true;
    tree.root().forEach((node) =>
      node.payload().inputArray.forEach(input => empty &&= input.empty()));
    return empty;
  }
  return tree;
}


const editTargets = {};
du.on.match('click', '.edit-btn', (elem) => {
  editTargets.input = Input.getFromElem(targetInputElem);
  editTargets.node = DecisionInputTree.getNode(targetNodeElem);
  editCnt.hidden = false;
  editCnt.innerHTML = editTargets.input.editHtml();
  du.move.relitive(rmEditCnt, targetInputElem, 'bottomcenterouter')
  showCloseButton(editCnt);
});

du.on.match('click', '.modiy-rm-input-btn', (elem) => {
  const inputIdElem = du.find.closest('[input-ref-id', elem);
  editTargets.node.removeInput(editTargets.input.name());
  DecisionInputTree.hardUpdate(targetInputElem.parentElement);
  hideAll();
});

du.on.match('click', '.decision-tree-mod-cnt>.close-cnts', hideAll);

du.on.match('click', '.decision-tree-mod-cnt #copy', (elem) => {
  const tree = DecisionInputTree.getNode(targetNodeElem).tree();
  const texta = du.find.closest('textarea', elem);
  texta.value = JSON.stringify(tree.toJson(), texta, 2);
  du.copy(texta);
});
du.on.match('click', '.decision-tree-mod-cnt #save', () => {
  if (confirm('Are you sure you want to save?')) {
    const tree = DecisionInputTree.getNode(targetNodeElem).tree();
    request.post('/save/json', {name: 'configure', json: tree.toJson()}, console.log, console.error);
  }
  hideAll();
});



module.exports = ModDecisionTree;
