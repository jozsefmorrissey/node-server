
class DecisionInputTree extends DecisionTree{
  constructor(name, inputArrayOinstance, onComplete) {
    class DecisionInput {
      constructor(name, inputArrayOinstance, decisionTreeId) {
        this.name = name;
        this.decisionTreeId = decisionTreeId;
        this.id = `decision-input-node-${randomString()}`;
        this.childCntId = `decision-child-ctn-${randomString()}`
        this.inputArray = DecisionInputTree.validateInput(inputArrayOinstance);
        this.class = DecisionInput.class;
        this.getValue = (index) => this.inputArray[index].value();

        this.html = () => {
          return DecisionInput.template.render(this);
        }

        this.childHtml = (index) => {
          const node = getNode(this._nodeId);
          const nextNode = node.next(stepId(node, index));
          return nextNode !== undefined ? nextNode.payload.html() : '';
        }
      }
    }
    DecisionInput.template = new $t('input/decision/decision');
    DecisionInput.class = 'decision-input';

    super(name, new DecisionInput(name, inputArrayOinstance, `decision-tree-${randomString()}`));
    if ((typeof name) !== 'string') throw Error('name(arg2) must be defined as a string');


    const root = this;
    const onCompletion = [];
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

    const stepId = (node, index) => {
      const inputArray = node.payload.inputArray;
      const input = inputArray[index];
      const name = input.name;
      const value = node.payload.getValue(index);
      return inputArray.length === 1 ? value : `${name}:${value}`;
    }

    function forEachInput(func) {
      let nodes = [root];
      while (nodes.length !== 0) {
        const node = nodes[0];
        const inputs = node.payload.inputArray;
        for (let index = 0; index < inputs.length; index += 1) {
          const input = inputs[index];
          func(inputs[index]);
          const nextNode = node.next(stepId(node, index));
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

    this.onChange = (target) => {
      const parentDecisionCnt = up(`.${DecisionInput.class}`, target);
      if (parentDecisionCnt) {
        const nodeId = parentDecisionCnt.getAttribute('node-id');
        const index = parentDecisionCnt.getAttribute('index');
        const currentNode = this.getNode(nodeId);
        if (currentNode) {
          const currentInput = currentNode.payload.inputArray[index];
          currentInput.setValue(target.value);
          const stepLen = Object.keys(currentNode.states).length;
          if (stepLen) {
            const inputCount = currentNode.payload.inputArray.length;
            const nextState = currentNode.next(stepId(currentNode, index));
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
    this.onComplete = (func) => {
      if ((typeof func) === 'function') onCompletion.push(func);
    };
    this.onComplete(onComplete);

    const inputIds = this.payload.inputArray.map((input) => input.id);
    const inputSelector = `#${inputIds.join(',#')}`;
    matchRun('change', inputSelector, this.onChange);
    matchRun('keyup', inputSelector, this.onChange);
    matchRun('click', buttonSelector, () => {
      const vals = values();
      for(let index = 0; index < onCompletion.length; index += 1) {
        onCompletion[index](vals);
      }
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
