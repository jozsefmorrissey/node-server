
// TODO IMPORTANT: refactor this garbage!!!!!!
// ... its extreamly unIntuitive.



const DecisionTree = require('../../decision-tree.js');
const Conditions = require('../../conditions.js');
const Input = require('../input.js');
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
    payload ||= {};
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
      const currValue = this.payload().relatedTo;
      if (value === undefined) return currValue;
      if (this.isRoot()) {
        throw new Error('The root cannot be related to any other input');
      }

      const stateRelatedTo = this.stateConfig().payload().relatedTo;
      let setState = false;
      if (stateRelatedTo === undefined) {
        this.stateConfig().setValue('relatedTo', value);
        setState = true;
      } else {
        this.setValue('relatedTo', value)
      }

      value = this.payload().relatedTo;
      const validList = this.parent().inputArray().map(i => i.name());
      if (validList.indexOf(value) === -1) {
        if (setState) {
          this.stateConfig().setValue('relatedTo', currValue);
          this.deleteValue('relatedTo');
        } else {
          this.setValue('relatedTo', currValue);
        }
      }

      return value;
    }

    this.addInput = (input) => {
      if (!(input instanceof Input)) throw new Error('input(arg1) needs to be and instance of Input');
      const payload = this.stateConfig().payload();
      this.stateConfig().setValue('inputArray', payload.inputArray.concat(input))
      trigger();
    }
    this.values = (values, doNotRecurse) => {
      if (!this.reachable()) return {};
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
      this.forEachChild((child) => complete &= child.isComplete());
      return complete == 1;
    }
    this.onComplete = this.tree().onComplete;
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
          // clone.setValue('');
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

    const checkColectiveFilter = (nameOmap, childCond) => {
      let nameMap = {};
      nameOmap instanceof Object ? nameMap = nameOmap : (nameMap[nameOmap] = true);
      if (childCond.condition.conditions) {
        const conds = childCond.condition.conditions();
        for (let index = 0; index < conds.length; index++) {
          if (conds[index].attribute && nameMap[conds[index].attribute()]) return true;
        }
      }
      return false;
    }

    const nameFilter = (name) => (childCond) => {
      if (!childCond.condition instanceof Conditions.Condition) return false;
      if (childCond.condition.attribute) return childCond.condition.attribute().indexOf(name) === 0;

      return checkColectiveFilter(name, childCond);
    }
    const dneFilter = () => {
      const nameMap = {};
      this.inputArray().map(input => nameMap[input.name()] = true);
      return (childCond) =>
        !(childCond.condition instanceof Conditions.Condition) ||
        !((childCond.condition.attribute && nameMap[childCond.condition.prefix()]) ||
        checkColectiveFilter(nameMap, childCond));
    }
    const childMapFunc = (childCond) => childCond.child;
    this.childrenHtml = () => {
      if (!this.shouldRecurse()) return '';
      const children = this.reachableChildren().map(childMapFunc);
      let html = '';
      for (let index = 0; index < children.length; index++) {
        const child = children[index];
        html += child.html();
      }
      return html + (children.length > 0 ? '<br><br>' : '');
    }
    this.empty = () => this.inputArray().length === 0;
    this.tag = () => this.tree().block() ? 'div' : 'span';
    this.html = () => DecisionInput.template.render(this);

    this.removeInput = (inputName, localOnly) => {
      const ia = payload.inputArray;
      for (let index = 0; index < ia.length; index++) {
        if (ia[index].name() === inputName) {
          const stateName = this.stateConfig().name();
          ia.splice(index, 1);
          if (!localOnly) this.tree().removeInput(stateName, inputName);
          return true;
        }
      }
      return false;
    }

    this.payloadHtml = () => {
      const pld = this.payload();
      if ((typeof pld.html) === 'function') return pld.html();
      return this.tree().payloadHtml(pld);
    }
  }
}
DecisionInput.template = new $t('input/decision/decision');

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
    this.class = () => props.class;
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

    this.removeInput = (stateName, inputName) => {
      const configs = this.stateConfigs();
      const nodes = [];
      this.root().forall((n) => {
        const sc = n.stateConfig();
        if (sc.name() === stateName) {
          const scIArr = sc.payload().inputArray.filter(i => i.name() !== inputName);
          sc.setValue('inputArray', scIArr);
          n.removeInput(inputName, true);
        }
      });
      console.log('rmI');
    }

    this.clone = () => DecisionInputTree.fromJson(this.toJson());
    this.valid = this.completed;
    this.name = () => this.root().name();
    this.value = this.values;

    return this;
  }
}


DecisionInputTree.class = 'decision-input-tree';
DecisionInputTree.inputSelector = `.${DecisionInputTree.class} input,textarea,select`;
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
  cnt.innerHTML = tree.html();
}

function updateInput(target) {
  const cnt = du.find.closest('[node-id]', target);
  const nodeId = cnt.getAttribute('node-id');
  const node = Lookup.get(nodeId);

  const inputCnt = du.find.up('.decision-input-array-cnt', target);
  const inputIndex = Number.parseInt(inputCnt.getAttribute('index'));
  const parentCnt = du.find.up('.decision-input-cnt', inputCnt);
  updateOrphans(target);
}

function updateOrphans(elem) {
  const dicnt = du.find.up('.decision-input-cnt', elem);
  const orphanCnt = du.find.down('.orphan-cnt', dicnt);
  const node = DecisionInputTree.getNode(dicnt);
  orphanCnt.innerHTML = node.childrenHtml();
}

function updateAllChildren(dicnt) {
  updateOrphans(dicnt);
  du.move.inbounds(dicnt);
}

// TODO remove nested function, soft not used.... clean this please
DecisionInputTree.update = (soft) => (target, event) => setTimeout(() => updateInput(target));
DecisionInputTree.update.children = updateAllChildren;

DecisionInputTree.Node = DecisionInput;
DecisionInputTree.submit = (elem) => {
  const tree = Lookup.get(elem.getAttribute('tree-id'));
  tree.submit(elem);
}

let count = 999;
// const getInput = () => new Input({
//   label: `Label${++count}`,
//   name: `Name${count}`,
//   inline: true,
//   class: 'center',
// });

const nodeIds = {}
function enableRecursion(elem) {
  const node = DecisionInputTree.getNode(elem);
  if (node.reachable()) {
    node.children();
    node.forEachChild((child) => child.shouldRecurse(true));
    elem.removeAttribute('recursion');
    updateAllChildren(elem);
  }
}

const treeSelector = `.${DecisionInputTree.class}`;
du.on.match('keyup', DecisionInputTree.inputSelector, DecisionInputTree.update(true));
du.on.match('change', DecisionInputTree.inputSelector, DecisionInputTree.update());
du.on.match('click', `.${DecisionInputTree.buttonClass}`, DecisionInputTree.submit);
// Consider changing for self referencing trees.
du.on.match('mouseover', '.decision-input-cnt[recursion]', enableRecursion);

DecisionInputTree.DO_NOT_CLONE = true;

DecisionInputTree.getTree = (elem) => {
  const rootElem = du.find.up("[tree-id]", elem);
  const rootId = rootElem.getAttribute('tree-id');
  const tree = DecisionInputTree.get(rootId);
  return tree;
}

class NodeCondition {
  constructor(attribute, value, type) {
    this.toJson = () => ({_TYPE: 'NodeCondition'});
    this.resolveValue = (node, attribute) => {
      const values = node.values();
      if (attribute === undefined) return values;
      return Object.pathValue(values, attribute);
    }
    if (attribute._TYPE === 'NodeCondition') return this;

    return Conditions.get(attribute, value, type, this);
  }
}
Object.class.register(NodeCondition);

DecisionInputTree.getCondition = (...args) => new NodeCondition(...args);

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
}

DecisionInputTree.fromJson = (json) => {
  const stateConfigs = Object.fromJson(json.stateConfigs);
  const properties = {
    stateConfigs,
    nodeInheritance: json.nodeInheritance,
    referenceNodes: json.referenceNodes
  };
  const tree = new DecisionInputTree(json.root.name, null, properties);
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






module.exports = DecisionInputTree;
