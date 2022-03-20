




const DecisionTree = require('../../decision-tree.js');
const Input = require('../input.js');
const du = require('../../dom-utils');
const $t = require('../../$t');

class DecisionInputTree extends DecisionTree {
  constructor(name, inputArrayOinstance, onComplete) {
    const rootClass = `decision-input-${String.random()}`;
    class DecisionInput {
      constructor(name, inputArrayOinstance, decisionTreeId) {
        this.name = name;
        this.decisionTreeId = decisionTreeId;
        this.id = `decision-input-node-${String.random()}`;
        this.childCntId = `decision-child-ctn-${String.random()}`
        this.values = () => root.values()
        this.inputArray = DecisionInputTree.validateInput(inputArrayOinstance, this.values);
        this.class = rootClass;
        this.getValue = (index) => this.inputArray[index].value();
        this.validate = () => DecisionInputTree.validateInput(inputArrayOinstance, this.values);

        this.html = () => {
          return DecisionInput.template.render(this);
        }

        this.childHtml = (index) => {
          const node = getNode(this._nodeId);
          const nextNode = next(node, index);
          return nextNode !== undefined ? nextNode.payload.html() : '';
        }
      }
    }
    DecisionInput.template = new $t('input/decision/decision');

    super(name, new DecisionInput(name, inputArrayOinstance, `decision-tree-${String.random()}`));
    if ((typeof name) !== 'string') throw Error('name(arg2) must be defined as a string');


    const root = this;
    const onCompletion = [];
    const onChange = [];
    this.treeId = String.random();
    this.buttonClass = `tree-submit`;
    const buttonSelector = `.${this.buttonClass}[tree-id='${this.treeId}']`;
    this.class = `decision-input-tree`;
    const getNode = this.getNode;
    const parentAddState = this.addState;
    const parentAddStates = this.addStates;

    this.addState = (name, payload) => parentAddState(name, new DecisionInput(name, payload)) && this;
    this.addStates = (sts) => {
      const states = {};
      const keys = Object.keys(sts);
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        states[key] = new DecisionInput(key, sts[key]);
      }
      return parentAddStates(states)
    }

    function getInput(name) {
      let answer;
      forEachInput((input) => answer = input.name() === name ? input : answer);
      return answer;
    }

    this.set = (name, value) => {
      const input = getInput(name);
      input.setValue(value);
    }

    const next = (node, index) => {
      const inputArray = node.payload.inputArray;
      const input = inputArray[index];
      const name = input.name();
      const value = node.payload.getValue(index);
      return node.next(`${name}:${value}`) || node.next(name);
    }

    function forEachInput(func) {
      let nodes = [root];
      while (nodes.length !== 0) {
        const node = nodes[0];
        const inputs = node.payload.inputArray;
        for (let index = 0; index < inputs.length; index += 1) {
          const input = inputs[index];
          func(inputs[index]);
          const nextNode = next(node, index);
          if (nextNode) nodes.push(nextNode);
        }
        nodes.splice(0, 1);
      }
    }

    function formFilled() {
      let filled = true;
      forEachInput((input) => filled = filled && input.doubleCheck());
      const addBtn = document.querySelector(buttonSelector);
      if (addBtn) addBtn.disabled = !filled;
      return filled;
    }

    this.formFilled = formFilled;

    function values() {
      const values = {};
      forEachInput((input) => values[input.name()] = input.value());
      return values;
    }
    this.values = values;

    const contengencies = {};
    this.contengency = (subject, master) => {
      if (contengencies[master] === undefined) contengencies[master] = [];
      contengencies[master].push(subject);
    }

    this.update = (target) => {
      const parentDecisionCnt = du.find.up(`.${rootClass}`, target);
      if (parentDecisionCnt) {
        const nodeId = parentDecisionCnt.getAttribute('node-id');
        const index = parentDecisionCnt.getAttribute('index');
        const currentNode = this.getNode(nodeId);
        if (currentNode) {
          const currentInput = currentNode.payload.inputArray[index];
          currentInput.setValue();
          (contengencies[currentInput.name()] || []).forEach((inputName) => {
            const contengentInput = getInput(inputName);
            if (contengentInput)
              contengentInput.doubleCheck();
          });
          runFunctions(onChange, currentInput.name(), currentInput.value(), target);
          const stepLen = Object.keys(currentNode.states).length;
          if (stepLen) {
            const inputCount = currentNode.payload.inputArray.length;
            const nextState = next(currentNode, index);
            const childCntId = currentNode.payload.inputArray[index].childCntId;
            const childCnt = du.id(childCntId);
            if (nextState) {
              childCnt.innerHTML = DecisionInput.template.render(nextState.payload);
            } else {
              childCnt.innerHTML = '';
            }
          }
        }
      }

      formFilled();
    }

    this.html = () =>
      DecisionInputTree.template.render(this);
    function on(func, funcArray) {
      if ((typeof func) === 'function') funcArray.push(func);
    };
    this.onChange = (func) => on(func, onChange);
    this.onComplete = (func) => on(func, onCompletion);

    this.onComplete(onComplete);

    function runFunctions(funcArray, ...args) {
      for(let index = 0; index < funcArray.length; index += 1) {
        funcArray[index].apply(null, args);
      }
    }

    const inputSelector = `.${rootClass} > div > input,select`;
    du.on.match('change', inputSelector, this.update);
    du.on.match('keyup', inputSelector, this.update);
    du.on.match('click', buttonSelector, () => {
      const vals = values();
      runFunctions(onCompletion, values);
    });
  }
}

DecisionInputTree.DO_NOT_CLONE = true;
DecisionInputTree.validateInput = (inputArrayOinstance, valuesFunc) => {
  if (Array.isArray(inputArrayOinstance)) {
    inputArrayOinstance.forEach((instance) => {
      if (!(instance instanceof Input)) throw new Error('arg3 must be an array exclusivly of/or instance of Input');
      const parentValidate = instance.validation;
      instance.validation = (value) => parentValidate(value, valuesFunc());
      instance.childCntId = `decision-child-ctn-${String.random()}`
    });
    return inputArrayOinstance;
  }
  if (!(inputArrayOinstance instanceof Input)) throw new Error('arg3 must be an array exclusivly of/or instance of Input');
  inputArrayOinstance.childCntId = `decision-child-ctn-${String.random()}`
  return [inputArrayOinstance];
}

DecisionInputTree.template = new $t('input/decision/decisionTree');

module.exports = DecisionInputTree;
