




const DecisionTree = require('../../decision-tree.js');
const LogicTree = require('../../logic-tree.js');
const LogicWrapper = LogicTree.LogicWrapper
const Input = require('../input.js');
const du = require('../../dom-utils');
const $t = require('../../$t');

const ROOT_CLASS = 'decision-input-tree';

class DecisionInput {
  constructor(name, inputArrayOinstance, tree) {
    Object.getSet(this, 'name', 'id', 'childCntId', 'inputArray', 'class');
    if (inputArrayOinstance !== undefined){
      this.name = name;
      this.id = `decision-input-node-${String.random()}`;
      this.childCntId = `decision-child-ctn-${String.random()}`
      this.values = () => tree.values();
      this.onComplete = tree.onComplete
      this.inputArray = DecisionInputTree.validateInput(inputArrayOinstance, this.values);
      this.class =  ROOT_CLASS;
      this.getValue = (index) => this.inputArray[index].value();
      this.validate = () => DecisionInputTree.validateInput(inputArrayOinstance, this.values);
    }

    this.addValues = (values) => {
      this.inputArray.forEach((input) => values[input.name()] = input.value())
    }

    this.isValid = () => {
      let valid = true;
      this.inputArray.forEach((input) =>
            valid = valid && input.valid());
      return valid;
    }

    this.html = () => {
      return DecisionInput.template.render(this);
    }
    this.treeHtml = (wrapper) => tree.html(wrapper);
  }
}

function superArgument(onComplete) {
  const formatPayload = (name, payload, treeId) => new DecisionInput(name, payload, treeId);
  if (onComplete && onComplete._TYPE === 'DecisionInputTree') {
    onComplete.formatPayload = formatPayload;
    return onComplete;
  }
  return formatPayload;
}

class DecisionInputTree extends LogicTree {
  constructor(onComplete) {
    super(superArgument(onComplete));
    const onCompletion = [];
    this.html = (wrapper) => {
      wrapper = wrapper || this.root();
      let inputHtml = '';
      wrapper.forEach((wrapper) => {
        inputHtml += wrapper.payload().html();
      });
      const scope = {wrapper, inputHtml, DecisionInputTree};
      if (wrapper === this.root()) {
        return DecisionInputTree.template.render(scope);
      }
      return inputHtml;
    };

    this.values = () => {
      return this.structure();
    }

    this.onComplete = (func) => {
      if (typeof func !== 'function') throw new Error('Argument must be a function');
      onCompletion.push(func);
    }

    this.values = () => {
      const values = {};
      this.root().forEach((wrapper) => {
        wrapper.payload().addValues(values);
      });
      return values;
    }

    this.completed = () => {
      const values = this.values();
      onCompletion.forEach((func) => func(values))
    }

    return this;
  }
}

DecisionInputTree.class = 'decision-input-tree';
DecisionInputTree.buttonClass = 'decision-input-tree-submit';

DecisionInputTree.validate = (wrapper) => {
  let valid = true;
  wrapper.forEach((wrapper) => {
    valid = valid && wrapper.payload().isValid();
  });
  return valid;
}

function isComplete(wrapper) {
  return wrapper.isComplete() && DecisionInputTree.validate(wrapper)
}

DecisionInputTree.update = (soft) =>
  (elem) => {
    const wrapper = LogicWrapper.get(elem.getAttribute('node-id'));
    console.log(isComplete(wrapper));
    if(!soft) {
      wrapper.payload().html();
    } else {
      const button = du.find.closest('button', elem);
      button.disabled = !isComplete(wrapper);
    }
  };

DecisionInputTree.submit = (elem) => {
  const wrapper = LogicWrapper.get(elem.getAttribute('root-id'));
  wrapper.completed();
}

du.on.match('keyup', `.${ROOT_CLASS}`, DecisionInputTree.update(true));
du.on.match('change', `.${ROOT_CLASS}`, DecisionInputTree.update());
du.on.match('click', `.${DecisionInputTree.buttonClass}`, DecisionInputTree.submit);


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

DecisionInputTree.template = new $t('input/decision/decisionTree');
DecisionInput.template = new $t('input/decision/decision');

module.exports = DecisionInputTree;
