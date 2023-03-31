
// TODO IMPORTANT: refactor this garbage!!!!!!
// ... its extreamly unIntuitive.



const DecisionTree = require('../../decision-tree.js');
const LogicTree = require('../../logic-tree.js');
const LogicWrapper = LogicTree.LogicWrapper
const Input = require('../input.js');
const du = require('../../dom-utils');
const $t = require('../../$t');

const ROOT_CLASS = 'decision-input-tree';

function isComplete(wrapper) {
  return wrapper.isComplete() && DecisionInputTree.validate(wrapper)
}

class ValueCondition {
  constructor(name, accepted, payload) {
    Object.getSet(this, {name, accepted});
    this.payload = payload;
    this.condition = (wrapper) => {
        let value;
        wrapper.root().node.forEach((node) => {
          node.payload().inputArray.forEach((input) => {
            if (input.name() === name) value = input.value();
          });
        });
        if (Array.isArray(accepted)) {
          for (let index = 0; index < accepted.length; index +=1) {
            if (value === accepted[index]) return true;
          }
          return false;
        }
        return value === accepted;
    }
  }
}

class DecisionInput {
  constructor(name, inputArrayOinstance, tree, isRoot) {
    Object.getSet(this, 'name', 'id', 'childCntId', 'inputArray', 'class', 'condition');
    this.clone = () => this;
    const instance = this;

    this.tree = () => tree;
    if (inputArrayOinstance instanceof ValueCondition) {
      this.condition = inputArrayOinstance.condition;
      this.isConditional = true;
      inputArrayOinstance = inputArrayOinstance.payload;
    }
    if (inputArrayOinstance !== undefined){
      this.name = name;
      this.id = `decision-input-node-${String.random()}`;
      this.childCntId = `decision-child-ctn-${String.random()}`
      this.values = tree.values;
      this.onComplete = tree.onComplete;
      this.onChange = tree.onChange;
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

    this.update = tree.update;
    this.addValues = (values) => {
      this.inputArray.forEach((input) => values[input.name()] = input.value())
    }

    this.reachable = () => {
      const nodeId = this._nodeId;
      const wrapper = LogicWrapper.get(nodeId);
      return wrapper.reachable();
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


// properties
// optional :
// noSubmission: /[0-9]{1,}/ delay that determins how often a submission will be processed
// buttonText: determins the text displayed on submit button;

class DecisionInputTree extends LogicTree {
  constructor(onComplete, props) {
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
      let inputHtml = '';
      wrapper.forAll((wrapper) => {
        inputHtml += wrapper.payload().html(true, editDisplay);
      });
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
    const cnt = du.find.closest('[node-id]', elem);
    const parent = cnt.parentElement;
    const nodeId = cnt.getAttribute('node-id');
    const wrapper = LogicWrapper.get(nodeId);
    console.log(isComplete(wrapper));
    if(!soft) {
      du.find.downAll('.decision-input-cnt', parent).forEach((e) => e.hidden = true)
      wrapper.forEach((n) => {
        let selector = `[node-id='${n.nodeId()}']`;
        elem = du.find.down(selector, parent);
        if (elem) elem.hidden = false;
      });
      wrapper.root().changed();
      wrapper.root().completed()
    }
    wrapper.payload().tree().disableButton(undefined, elem);
  };

DecisionInputTree.submit = (elem) => {
  const wrapper = LogicWrapper.get(elem.getAttribute('root-id'));
  wrapper.submit();
}

function updateModBtn(elem) {
  const value = elem.value;
  const button = du.find.closest('.conditional-button', elem);
  button.innerText = `If ${elem.name} = ${value}`;
}

let count = 999;
const getInput = () => new Input({
  label: `Label${++count}`,
  name: `Name${count}`,
  inline: true,
  class: 'center',
});

function modifyBtnPressed(elem) {
  const node = DecisionInputTree.getNode(elem);
  const inputArray = node.payload().inputArray;
  const inputElem = du.find.closest('input,select,textarea', elem);
  const input = Input.getFromElem(inputElem);
  console.log('elm')
  const tree = DecisionInputTree.getTree(elem);

  const newInput = getInput();
  const branch = tree.getByPath(node.name);

  const newNodeName = String.random();
  const valueCond = new ValueCondition(input.name(), input.value(), [newInput]);
  nextBranch = node.root().conditional(newNodeName, valueCond);
  
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

DecisionInputTree.template = new $t('input/decision/decisionTree');

module.exports = DecisionInputTree;
