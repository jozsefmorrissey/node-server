
class DecisionInput {
  constructor(name, inputArrayOinstance, decisionTreeId) {
    this.name = name;
    this.decisionTreeId = decisionTreeId;
    this.id = `decision-input-node-${randomString()}`;
    this.childCntId = `decision-child-ctn-${randomString()}`
    this.inputArray = DecisionInput.validateInput(inputArrayOinstance);

    this.html = () => DecisionInput.template.render(this);
  }
}

DecisionInput.class = 'decision-input'

class DecisionInputTree extends DecisionTree{
  constructor(targetId, name, inputArrayOinstance) {
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

    this.onChange = (target) => {
      const parentDecisionCnt = up('.decision-input', target);
      if (parentDecisionCnt) {
        const nodeId = parentDecisionCnt.getAttribute('node-id');
        const currentNode = this.getNode(nodeId);
        if (currentNode) {
          const nextState = currentNode.next(target.value);
          const childCnt = document.getElementById(currentNode.payload.childCntId);
          if (nextState) {
            const payload =
            childCnt.innerHTML = DecisionInput.template.render(nextState.payload);
          } else {
            childCnt.innerHTML = '';
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
    });
    return inputArrayOinstance;
  }
  if (!(inputArrayOinstance instanceof Input)) throw new Error('arg3 must be an array exclusivly of/or instance of Input');
  return [inputArrayOinstance];
}

DecisionInput.template = new $t('input/decision/decision');
DecisionInputTree.template = new $t('input/decision/decisionTree');

afterLoad.push(() =>{
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
    )]);
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
      name: 'var2',
      class: 'center',
      list: ['five', 'six', 'seven', 'nine'],
      validation: /^(five|six|seven)$/,
      errorMsg: 'lucky number...'
    }
  )});
  decisionInput.then('four').jump('var2').then('six').jump('var3');
  document.body.innerHTML = decisionInput.payload.html();

});
