
const Properties = require('../config/properties.js');
const Assembly = require('../objects/assembly/assembly.js');
const LogicMap = require('../../../../public/js/utils/logic-tree.js');
const LogicWrapper = LogicMap.LogicWrapper;

class CostDecision {
  constructor(type, name, relation, formula) {
    Object.getSet(this, {type, name, costs: [], relation, isChoice: false});
    this.requiredProperties = Properties.noValue(name);
    if (this.relation) {
      if (formula) {
        function makeDecision(wrapper) {
          return true;
        }
        this.relation = RelationInput.relationsObjs[relation](makeDecision);
        this.condition = (wrapper) => this.relation.eval(wrapper.children(), wrapper.payload.value());
      } else {
        this.isChoice(true);
      }
    }
  }
}

class CostTree {
  constructor(logicTree) {
    const idMap = {};
    logicTree = CostTree.suplement(logicTree);
    this.tree = () => logicTree;
    this.root = () => logicTree.root();
    const getWrapper = (wrapperId) => (LogicWrapper.get(wrapperId) || this.root());

    this.branch = (wrapperId, name) =>
            get(wrapperId).branch(String.random(), new CostDecision('Branch', name));
    this.leaf = (wrapperId, name) =>
            get(wrapperId).leaf(String.random(), new CostDecision('Leaf', name));
    this.select = (wrapperId, name, relation, formula) =>
            get(wrapperId).select(String.random(), new CostDecision('Select', name, relation, formula));
    this.multiselect = (wrapperId, name, relation, formula) =>
            get(wrapperId).multiselect(String.random(), new CostDecision('Multiselect', name, relation, formula));
    this.conditional = (wrapperId, name, relation, formula) =>
            get(wrapperId).conditional(String.random(), new CostDecision('Conditional', name, relation, formula));

  }
}


CostTree.propertyList = Properties.all();
CostTree.types = ['branch', 'select', 'conditional', 'multiselect', 'leaf'];
CostTree.suplement = (logicTree) => {
  if (!(logicTree instanceof LogicWrapper)) {
    logicTree = new LogicMap();
    logicTree.branch('root');
  }
  const root = logicTree.root();
  const assemClassIds = Properties.list();
  assemClassIds.forEach((classId) => {
    if (root.node.getNodeByPath(classId) === undefined)
      root.branch(classId, new CostDecision('Branch', classId));
  });
  return logicTree;
}
CostTree.choices = [];


CostTree.CostDecision = CostDecision;
module.exports = CostTree;
