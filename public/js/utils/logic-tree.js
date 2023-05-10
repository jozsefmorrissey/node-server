const DecisionTree = require('./decision-tree');
const DecisionNode = DecisionTree.Node;
const Lookup = require('./object/lookup');


class LogicNode extends DecisionNode {
  constructor (tree, name, instancePayload, parent) {
    super(tree, name, instancePayload, parent);
    const conditionMap = {};

    this.conditionsSatisfied = (name) => {
      if (!parent) return true;
      if (name === undefined) return parent.conditionsSatisfied(this.name());
      const conditions  = conditionMap[name];
      if (conditions === undefined) return true;
      const value = this.payload().values()[this.name()];
      const state = this.next(name);
      for (let index = 0; index < conditions.length; index++) {
        if (DecisionTree.conditionSatisfied(conditions[index], state, value)) return true;
      }
      return false;
    }

    const parentThen = this.then;
    this.then = (name, instancePayload, key, condition) => {
      const state = parentThen(name, instancePayload);
      if (key) {
        if(conditionMap[key] === undefined) conditionMap[key] = [];
        conditionMap[key].push(condition);
      }
      return state;
    }
  }
}

//
class LogicTree  extends DecisionTree {
  constructor(name, payload) {
    super(name, payload);

  }
}

LogicTree.Node = LogicNode;

module.exports = LogicTree;
