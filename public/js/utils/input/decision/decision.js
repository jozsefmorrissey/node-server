
// TODO IMPORTANT: refactor this garbage!!!!!!
// ... its extreamly unIntuitive.



const DecisionTree = require('../../decision-tree.js');
const Input = require('../input.js');
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

const ROOT_CLASS = 'decision-input-tree';

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

class DecisionInputCondition extends DecisionTree.Condition {
  constructor(attribute, value) {
    super();
    Object.getSet(this, {attribute, value});
    this.satisfied = (node) => {
      const values = node.values();
      return Object.pathValue(values, attribute) === value;
    }
  }
}
DecisionInputCondition.fromJson = (json) =>
      new DecisionInputCondition(json.attribute, json.value);

class DecisionInput extends DecisionTree.Node {
  constructor(stateConfig, payload, parent) {
    payload ||= stateConfig.payload();
    payload.inputArray ||= [];
    super(stateConfig, payload, parent);
    const instance = this;

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

    let relatedTo;
    this.relatedTo = (value) => {
      if (this.isRoot()) throw new Error('The root cannot be related to any other input');
      const validList = this.parent().inputArray().map(i => i.name());
      value ||= relatedTo;
      if (validList.indexOf(value) === -1) value = undefined;
      if (value) return relatedTo = value;
      return relatedTo
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
      for (let index = 0; index < inArr.length; index++) {
        if (!inArr[index].optional() && !inArr[index].valid()) return false;
      }
      let isComplete = true;
      this.forEachChild((child) => isComplete &&= child.isComplete());
      return isComplete;
    }
    this.onComplete = this.tree().onComplete;
    let inputTree;
    this.inputTree = () => inputTree ||= DecisionInputTree.inputTree();
    function updateInputArray (boolean) {
      const inputArray = payload.inputArray;
      const sc = instance.stateConfig();
      // MultipleEntries.initialize(sc.payload().inputArray());
      const stateInputArray = sc.payload().inputArray;
      if (inputArray.length === stateInputArray.length) return boolean ? false : inputArray;
      for (let index = 0; index < stateInputArray.length; index++) {
        const input = stateInputArray[index];
        if (inputArray.length - 1 < index) {
          const clone = input.clone();
          if (clone.onChange) clone.onChange(trigger);
          else if (clone.on) clone.on('change', trigger);
          inputArray.push(clone);
          clone.initialize && clone.initialize();
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

    this.class =  ROOT_CLASS;
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
      const inputName = inArr[inputIndex].name();
      let html = '';
      for (let index = 0; index < children.length; index++) {
        const child = children[index];
        if (inputName === child.relatedTo() || (inputIndex === inArr.length - 1 && child.relatedTo() === undefined)) {
          const inArr = child.inputArray();
          if (child.reachable()) {
            inArr.forEach(i => i.initialize && i.initialize());
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
  constructor(rootName, props) {
    props = props || {};
    props.inputArray ||= [];
    super(rootName, props);
    this.root().payload()

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
      let inputHtml = node.html(editDisplay);
      const scope = {node, inputHtml, DecisionInputTree, editDisplay};
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

DecisionInputTree.update = (soft) =>
(elem) => {
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
    const value = childrenHtmlCnt.getAttribute('value');
    const parentValue =  node.values()[input.name];
    const parentName = input.name;
    const cs = node.children();
    if (!parentValue || value !== parentValue) {
      cs.forEach((child) => {
        const di = node.payload();
        const inputArray = di.inputArray;
        inputArray.forEach(input => input.isInitialized() || input.initialize());
        if (child.name() === 'multi') {
          child.stateConfig().payload().inputArray[0].initialize()
          child.stateConfig().payload().inputArray[0].initialize()
        }
      });
      childrenHtmlCnt.setAttribute('value', parentValue)
      const childHtml = node.childrenHtml(inputIndex)
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
  const value = elem.value;
  const button = du.find.closest('.conditional-button', elem);
  if (button && button.getAttribute('target-id') === elem.id) {
    button.innerText = `If ${elem.name} = ${value}`;
  }
}

let count = 999;
const getInput = () => new Input({
  label: `Label${++count}`,
  name: `Name${count}`,
  inline: true,
  class: 'center',
});

function conditionalInputTree() {
  const group = new Input({
    name: 'group',
    inline: true,
    label: 'Group',
    class: 'center',
  });

  const type = new Select({
    label: 'Type',
    name: 'type',
    inline: true,
    class: 'center',
    list: ['Any', 'Exact', 'Except', 'Reference', 'List(commaSep)', 'Exclude List(commaSep)', 'Regex']
  });

  const condition = new Input({
    label: 'Condition',
    name: 'condition',
    inline: true,
    class: 'center',
  });

  const reference = new Input({
    label: 'Reference',
    name: 'reference',
    inline: true,
    class: 'center',
  });

  const inputs = [group, type];
  const condCond = new ValueCondition('type', /^(?!(Reference)$).*$/, [condition]);
  const refCond = new ValueCondition('type', 'Reference', [reference]);

  const tree = new DecisionInputTree();
  tree.leaf('Question Group', inputs);
  payload = tree.payload();
  tree.conditional('condition', condCond);
  tree.conditional('reference', refCond);

  return tree;
}

function modifyBtnPressed(elem) {
  const node = DecisionInputTree.getNode(elem);
  const inputArray = node.payload().inputArray;
  const inputElem = du.find.closest('input,select,textarea', elem);
  const input = Input.getFromElem(inputElem);
  const treeHtml = conditionalInputTree().payload().html();
  const inputTreeCnt = du.find.closest('.condition-input-tree', elem);
  inputTreeCnt.innerHTML = '<br>' + treeHtml;
  elem.hidden = true;
}

du.on.match('keyup', `.${ROOT_CLASS}`, DecisionInputTree.update(true));
du.on.match('change', `.${ROOT_CLASS}`, DecisionInputTree.update());
du.on.match('click', `.${DecisionInputTree.buttonClass}`, DecisionInputTree.submit);
du.on.match('keyup', '.decision-input-cnt.mod input', updateModBtn);
du.on.match('keyup', '.decision-input-cnt.mod select', updateModBtn);
du.on.match('keyup', '.decision-input-cnt.mod textarea', updateModBtn);
du.on.match('click', '.conditional-button', modifyBtnPressed);

DecisionInputTree.DO_NOT_CLONE = true;

DecisionInputTree.getTree = (elem) => {
  const rootElem = du.find.up("[tree-id]", elem);
  const rootId = rootElem.getAttribute('tree-id');
  const tree = DecisionInputTree.get(rootId);
  return tree;
}
DecisionInputTree.getCondition = DecisionTree.Condition.getter((node) => node.values());

function childrenFromJson(parent, json) {
  const children = Object.values(json.children);
  for (let index = 0; index < children.length; index++) {
    const child = children[index];
    const node = parent.then(child.name, Object.fromJson(child.payload));
    childrenFromJson(node, child);
  }
  json.conditions.forEach(c => parent.conditions.add(Object.fromJson(c)));
  json.childConditions.forEach(c => parent.childConditions.add(Object.fromJson(c)));
}

DecisionInputTree.fromJson = (json) => {
  const rootConfig = json.stateConfigs[json.root.name];
  const rootPayload = Object.fromJson(rootConfig.payload);
  const tree = new DecisionInputTree(rootConfig.name, rootPayload);
  const root = tree.root();
  tree.addStates(Object.fromJson(json.stateConfigs));
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

function addInput(details, elem)  {
  const modCnt = du.find.up('.modification-add-input', elem);
  const nodeCnt = du.find.up('[node-id]', modCnt);
  const node = Lookup.get(nodeCnt.getAttribute('node-id'));
  const inline = true;
  const name = details.name.toCamel();
  const label = details.name;
  switch (details.format) {
    case 'Text':
      if (details.text.size === 'Large')
        node.addInput(new Textarea({name, label}))
      else
        node.addInput(new Input({type: 'text', name, label, inline}))
      break;
    case 'Date':
      node.addInput(new Input({type: 'date', name, label, inline}))
      break;
    case 'Time':
      node.addInput(new Input({type: 'time', name, label, inline}))
      break;
    case 'Checkbox':
      node.addInput(new Input({type: 'checkbox', name, label, inline}))
      break;
    case 'Radio':
      const list = details.radio.labels.map(input => input.value());
      node.addInput(new Radio({name, label, list}));
      break;
    case 'Table':
      const rows = details.table.row.map(input => input.value());
      const columns = details.table.col.map(input => input.value());
      const type = details.table.type;
      node.addInput(new Table({name, label, rows, columns, type}));
      break;
    case 'Measurement':
      const units = details.measure.units;
      node.addInput(new MeasurementInput({name, label, units}));
      break;
    case 'Multiple Entries':
      // node.addInput(new MultipleEntries());
      break;
    default:
      throw new Error('In the future this will not be reachable');
  }
  console.log(elem);
  DecisionInputTree.rebuild(nodeCnt);
}

DecisionInputTree.inputTree = function () {
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
  const labels = new MultipleEntries(label, {name: 'labels'});
  const rowCols = [tableType, new MultipleEntries(col, {name: 'col', inline: true}),
                    new MultipleEntries(row, {name: 'row'})];


  // ['Text', 'Radio', 'Table', 'Multiple Entries', 'Measurement']
  const inputs = [name, format];

  const tree = new DecisionInputTree('InputTree', {inputArray: inputs});
  const root = tree.root();
  // root.then('InputTree');

  const dic = (value) => new DecisionInputCondition('format', value);
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

  tree.onSubmit(addInput);
  tree.clone = DecisionInputTree.inputTree;
  return tree;
}


module.exports = DecisionInputTree;
