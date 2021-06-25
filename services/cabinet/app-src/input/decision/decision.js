
class DecisionInputTree extends DecisionTree{
  constructor(name, inputArrayOinstance, onComplete) {
    const rootClass = `decision-input-${randomString()}`;
    class DecisionInput {
      constructor(name, inputArrayOinstance, decisionTreeId) {
        this.name = name;
        this.decisionTreeId = decisionTreeId;
        this.id = `decision-input-node-${randomString()}`;
        this.childCntId = `decision-child-ctn-${randomString()}`
        this.inputArray = DecisionInputTree.validateInput(inputArrayOinstance);
        this.class = rootClass;
        this.getValue = (index) => this.inputArray[index].value();

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

    super(name, new DecisionInput(name, inputArrayOinstance, `decision-tree-${randomString()}`));
    if ((typeof name) !== 'string') throw Error('name(arg2) must be defined as a string');


    const root = this;
    const onCompletion = [];
    const onChange = [];
    this.treeId = randomString();
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

    const next = (node, index) => {
      const inputArray = node.payload.inputArray;
      const input = inputArray[index];
      const name = input.name;
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
      forEachInput((input) => filled = filled && input.valid());
      return filled;
    }

    function values() {
      const values = {};
      forEachInput((input) => values[input.name] = input.value());
      return values;
    }
    this.values = values;

    this.update = (target) => {
      const parentDecisionCnt = up(`.${rootClass}`, target);
      if (parentDecisionCnt) {
        const nodeId = parentDecisionCnt.getAttribute('node-id');
        const index = parentDecisionCnt.getAttribute('index');
        const currentNode = this.getNode(nodeId);
        if (currentNode) {
          const currentInput = currentNode.payload.inputArray[index];
          currentInput.setValue();
          runFunctions(onChange, currentInput.name, currentInput.value(), target);
          const stepLen = Object.keys(currentNode.states).length;
          if (stepLen) {
            const inputCount = currentNode.payload.inputArray.length;
            const nextState = next(currentNode, index);
            const childCntId = currentNode.payload.inputArray[index].childCntId;
            const childCnt = document.getElementById(childCntId);
            if (nextState) {
              childCnt.innerHTML = DecisionInput.template.render(nextState.payload);
            } else {
              childCnt.innerHTML = '';
            }
          }
        }
      }

      document.querySelector(buttonSelector).disabled = !formFilled();
    }

    this.html = () => DecisionInputTree.template.render(this);
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
    matchRun('change', inputSelector, this.update);
    matchRun('keyup', inputSelector, this.update);
    matchRun('click', buttonSelector, () => {
      const vals = values();
      runFunctions(onCompletion, values);
    });
  }
}

DecisionInputTree.validateInput = (inputArrayOinstance) => {
  if (Array.isArray(inputArrayOinstance)) {
    inputArrayOinstance.forEach((instance) => {
      if (!(instance instanceof Input)) throw new Error('arg3 must be an array exclusivly of/or instance of Input');
      instance.childCntId = `decision-child-ctn-${randomString()}`
    });
    return inputArrayOinstance;
  }
  if (!(inputArrayOinstance instanceof Input)) throw new Error('arg3 must be an array exclusivly of/or instance of Input');
  inputArrayOinstance.childCntId = `decision-child-ctn-${randomString()}`
  return [inputArrayOinstance];
}

DecisionInputTree.template = new $t('input/decision/decisionTree');
