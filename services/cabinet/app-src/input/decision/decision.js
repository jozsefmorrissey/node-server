
class DecisionInput {
  constructor(name, inputArrayOinstance, decisionTreeId) {
    this.name = name;
    this.values = {};
    this.decisionTreeId = decisionTreeId;
    this.id = `decision-input-node-${randomString()}`;
    this.childCntId = `decision-child-ctn-${randomString()}`
    this.inputArray = DecisionInput.validateInput(inputArrayOinstance);
    this.class = DecisionInput.class;

    this.html = () => DecisionInput.template.render(this);
  }
}

DecisionInput.class = 'decision-input'

class DecisionInputTree extends DecisionTree{
  constructor(targetId, name, inputArrayOinstance, onComplete) {
    super(name, new DecisionInput(name, inputArrayOinstance, `decision-tree-${randomString()}`));
    if ((typeof name) !== 'string') throw Error('name(arg2) must be defined as a string');

    this.treeId = randomString();
    this.class = `decision-input-tree`;
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

    this.values = (node) => {
      const values = {};
      node.routePayloads().forEach((input) => values[input.name] = input.value);
      return values;
    };

    this.onChange = (target) => {
      const parentDecisionCnt = up(`.${DecisionInput.class}`, target);
      if (parentDecisionCnt) {
        const nodeId = parentDecisionCnt.getAttribute('node-id');
        const index = parentDecisionCnt.getAttribute('index');
        const currentNode = this.getNode(nodeId);
        if (currentNode) {
          currentNode.payload.value = target.value;
          const stepLen = Object.keys(currentNode.states).length;
          if (stepLen) {
            const stepId = stepLen === 1 ? target.value : `${target.name}:${target.value}`;
            const nextState = currentNode.next(stepId);
            const childCntId = currentNode.payload.inputArray[index].childCntId;
            const childCnt = document.getElementById(childCntId);
            if (nextState) {
              const payload =
              childCnt.innerHTML = DecisionInput.template.render(nextState.payload);
            } else {
              childCnt.innerHTML = '';
            }
          } else {
            onComplete(this.values(currentNode));
          }
        }
      }

      console.log(targetId);
    }

    this.html = () => this.payload.html();

    const inputIds = this.payload.inputArray.map((input) => input.id);
    matchRun('change', `input`, this.onChange);
    if (this.back() === null) {
      const targetElem = document.getElementById(targetId);
      targetElem.innerHTML = DecisionInputTree.template.render(this);
    }
  }
}

DecisionInput.validateInput = (inputArrayOinstance) => {
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

DecisionInput.template = new $t('input/decision/decision');
DecisionInputTree.template = new $t('input/decision/decisionTree');

afterLoad.push(() =>{
  const onComplete = (dt) => {
    console.log(dt);
  }

  const decisionInput = new DecisionInputTree('booty', 'count', [
    new Input({
        type: 'select',
        placeholder: 'count sucka',
        name: 'var',
        class: 'center',
        list: ['one', 'two', 'three', 'four'],
        validation: /^(one|two|four)$/,
        errorMsg: 'lucky number...'
      }
    ),new Input({
        type: 'select',
        placeholder: 'count twice sucka',
        name: 'second',
        class: 'center',
        list: ['one', 'two', 'three', 'four'],
        validation: /^(one|two|four)$/,
        errorMsg: 'lucky number...'
      }
    )], onComplete);
  decisionInput.addStates({
    var2: new Input({
      type: 'select',
      placeholder: 'count again sucka',
      name: 'var2',
      class: 'center',
      list: ['five', 'six', 'seven', 'eight'],
      validation: /^(five|six|seven)$/,
      errorMsg: 'lucky number...'
    }),
    var3: new Input({
      type: 'select',
      placeholder: 'count againnn sucka',
      name: 'var3',
      class: 'center',
      list: ['five', 'six', 'seven', 'nine'],
      validation: /^(five|six|seven)$/,
      errorMsg: 'lucky number...'
    }
  ),var4: new Input({
      type: 'select',
      placeholder: 'four',
      name: 'var4',
      class: 'center',
      list: ['five', 'six', 'seven', 'nine'],
      validation: /^(five|six|seven)$/,
      errorMsg: 'lucky number...'
    }
  ),
  var5: new Input({
    type: 'select',
    placeholder: 'five',
    name: 'var5',
    class: 'center',
    list: ['five', 'six', 'seven', 'nine'],
    validation: /^(five|six|seven)$/,
    errorMsg: 'lucky number...'
  }
  )});
  decisionInput.then('var:four').jump('var2').then('six').jump('var4');
  decisionInput.then('second:one').jump('var3').then('six').jump('var5');
});
