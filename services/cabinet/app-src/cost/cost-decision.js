
const Properties = require('../config/properties.js');
const DecisionTree = require('../../../../public/js/utils/decision-tree.js');

class CostDecision {
  constructor(id, saved) {
    function getPayload(type) {
      const payload = {_TYPE: type};
      if (tree === undefined)
        payload._REQUIRED_NODES = Properties.noValue(id).map((prop) => prop.name());
      return payload
    }

    function getParentNode(name, parentNodeId, type, payload) {
      if (parentNodeId === undefined) {
        if (tree === undefined) {
          tree = new DecisionTree(name || 'root', payload);
        } else {
          throw new Error('Tree already initialized. should not call this function without a parentNodeId after initialization');
        }
      } else {
        return tree.getNode(parentNodeId);
      }
    }

    this.tree = () => tree;

    let tree;
    if (saved) {
      tree = CostDecision.fromJson(saved);
    } else {
      if (Properties.hasValue(id)) {
        console.log('todo')// this.addSelect();
      }
    }
  }
}

CostDecision.types = {
  SELECT: 'Select',
  GROUP: 'Group',
  CONDITIONAL: 'Conditional',
  REFERENCE: 'Reference',
  LABOR: 'Labor',
  MATERIAL: 'Material'
}

module.exports = CostDecision
