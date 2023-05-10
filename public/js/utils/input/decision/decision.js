
// TODO IMPORTANT: refactor this garbage!!!!!!
// ... its extreamly unIntuitive.



const DecisionTree = require('../../decision-tree.js');
const LogicMap = require('../../logic-tree.js');
const LogicWrapper = LogicMap.LogicWrapper
const Input = require('../input.js');
const Select = require('../styles/select.js');
const MultipleEntries = require('../styles/multiple-entries.js');
const du = require('../../dom-utils');
const $t = require('../../$t');
const Measurement = require('../../measurement');

const ROOT_CLASS = 'decision-input-tree';

function isComplete(wrapper) {
  return wrapper.isComplete() && DecisionInputTree.validate(wrapper)
}

class ValueCondition {
  constructor(name, accepted, payload) {
    Object.getSet(this, {name, accepted}, 'type');
    this.payload = payload;
    this.type = () => {
      if (Array.isArray(accepted)) return 'Array';
      if (accepted instanceof RegExp) return 'RegExp';
      return 'Exact';
    }
    this.targetInput = (wrapper) => {
      wrapper.root().node.forEach((node) => {
        node.payload().inputArray.forEach((input) => {
          if (input.name() === name) return input;
        });
      });
    }
    this.condition = (wrapper) => {
      console.log(this.condition.json);
        let input = this.targetInput(wrapper);
        if (input === undefined) return;
        switch (this.type()) {
          case 'Array':
            for (let index = 0; index < accepted.length; index +=1) {
              if (input.value === accepted[index]) return true;
            }
            return false;
          case 'RegExp':
            return input.value.match(accepted);
            break;
          default:
            return input.value === accepted;
        }
    }
    this.condition.target = name;
    this.condition.json = this.toJson();
  }
}

class DecisionInput {
  constructor(name, inputArrayOinstance, tree, isRoot) {
    Object.getSet(this, 'name', 'id', 'inputArray', 'class');
    this.clone = () => this;
    const instance = this;

    const toJson = this.toJson;
    this.toJson = () => {
      const json = toJson();
      if (this.condition) {
        json.condition = this.condition.json ? this.condition.json : this.condition;
      }
      return json;
    }
    this.tree = () => tree;
    if (inputArrayOinstance instanceof ValueCondition) {
      this.condition = inputArrayOinstance.condition;
      this.isConditional = true;
      inputArrayOinstance = inputArrayOinstance.payload;
    }
    if (inputArrayOinstance !== undefined){
      this.name(name);
      this.id = `decision-input-node-${String.random()}`;
      this.childCntId = `decision-child-ctn-${String.random()}`
      this.values = tree.values;
      this.value = this.values
      this.onComplete = tree.onComplete;
      this.onChange = tree.onChange;
      this.inputTree = inputInputTree;
      this.inputArray = DecisionInputTree.validateInput(inputArrayOinstance, this.values);
      this.class =  ROOT_CLASS;
      this.getValue = (index) => this.inputArray[index].value();
      this.validate = () => DecisionInputTree.validateInput(inputArrayOinstance, this.values);
    }

    const getWrapper = (wrapperOid) => wrapperOid instanceof LogicWrapper ?
        wrapperOid : (LogicWrapper.get(wrapperOid));

    this.branch = (wrapperId, inputs) =>
            getWrapper(wrapperId).branch(String.random(), new DecisionInput(name));
    this.conditional = (wrapperId, inputs, name, selector) =>
            getWrapper(wrapperId).conditional(String.random(), new DecisionInput(name, relation, formula));

    // this.update = tree.update;
    this.addValues = (values) => {
      this.inputArray.forEach((input) => values[input.name()] = input.value())
    }

    this.node = () =>
      LogicWrapper.get(this._nodeId);
    this.children = () => this.node().children().map((n) => n.payload());
    this.reachable = () => this.node().reachable();
    this.childrenHtml = (inputName, editDisplay) => {
      const children = this.children();
      let html = '';
      for (let index = 0; index < children.length; index++) {
        const child = children[index];
        if (child.reachable()) {
          if (!child.inputArray.initialized) {
            child.inputArray.forEach(i => i.initialize && i.initialize());
            child.inputArray.initialized = true;
          }
          if (child.condition.target === inputName) html += child.html()
        }
      }
      return html;
    }

    this.isValid = () => {
      let valid = true;
      this.inputArray.forEach((input) =>
            valid = valid && input.valid());
      return valid;
    }
    this.isRoot = () => isRoot;
    this.tag = () =>
      tree.block() ? 'div' : 'span';

    this.html = (parentCalling, editDisplay) => {
      if (this.isRoot() && parentCalling !== true) return tree.html(null, editDisplay);
      if (editDisplay) {
        return DecisionInput.modTemplate.render(this);
      }
      return DecisionInput.template.render(this);
    }
    this.treeHtml = (wrapper) => tree.html(wrapper);
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

class DecisionInputTree extends LogicMap {
  constructor(rootName, payload, onComplete, props) {
    const decisionInputs = [];
    props = props || {};
    const tree = {};

    tree.buttonText = () => {
      return props.buttonText || `Create ${root.node.name}`;
    }

    let disabled;
    tree.disableButton = (d, elem) => {
      disabled = d === null || d === true || d === false ? d : disabled;
      if (elem) {
        const button = du.find.closest(`button`, elem);
        if (button) {
          button.disabled = disabled === null ? !isComplete(root) : disabled;
        }
      }
    }

    function superArgument(onComplete) {
      const formatPayload = (name, payload) => {
        decisionInputs.push(new DecisionInput(name, payload, tree, decisionInputs.length === 0));
        return decisionInputs[decisionInputs.length - 1];
      }
      if (onComplete && onComplete._TYPE === 'DecisionInputTree') {
        onComplete.formatPayload = formatPayload;
        return onComplete;
      }
      return formatPayload;
    }

    super(superArgument(onComplete));
    const root = this;

    const onCompletion = [];
    const onChange = [];
    const onSubmit = [];
    tree.id = this.id;
    tree.html = (wrapper, editDisplay) => {
      wrapper = wrapper || root;
      let inputHtml = wrapper.payload().html(true, editDisplay);
      const scope = {wrapper, inputHtml, DecisionInputTree, inputTree: this, tree};
      if (wrapper === root) {
        return DecisionInputTree.template.render(scope);
      }
      return inputHtml;
    };


    this.onComplete = (func) => {
      if ((typeof func) === 'function') onCompletion.push(func);
    }
    this.onChange = (func) => {
      if ((typeof func) === 'function') onChange.push(func);
    }
    this.onSubmit = (func) => {
      if ((typeof func) === 'function') onSubmit.push(func);
    }

    this.values = () => {
      const values = {};
      root.forEach((wrapper) => {
        wrapper.payload().addValues(values);
      });
      return values;
    }
    tree.values = root.values;
    tree.hideButton = props.noSubmission;

    let completionPending = false;
    this.completed = () => {
      if (!root.isComplete()) return false;
      const delay = props.noSubmission || 0;
      if (!completionPending) {
        completionPending = true;
        setTimeout(() => {
          const values = tree.values();
          onCompletion.forEach((func) => func(values, this))
          completionPending = false;
        }, delay);
      }
      return true;
    }

    let submissionPending = false;
    this.submit = () => {
      const delay = props.noSubmission || 0;
      if (!submissionPending) {
        submissionPending = true;
        setTimeout(() => {
          const values = tree.values();
          if (!root.isComplete()) return false;
          onSubmit.forEach((func) => func(values, this))
          submissionPending = false;
        }, delay);
      }
      return true;
    }

    let changePending = false;
    this.changed = (elem) => {
      const delay = props.noSubmission || 0;
      if (!changePending) {
        changePending = true;
        setTimeout(() => {
          const values = tree.values();
          onChange.forEach((func) => func(values, this, elem))
          changePending = false;
        }, delay);
      }
      return true;
    }

    let block = false;
    tree.block = (is) => {
      if (is === true || is === false) {
        block = is;
      }
      return block;
    }
    this.block = tree.block;

    this.onComplete(onComplete);

    return this;
  }
}

DecisionInputTree.ValueCondition = ValueCondition;

DecisionInputTree.class = 'decision-input-tree';
DecisionInputTree.buttonClass = 'decision-input-tree-submit';

DecisionInputTree.validate = (wrapper) => {
  let valid = true;
  wrapper.forEach((wrapper) => {
    valid = valid && wrapper.payload().isValid();
  });
  return valid;
}

DecisionInputTree.getNode = (elem) => {
  const cnt = du.find.closest('[node-id]', elem);
  const parent = cnt.parentElement;
  const nodeId = cnt.getAttribute('node-id');
  return LogicWrapper.get(nodeId);
}

DecisionInputTree.update = (soft) =>
(elem) => {
  // if (elem.matches('.modification-add-input *')) return;

  const treeCnt = du.find.up('[tree-id]', elem);
  const inputs = du.find.downAll('select,input,textarea', treeCnt);
  for (let index = 0; index < inputs.length; index++) {
    const input = inputs[index];

    const cnt = du.find.closest('[node-id]', input);
    const nodeId = cnt.getAttribute('node-id');
    const wrapper = LogicWrapper.get(nodeId);

    const inputCnt = du.find.up('.decision-input-array-cnt', input);
    const childrenHtmlCnt = du.find.down('.children-recurse-cnt', inputCnt);
    const value = childrenHtmlCnt.getAttribute('value');
    const parentValue =  wrapper.payload().values()[input.name];
    const parentName = input.name;
    const cs = wrapper.reachableChildren();
    if (!parentValue || value !== parentValue) {
      cs.forEach((child) => {
        const di = wrapper.payload();
        const inputArray = di.inputArray;
        if (!inputArray.initialized) {
          inputArray.forEach(input => input.isInitialized() || input.initialize());
          inputArray.initialized = true;
        }
      });
      childrenHtmlCnt.setAttribute('value', parentValue)
      const childHtml = wrapper.payload().childrenHtml(input.name)
      childrenHtmlCnt.innerHTML = childHtml;
    }

    if(!soft) {
      wrapper.root().changed();
      wrapper.root().completed()
    }
  }

    // const cnt = du.find.closest('[node-id]', elem);
    // const parent = cnt.parentElement;
    // const nodeId = cnt.getAttribute('node-id');
    // const wrapper = LogicWrapper.get(nodeId);
    // if (wrapper.children().length > 0) {
    //   const childHtmlCnt = du.find.closest('.children-recurse-cnt', elem);
    //   const childrenHtml = wrapper.payload().childrenHtml();
    //   childHtmlCnt.innerHTML = childrenHtml;
    // }
    // console.log(isComplete(wrapper));
    // if(!soft) {
    //   // du.find.downAll('.decision-input-cnt', parent).forEach((e) => e.hidden = true)
    //   // wrapper.forEach((n) => {
    //   //   let selector = `[node-id='${n.nodeId()}']`;
    //   //   elem = du.find.down(selector, parent);
    //   //   if (elem) elem.hidden = false;
    //   // });
    //   wrapper.root().changed();
    //   wrapper.root().completed()
    // }
    // wrapper.payload().tree().disableButton(undefined, elem);
  };

DecisionInputTree.submit = (elem) => {
  const wrapper = LogicWrapper.get(elem.getAttribute('root-id'));
  wrapper.submit();
}

function updateModBtn(elem) {
  const value = elem.value;
  const button = du.find.closest('.conditional-button', elem);
  if (button.getAttribute('target-id') === elem.id) {
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

function inputInputTree() {
  const name = new Input({
    name: 'name',
    inline: true,
    label: 'Name',
    class: 'center',
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
    class: 'center',
  });
  const row = new Input({
    name: 'row',
    inline: true,
    label: 'Row',
    class: 'center',
  });
  const col = new Input({
    name: 'col',
    inline: true,
    label: 'Column',
    class: 'center',
  });
  const labels = new MultipleEntries([label]);
  const rowCols = [new MultipleEntries([col], {inline: true}), new MultipleEntries([row])];
  const multiInputs = new MultipleEntries(() => [inputInputTree()], {name: 'multiInp'});


['Text', 'Radio', 'Table', 'Multiple Entries', 'Measurement']
  const inputs = [name, format];
  const textCond = new ValueCondition('format', 'Text', [textCntSize]);
  const radioCond = new ValueCondition('format', 'Radio', [labels]);
  const tableCond = new ValueCondition('format', 'Table', rowCols);
  const multiCond = new ValueCondition('format', 'Multiple Entries', [multiInputs]);
  const measureCond = new ValueCondition('format', 'Measurement', [units]);

  const tree = new DecisionInputTree();
  tree.leaf('InputTree', inputs);
  payload = tree.payload();
  tree.conditional('text', textCond);
  tree.conditional('radio', radioCond);
  tree.conditional('table', tableCond);
  tree.conditional('multi', multiCond);
  const measure = tree.conditional('measure', measureCond);

  // REMOVE
  const measureMulti = new ValueCondition('unit', 'Imperial (US)', [multiInputs]);
  const measureInput = new ValueCondition('unit', 'Metric', [labels]);
  measure.conditional('measureMulti', measureMulti);
  measure.conditional('measureInput', measureInput);

  const t = tree.node.tree();
  const tJson = t.toJson();
  console.log(DecisionInputTree.fromJson(tJson));

  return tree.payload();
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
DecisionInputTree.validateInput = (inputArrayOinstance, valuesFunc) => {
  if (Array.isArray(inputArrayOinstance)) {
    inputArrayOinstance.forEach((instance) => {
      instance.childCntId = `decision-child-ctn-${String.random()}`
    });
    return inputArrayOinstance;
  }
  inputArrayOinstance.childCntId = `decision-child-ctn-${String.random()}`
  return [inputArrayOinstance];
}

DecisionInputTree.getTree = (elem) => {
  const rootElem = du.find.up("[tree-id]", elem);
  const rootId = rootElem.getAttribute('tree-id');
  const tree = DecisionInputTree.get(rootId);
  return tree;
}

DecisionInputTree.fromJson = (json) => {
  let tree = new DecisionInputTree();

  const rootConfig = json.stateConfigs[json.nodeId];
  const rootPayload = Object.fromJson(rootConfig.payload);
  const root = tree.leaf(rootConfig.name, rootPayload);
  tree = root.tree();
  let nodeMap = {};
  nodeMap[json.nodeId] = root;
  const paths = [rootConfig.name];
  let currIndex = 0;
  while (currIndex < paths.length) {
    const pathArr = paths[currIndex].split('.');
    const parent = tree.getByIdPath.apply(tree, pathArr.slice(0, -1));
    const node = tree.getByIdPath.apply(tree, pathArr);
    if (node === undefined) {
      const nodeId = pathArr[pathArr.length - 1];
      console.log('createNew')
      const config = json.stateConfigs[nodeId];
      const subPaths = Object.keys(Object.pathValue(json.tree, path));
      subPaths.forEach((subPath) => paths.push(`${path}.${subPath}`));
    }
    console.log(path);
    currIndex++;
  }
}

DecisionInputTree.template = new $t('input/decision/decisionTree');

module.exports = DecisionInputTree;
