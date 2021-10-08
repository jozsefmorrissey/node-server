


const Company = require('../objects/company.js');
const Input = require('../../../../public/js/utils/input/input.js');
const StringMathEvaluator = require('../../../../public/js/utils/string-math-evaluator.js');
const Assembly = require('../objects/assembly/assembly.js');


// constructors
// Cost({id, Method: Cost.methods.LINEAR_FEET, cost, length})
// Cost({id, Method: Cost.methods.SQUARE_FEET, cost, length, width})
// Cost({id, Method: Cost.methods.CUBIC_FEET, cost, length, width, depth})
// Cost({id, Method: Cost.methods.UNIT, cost})
// Cost((id, Cost, formula));
// props. - (optional*)
// id - Cost identifier
// method - Method for calculating cost
// length - length of piece used to calculate unit cost
// width - width of piece used to calculate unit cost
// depth - depth of piece used to calculate unit cost
// cost - cost of piece used to calculate unit cost
// formula* - formula used to apply cost to part
// company* - Company to order from.
// partNumber* - Part number to order part from company
// Cost* - Reference Cost.

class Cost {
  //constructor(id, Cost, formula)
  constructor(props) {
    let deleted = false;
    const instance = this;
    const uniqueId = String.random();
    const lastUpdated = props.lastUpdated || new Date().getTime();
    this.lastUpdated = new Date(lastUpdated).toLocaleDateString();
    this.delete = () => deleted = true;
    this.deleted = () => deleted;
    Object.getSet(this, props, 'group', 'objectId', 'id', 'children')
    this.uniqueId = () => uniqueId;
    // TODO: None does not make sence here.
    this.childIds = () =>
        ['None'].concat(cost.children.map((obj) => obj.id()));

    Cost.group(this, this);

    this.addChild = (cost) => {
      if (cost instanceof Cost) {
        this.children.push(cost);
      }
    }
  }
}


Cost.getterSetter = (obj, attr, validation) => (val) => {
  if (val && validation && validation(val)) obj[attr] = val;
  if (validation && !validation(obj[attr])) throw new Error(`Invalid Cost Value ${obj[attr]}`);
  return obj[attr];
}


Cost.group = (() => {
  const groups = {};
  const defaultCostObj = () => ({unique: {}, objectMap: {}, defined: {'/dev/nul': 'Custom'}});
  return (props, cost) => {
    const isSetter = cost instanceof Cost;
    const name = isSetter ? props.group : props;
    if (isSetter) {
      if (groups[name] === undefined)
      groups[name] = defaultCostObj();
      const group = groups[name];

      const unique = group.unique;
      const defined = group.defined;
      const objectMap = group.objectMap;
      if (unique[cost.uniqueId()] !== undefined)
      throw new Error('Invalid Unique Id');

      unique[cost.uniqueId()] = cost;

      if (props.objectId !== undefined) {
        if (objectMap[props.objectId] === undefined)
          objectMap[props.objectId] = [];
        objectMap[props.objectId].push(cost.uniqueId());
      }

      // TODO move to referenceCost constructor
      if (cost.constructor.name === 'ReferenceCost') {
        if (props.referenceable) {
          if (Object.values(defined).indexOf(cost.id()) !== -1)
          throw new Error(`referenceable cost must have a unique Id: '${cost.id()}'`);
          defined[cost.uniqueId()] = cost.id();
        }
      }
    }

    return groups[name] || defaultCostObj();
  }
})();

Cost.types = [];
Cost.get = (id) => {
  return Cost.uniqueId(uniqueId);
};

Cost.freeId = (group, id) => Object.values(Cost.group(group).defined).indexOf(id) === -1;
Cost.remove = (uniqueId) => Cost.get(uniqueId).remove();

Cost.constructorId = (name) => name.replace(/Cost$/, '');
Cost.register = (clazz) => {
  Cost.types[Cost.constructorId(clazz.prototype.constructor.name)] = clazz;
  Cost.typeList = Object.keys(Cost.types).sort();
}

Cost.evaluator = new StringMathEvaluator(null, (attr, assem) => Assembly.resolveAttr(assem, attr))

module.exports = Cost
