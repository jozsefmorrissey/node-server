
// TODO IMPORTANT: refactor this garbage!!!!!!
// ... its extreamly unIntuitive.



const DecisionTree = require('../../decision-tree.js');
const Input = require('../input.js');
const NumberInput = require('../styles/number.js');
const InputList = require('../styles/list');
const Radio = require('../styles/radio');
const Table = require('../styles/table');
const MeasurementInput = require('../styles/measurement');
const Textarea = require('../styles/textarea.js');
const CustomEvent = require('../../custom-event');
const Select = require('../styles/select.js');
const MultipleEntries = require('../styles/multiple-entries.js');
const du = require('../../dom-utils');
const $t = require('../../$t');
const Measurement = require('../../measurement');


const nameCompareFunc = (name) => (input) => input.name() === name ? input : false;
const inputSelectorFunc = (func) => (node) => {
  const inArr = node.inputArray();
  for (let index = 0; index < inArr.length; index++) {
    const input = inArr[index];
    let val = func(input);
    if (val) return val;
    if (input instanceof MultipleEntries) {
      val = input.input(func);
      if (val) return val;
    }
  }
}
const nodeSelectorFunc = (nameOfunc) => inputSelectorFunc(
          (typeof nameOfunc) === 'function' ? nameOfunc : nameCompareFunc(nameOfunc));



class DecisionInput extends DecisionTree.Node {
  constructor(stateConfig, payload, parent) {
    payload ||= stateConfig.payload();
    payload.inputArray ||= [];
    super(stateConfig, payload, parent);
    const instance = this;

    const parentToJson = this.nodeOnlyToJson;
    this.nodeOnlyToJson = () => {
      const json = parentToJson();
      json.relatedTo = this.relatedTo();
      return json;
    }

    const onChange = [];
    const changeEvent = new CustomEvent('change');

    const trigger = () => {
      changeEvent.trigger(this.values());
      this.tree().changed();
    }
    this.onChange = (func) => changeEvent.on(func);

    for (let index = 0; index < payload.inputArray; index++) {
      inArr[index].on('change', trigger);
    }

    this.relatedTo = (value) => {
      if (this.isRoot()) {
        if (value) throw new Error('The root cannot be related to any other input');
        return;
      }
      const validList = this.parent().inputArray().map(i => i.name());
      const prevValue = this.metadata('relatedTo');
      value = this.metadata('relatedTo', value);
      if (validList.indexOf(value) === -1) this.metadata('relatedTo', prevValue);
      return value;
    }

    this.addInput = (input) => {
      if (!(input instanceof Input)) throw new Error('input(arg1) needs to be and instance of Input');
      const payload = this.stateConfig().payload();
      this.stateConfig().setValue('inputArray', payload.inputArray.concat(input))
      trigger();
    }
    this.values = (values, doNotRecurse) => {
      values ||= {};
      if (values._NODE === undefined) values._NODE = this;
      let inputArr = this.inputArray();
      for (let index = 0; index < inputArr.length; index++) {
        const input = inputArr[index];
        if (values[input.name()] === undefined) {
          values[input.name()] = input.value();
        }
      }
      if (!doNotRecurse && !this.isRoot()) this.parent().values(values);
      return values;
    };

    this.isComplete = () => {
      const inArr = this.inputArray();
      let complete = true;
      for (let index = 0; index < inArr.length; index++) {
        complete &= inArr[index].optional() || inArr[index].valid();
      }
      this.forEachChild((child) => complete &=
                !child.reachable() || child.isComplete());
      return complete == 1;
    }
    this.onComplete = this.tree().onComplete;
    let inputTree;
    this.inputTree = () => inputTree ||= DecisionInputTree.inputTree(this);
    function updateInputArray (boolean) {
      const inputArray = payload.inputArray;
      const sc = instance.stateConfig();
      const stateInputArray = sc.payload().inputArray;
      if (inputArray.length === stateInputArray.length) return boolean ? false : inputArray;
      for (let index = 0; index < stateInputArray.length; index++) {
        const input = stateInputArray[index];
        if (inputArray.length - 1 < index) {
          const clone = input.clone();
          if (clone.onChange) clone.onChange(trigger);
          else if (clone.on) clone.on('change', trigger);
          inputArray.push(clone);
        }
        if (inputArray[index].name() !== input.name()) inputArray.splice(index, 1);
      }
      return boolean ? true : inputArray;
    }

    this.inputArray = () => updateInputArray();

    const parentPayload = this.payload;
    this.payload = (noConfig) => {
      this.inputArray();
      return parentPayload(noConfig);
    }

    this.getValue = (index) => this.inputArray()[index].value();
    this.isValid = () => {
      let valid = true;
      this.inputArray.forEach((input) =>
            valid = valid && input.valid());
      return valid;
    }

    this.choices = () => {
      const choices = [];
      this.breathFirst((node) => {
        const inputArr = node.inputArray();
        inputArr.forEach((input) => {
          if (!input.chosen())
            choices.push(input);
        });
      });
      return choices;
    }

    this.find.input = (nameOfunc, ...namePath) => {
      let node;
      if (namePath.length > 0) {
        node = this.find(...namePath);
      }
      node ||= this;
      return node.breathFirst(nodeSelectorFunc(nameOfunc));
    }

    this.childrenHtml = (inputIndex, editDisplay) => {
      if (!this.shouldRecurse()) return '';
      const children = this.children();
      const inArr = this.inputArray();
      const inputName = inArr[inputIndex] ? inArr[inputIndex].name() : null;
      let html = '';
      for (let index = 0; index < children.length; index++) {
        const child = children[index];
        if (inputName === child.relatedTo() || (inputIndex === -1 && child.relatedTo() === undefined)) {
          const inArr = child.inputArray();
          if (child.reachable()) {
            html += child.html(editDisplay);
          }
        }
      }
      return html;
    }
    this.tag = () => this.tree().block() ? 'div' : 'span';
    this.html = (editDisplay) => {
      if (editDisplay) {
        return DecisionInput.modTemplate.render(this);
      }
      return DecisionInput.template.render(this);
    }

    this.payloadHtml = () => {
      const pld = this.payload();
      if ((typeof pld.html) === 'function') return pld.html();
      return this.tree().payloadHtml(pld);
    }
  }
}
DecisionInput.template = new $t('input/decision/decision');
DecisionInput.modTemplate = new $t('input/decision/decision-modification');

du.on.match('click', '.conditional-button', (elem) => {
  console.log(elem);
});


// properties
// optional :
// noSubmission: /[0-9]{1,}/ delay that determins how often a submission will be processed
// buttonText: determins the text displayed on submit button;
// inputArray: inputArray to be applied to the root;
// isComplete: function determining if all required inputs are filled.

class DecisionInputTree extends DecisionTree {
  constructor(rootName, props, stateConfigs) {
    props = props || {};
    props.inputArray ||= [];
    super(rootName, props, stateConfigs);
    Object.getSet(this, 'payloadHandler');

    this.payloadHtml = (payload) => {
      const handler = this.payloadHandler();
      if (handler) return handler.html(payload);
    }

    this.payloadInput = () => {
      const handler = this.payloadHandler();
      if (handler) return handler.input();
    }

    this.inputHtml = () => {
      const handler = this.payloadHandler();
      if (handler) return handler.inputHtml();
    }

    let payloadTemplate
    let payloadTemplateName
    this.payloadTemplateName = (name) => {
      if (name && $t.functions[name]) {
        payloadTemplateName = name;
        payloadTemplate = new $t(name);
      }
      return payloadTemplateName;
    }

    this.payloadTemplate = () => payloadTemplate;

    this.buttonText = () => {
      return props.buttonText || `Create ${rootName}`;
    }
    let disabled;
    this.disableButton = (d, elem) => {
      disabled = d === null || d === true || d === false ? d : disabled;
      if (elem) {
        const button = du.find.closest(`button`, elem);
        if (button) {
          button.disabled = disabled === null ? !node.isComplete(root) : disabled;
        }
      }
    }
    this.class = () => props.class || 'card';
    this.buttonClass = () => props.buttonClass;
    this.isComplete = () => {
      if ((typeof props.isComplete) === 'function') return props.isComplete(this.root());
      const choices = this.choices();
      if (choices.length > 0) return false;
      return this.root().isComplete();
    }

    const completeEvent = new CustomEvent('complete');
    const submitEvent = new CustomEvent('submit');
    const changeEvent = new CustomEvent('change');
    this.html = (node, editDisplay) => {
      node = node || this.root();
      const header = props.header;
      const inputHtml = node.html(editDisplay);
      const scope = {node, inputHtml, DecisionInputTree, editDisplay, header};
      if (node.isRoot()) {
        return DecisionInputTree.template.render(scope);
      }
      return inputHtml;
    };
    this.onComplete = completeEvent.on;
    this.onSubmit = submitEvent.on;
    this.hideButton = props.noSubmission;
    this.onChange = (func) => this.root().onChange(func);

    let completionPending = false;
    this.completed = () => {
      if (!this.isComplete()) return false;
      const delay = props.noSubmission || 0;
      if (!completionPending) {
        completionPending = true;
        setTimeout(() => {
          const values = this.values();
          completeEvent.trigger(values, this);
          completionPending = false;
        }, delay);
      }
      return true;
    }

    let submissionPending = false;
    this.submit = (elem) => {
      // TODO: delay = props.noSubmission === confusing
      const delay = props.noSubmission || 0;
      if (!submissionPending) {
        submissionPending = true;
        setTimeout(() => {
          const values = this.values();
          if (!this.isComplete()) return submissionPending = false;
          submitEvent.trigger(values, elem);
          submissionPending = false;
        }, delay);
      }
      return true;
    }

    let changePending = 0;
    const delay = props.noSubmission || 0;
    this.changed = () => {
      let changeId = ++changePending;
      setTimeout(() => {
        if (changeId === changePending) {
          const values = this.values();
          changeEvent.trigger(values)
        }
      }, delay);
    }

    let block = false;
    this.block = (is) => {
      if (is === true || is === false) {
        block = is;
      }
      return block;
    }

    this.find = (...args) => this.root().find(...args);
    this.find.input = (...args) => this.root().find.input(...args);

    this.values = () => {
      const values = {};
      this.root().breathFirst((node) => {
        const obj = {};
        node.values(obj, true);
        Object.pathValue(values, node.path().join('.'), obj);
      });
      return values[this.root().name()];
    }

    this.choices = () => this.root().choices();

    const parentGetState = this.getState;
    this.getState = (name, payload) => {
      if (!this.stateConfigs()[name]) {
        if (!payload) payload = {};
        payload.inputArray ||= [];
      }
      return parentGetState(name, payload);
    }

    this.clone = () => DecisionInputTree.fromJson(this.toJson());
    this.valid = this.completed;
    this.name = () => this.root().name();
    this.value = this.values;

    return this;
  }
}


DecisionInputTree.class = 'decision-input-tree';
DecisionInputTree.buttonClass = 'decision-input-tree-submit';

DecisionInputTree.getNode = (elem) => {
  const cnt = du.find.closest('[node-id]', elem);
  const parent = cnt.parentElement;
  const nodeId = cnt.getAttribute('node-id');
  return Lookup.get(nodeId);
}

DecisionInputTree.hardUpdate = (elem) => {
  const tree = DecisionInputTree.getTree(elem);
  const treeCnt = du.find.up('[tree-id]', elem);
  const cnt = treeCnt.parentElement;
  const modCnt = du.find.down('.decision-input-cnt', elem);
  const mod = du.class.has(modCnt, 'mod');
  cnt.innerHTML = tree.html(null, mod);
}
DecisionInputTree.update = (soft) =>
(elem, force) => {
  // if (elem.matches('.modification-add-input *')) return;

  const nodeCnt = du.find.up('[node-id]', elem);
  const inputs = du.find.downAll('select,input,textarea', nodeCnt);
  for (let index = 0; index < inputs.length; index++) {
    const input = inputs[index];

    const cnt = du.find.closest('[node-id]', input);
    const nodeId = cnt.getAttribute('node-id');
    const node = Lookup.get(nodeId);

    const inputCnt = du.find.up('.decision-input-array-cnt', input);
    const inputIndex = Number.parseInt(inputCnt.getAttribute('index'));
    const childrenHtmlCnt = du.find.down('.children-recurse-cnt', inputCnt);
    const prevHash = childrenHtmlCnt.getAttribute('hash-value');
    const currHash =  '' + Object.hash(node.values()[input.name]);
    const parentName = input.name;
    const cs = node.children();
    if (force === true || prevHash !== currHash) {
      cs.forEach((child) => {
        const di = node.payload();
        const inputArray = di.inputArray;
      });
      childrenHtmlCnt.setAttribute('hash-value', currHash);
      const parentCnt = du.find.up('.decision-input-cnt', childrenHtmlCnt)
      const mod = du.class.has(parentCnt, 'mod');
      const childHtml = node.childrenHtml(inputIndex, mod);
      childrenHtmlCnt.innerHTML = childHtml;
    }


    // if(!soft) {
    //   node.root().changed();
    //   node.root().completed()
    // }
  }
};

DecisionInputTree.Node = DecisionInput;
DecisionInputTree.submit = (elem) => {
  const tree = Lookup.get(elem.getAttribute('tree-id'));
  tree.submit(elem);
}

function updateModBtn(elem) {
  const button = du.find.closest('.conditional-button', elem);
  const input = Input.getFromElem(button);
  if (input) {
    const value = input.value();
    if (value instanceof Object) button.innerText = `If ${input.name()}`;
    else if (button && button.getAttribute('target-id') === elem.id) {
      button.innerText = `If ${elem.name} = ${value}`;
    }
  }
}

let count = 999;
// const getInput = () => new Input({
//   label: `Label${++count}`,
//   name: `Name${count}`,
//   inline: true,
//   class: 'center',
// });

function andHandlerInput(node, inputs) {
  const handlerInput = node.tree().payloadInput();
  if (handlerInput) inputs = [handlerInput].concat(inputs);
  return inputs
}


function conditionalInputTree(node, input, props) {
  function createNode(values, elem) {
    const attribute = input.name();
    const type = `${values.type}Type`;
    let value = values.condition;
    if (values.type === 'Number') value = Number.parseFloat(value);
    if (values.type === 'List') value = value.split(',');
    const condition = new DecisionInputTree.Conditions.node(attribute, value, type);
    const name = values.group;
    const newNode = node.then(name, values.payload);
    newNode.conditions.add(condition);
    newNode.relatedTo(attribute);
    const condCnt = du.find.up('.condition-input-tree', elem);
    const condBtn = du.find.closest('.conditional-button', condCnt)
    condCnt.hidden = true;
    condBtn.hidden = false;
    const inputElem = du.find.closest(`[input-id="${input.id()}"]`, elem)
    DecisionInputTree.update()(inputElem, true);
  }

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
    list: ['Any', 'Exact', 'Except', 'Contains']
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
  });

  props.inputArray = andHandlerInput(node, [group, type, condition]);

  const tree = new DecisionInputTree('Question Group', props);
  const root = tree.root();

  const dic = (value, type) => new DecisionInputTree.Conditions.node('type', value, type);
  function addTypeNode(name, inputArray, value, type) {
    const node = root.then(name, {inputArray});
    node.conditions.add(dic(value, type));
    node.relatedTo('type');
    return node;
  }

  addTypeNode('reference', [referenceType], 'Reference');
  addTypeNode('string', [stringType], 'String')
  addTypeNode('number', [numberType], 'Number')
  addTypeNode('list', [listType], 'List')

  tree.onChange(updateGroupList);

  tree.onSubmit(createNode);

  return tree;
}

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

  const props = {inputArray: andHandlerInput(node, group)};
  const tree = new DecisionInputTree('Next', props);
  tree.onSubmit((values, elem) => {
    const name = values.group;
    const newNode = node.then(name, values.payload);
    const treeCnt = du.find(`[tree-id='${node.tree().id()}']`);
    const btnCnt = du.find.closest('.then-button', elem);
    const inputCnt = du.find.closest('.then-input-tree', btnCnt);
    inputCnt.hidden = true;
    btnCnt.hidden = false;
    DecisionInputTree.hardUpdate(treeCnt);
  });
  return tree;
}

du.on.match('click', '.then-button', (elem, two, three) => {
  console.log('ThEn?');
  const node = DecisionInputTree.getNode(elem);
  const thenPut = thenInput(node);
  const inputCnt = du.find.closest('.then-input-tree', elem);
  inputCnt.innerHTML = thenPut.html();
  elem.hidden = true;
  inputCnt.hidden = false;
});

function addObjectKeys(node, object, conditions) {
  conditions ||= new DecisionInputTree.Conditions.And([]);
  const keys = ['*'].concat(Object.keys(object));
  const list = [];
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const value = object[key];
    list.push(key);
  }
  const select = new Select({name: node.name(), list})
  node.addInput(select);
  const paths = {};
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const value = object[key];
    let path = node.path().join() + `${key}`;
    if (value instanceof Object) {
      const child = node.then(path);
      const cond = new DecisionInputTree.Conditions.node(node.name(), key);
      const childConds = conditions.clone();
      childConds.add(cond);
      child.conditions.add(cond);
      addObjectKeys(child, value, childConds);
    } else if (path !== '*'){
      let child = node.stateMap()[path];
      if (child === undefined) {
        const childConds = conditions.clone();
        child = node.then(path);
        if (paths[path] === undefined) {
          child.addInput(new Input({name: 'condition', label: 'Condition', value}))
          const cond = new DecisionInputTree.Conditions.node(node.name(), key);
          childConds.add(cond);
          child.conditions.add(childConds);
          paths[path] = true;
        }
      }
    }
  }
}

function objectConditionTree(values, node, input, props) {
  const tree = new DecisionInputTree('Question Groupy', props);
  addObjectKeys(tree.root(), values);
  return tree;
}

function getConditionTree(values, node, input, props) {
  if (values instanceof Object)
    return objectConditionTree(values, node, input, props);
  return conditionalInputTree(node, input, props);
}

function updateConditionTree(elem) {
  const conditionCnt = du.find.up('.condition-input-tree', elem);
  if (conditionCnt) return;
  const node = DecisionInputTree.getNode(elem);
  const inputArray = node.payload().inputArray;
  const input = Input.getFromElem(elem);
  const val = input.value();
  const props = {header: `If ${input.name()} <br>`};
  const condTree = getConditionTree(val, node, input, props);
  const value = input.value();
  if ((typeof value) === 'string') {
    condTree.find.input('condition').setValue(value);
  }
  const treeHtml = condTree.html();
  const inputTreeCnt = du.find.closest('.condition-input-tree', elem);
  if (inputTreeCnt) {
    inputTreeCnt.innerHTML = treeHtml;
    return inputTreeCnt;
  }
}

function modifyBtnPressed(elem) {
  const inputTreeCnt = updateConditionTree(elem);
  elem.hidden = true;
  inputTreeCnt.hidden = false;
}

function removeNodeBtnPressed(elem) {
  const node = DecisionInputTree.getNode(elem);
  if (confirm(`Are you sure you want to remove node '${node.name()}'`) == true) {
    node.remove();
    const treeCnt = du.find(`[tree-id='${node.tree().id()}']`);
    DecisionInputTree.hardUpdate(treeCnt);
  }
}

const treeSelector = `.${DecisionInputTree.class}`;
du.on.match('keyup', treeSelector, DecisionInputTree.update(true));
du.on.match('change', treeSelector, DecisionInputTree.update());
du.on.match('change', treeSelector,     updateConditionTree);
du.on.match('click', `.${DecisionInputTree.buttonClass}`, DecisionInputTree.submit);
du.on.match('keyup:change', '.decision-input-cnt.mod input', updateModBtn);
du.on.match('keyup:change', '.decision-input-cnt.mod select', updateModBtn);
du.on.match('keyup:change', '.decision-input-cnt.mod textarea', updateModBtn);
du.on.match('click', '.conditional-button', modifyBtnPressed);
du.on.match('click', '.remove-btn-cnt>.rm-node', removeNodeBtnPressed);

DecisionInputTree.DO_NOT_CLONE = true;

DecisionInputTree.getTree = (elem) => {
  const rootElem = du.find.up("[tree-id]", elem);
  const rootId = rootElem.getAttribute('tree-id');
  const tree = DecisionInputTree.get(rootId);
  return tree;
}
DecisionInputTree.getCondition = DecisionTree.Condition.getter((node) => node.values());

// TODO: merge this with parent... duplications
function childrenFromJson(parent, json) {
  const children = Object.values(json.children);
  for (let index = 0; index < children.length; index++) {
    const child = children[index];
    const node = parent.then(child.name, Object.fromJson(child.payload));
    childrenFromJson(node, child);
  }
  if (json.metadata)
    Object.keys(json.metadata).forEach((key) =>
        parent.metadata(key, Object.fromJson(json.metadata[key])));

  json.conditions.forEach(c => parent.conditions.add(Object.fromJson(c)));
  json.childConditions.forEach(c => parent.childConditions.add(Object.fromJson(c)));
}

DecisionInputTree.fromJson = (json) => {
  const stateConfigs = Object.fromJson(json.stateConfigs);
  const tree = new DecisionInputTree(json.root.name, null, stateConfigs);
  const root = tree.root();
  childrenFromJson(root, json.root);

  return tree;
  // let nodeMap = {};
  // nodeMap[json.nodeId] = root;
  // const paths = [rootConfig.name];
  // let currIndex = 0;
  // while (currIndex < paths.length) {
  //   const pathArr = paths[currIndex].split('.');
  //   const parent = tree.getByIdPath.apply(tree, pathArr.slice(0, -1));
  //   const node = tree.getByIdPath.apply(tree, pathArr);
  //   if (node === undefined) {
  //     const nodeId = pathArr[pathArr.length - 1];
  //     console.log('createNew')
  //     const config = json.stateConfigs[nodeId];
  //     const subPaths = Object.keys(Object.pathValue(json.tree, path));
  //     subPaths.forEach((subPath) => paths.push(`${path}.${subPath}`));
  //   }
  //   console.log(path);
  //   currIndex++;
  // }
}

DecisionInputTree.template = new $t('input/decision/decisionTree');

DecisionInputTree.rebuild = (elem) => {
  const treeCnt = du.find.up('[tree-id]', elem);
  if (!treeCnt) throw new Error('elem is not contained within a tree\'s html');
  const tree = Lookup.get(treeCnt.getAttribute('tree-id'));
  const body = tree.html(null, true);
  treeCnt.parentElement.innerHTML = body;
}

function getInput(details)  {
  const name = details.name.toCamel();
  const label = details.name;
  let inline = details.inline;
  let list;
  switch (details.format) {
    case 'Text':
      if (details.text.size === 'Large')
        return new Textarea({name, label});
      else
        return new Input({type: 'text', name, label, inline});
    case 'Number':
      const step = details.number.step;
      const min = details.number.min;
      const max = details.number.max;
      return new NumberInput({name, label, min, max, step});
    case 'Date':
      return new Input({type: 'date', name, label, inline});
    case 'Time':
      return new Input({type: 'time', name, label, inline});
    case 'Checkbox':
      return new Input({type: 'checkbox', name, label, inline});
    case 'Radio':
      inline = details.radio.inline;
      list = details.radio.labels;
      return new Radio({name, label, list, inline});
    case 'Select':
      list = details.select.options.map(input => input.value());
      return new Select({name, label, list});
    case 'Table':
      const rows = details.table.row.map(input => input.value());
      const columns = [];
      details.table.columns.forEach(dit => columns.push(getInput(dit.values())))
      const type = details.table.type;
      return new Table({name, label, rows, columns, type});
    case 'Measurement':
      const units = details.measure.units;
      return new MeasurementInput({name, label, units});
    case 'Multiple Entries':
      const templates = details.multi.templates;
      list = [];
      inline = details.multi.inline;
      for (let index = 0; index < templates.length; index++) {
        const values = templates[index].values();
        values.inline = inline;
        const input = getInput(values);
        list.push(input);
      }
      return new MultipleEntries(new InputList({name, list, inline}));
    default:
      throw new Error('In the future this will not be reachable');
  }
}

function addInput(details, elem)  {
  const input = getInput(details);
  const modCnt = du.find.up('.modification-add-input', elem);
  const nodeCnt = du.find.up('[node-id]', modCnt);
  const node = Lookup.get(nodeCnt.getAttribute('node-id'));
  node.addInput(input);
  DecisionInputTree.rebuild(nodeCnt);
}

const noSubmitInputTree = (node) => () =>
      DecisionInputTree.inputTree(node, true);
DecisionInputTree.inputTree = function (node, noSubmission) {
  const targetTree = node.tree();
  const name = new Input({
    name: 'name',
    label: 'Name',
    class: 'center',
    validation: (value) => {
      if (value === '') return false;
      const camel = value.toCamel();
      const inputs = node.payload().inputArray;
      for (let index = 0; index < inputs.length; index++) {
        if (inputs[index].name() === camel) return false;
      }
      return node.stateNames().indexOf(camel) === -1;
    }
  });
  const inline = new Input({
    name: 'inline',
    value: true,
    label: 'Inline',
    class: 'center',
    type: 'checkbox'
  });
  const format = new Select({
    label: 'Format',
    name: 'format',
    class: 'center',
    list: ['Text', 'Checkbox', 'Number', 'Radio', 'Select', 'Date', 'Time', 'Table', 'Multiple Entries', 'Measurement']
  });
  const step = new NumberInput({name: 'step', optional: true, label: 'Step'});
  const min = new NumberInput({name: 'min', optional: true, label: 'Minimum'});
  const max = new NumberInput({name: 'max', optional: true, label: 'Maximum'});
  const tableType = new Select({
    label: 'Type',
    name: 'type',
    class: 'center',
    list: ['Text', 'checkbox', 'radio', 'date', 'time']
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
    class: 'centnodeConds[index].satisfied()) reer',
    validation: (val) => val !== ''
  });
  const row = new Input({
    name: 'row',
    class: 'center',
    validation: (val) => val !== ''
  });
  const col = new Input({
    name: 'col',
    class: 'center',
    validation: (val) => val !== ''
  });
  const labels = new MultipleEntries(label, {name: 'labels'});
  const options = new MultipleEntries(option, {name: 'options'});
  // const colType = new InputList({name: 'cols', list: [col, tableType]});
  const colType = new MultipleEntries(noSubmitInputTree(node), {name: 'columns'});
  const rowCols = [tableType, colType,
                    new MultipleEntries(row, {name: 'row', label: 'Rows'})];


  const inputs = [name, format];
  const multiEnt = new MultipleEntries(noSubmitInputTree(node), {name: 'templates'});

  const tree = new DecisionInputTree('Input', {inputArray: inputs, noSubmission, class: 'modify'});
  const root = tree.root();

  const dic = (value) => new DecisionInputTree.Conditions.node('format', value);
  function addFormatNode(name, inputArray, value) {
    const node = root.then(name, {inputArray});
    node.conditions.add(dic(value));
    node.relatedTo('format');
    return node;
  }

  addFormatNode('text', [textCntSize], 'Text');
  addFormatNode('select', [options], 'Select');
  addFormatNode('radio', [inline, labels], 'Radio');
  addFormatNode('table', rowCols, 'Table');
  addFormatNode('multi', [inline, multiEnt], 'Multiple Entries');
  addFormatNode('measure', [units], 'Measurement');
  addFormatNode('number', [step, min, max], 'Number');


  // const tJson = tree.toJson();
  // console.log(tree.toString());
  // console.log(DecisionInputTree.fromJson(tJson));
  // console.log(DecisionInputTree.fromJson(tJson).toString());
  // console.log(DecisionInputTree.fromJson(tJson).toString());

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

DecisionInputTree.Conditions = require('./conditions');

module.exports = DecisionInputTree;
