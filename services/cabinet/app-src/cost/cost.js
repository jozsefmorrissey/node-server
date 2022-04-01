


const Company = require('../objects/company.js');
const Input = require('../../../../public/js/utils/input/input.js');
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const StringMathEvaluator = require('../../../../public/js/utils/string-math-evaluator.js');
const Assembly = require('../objects/assembly/assembly.js');


// constructors
// Cost({name, Method: Cost.methods.LINEAR_FEET, cost, length})
// Cost({name, Method: Cost.methods.SQUARE_FEET, cost, length, width})
// Cost({name, Method: Cost.methods.CUBIC_FEET, cost, length, width, depth})
// Cost({name, Method: Cost.methods.UNIT, cost})
// Cost((name, Cost, formula));
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

class Cost extends Lookup {
  //constructor(id, Cost, formula)
  constructor(props) {
    super(props.name);
    props = props || {};
    this.props = () => props;
    let deleted = false;
    const instance = this;
    const uniqueId = String.random();
    const lastUpdated = props.lastUpdated || new Date().getTime();
    props.requiredBranches = props.requiredBranches || [];
    this.lastUpdated = new Date(lastUpdated).toLocaleDateString();
    Object.getSet(this, props, 'group', 'objectId', 'id', 'parent');
    this.level = () => {
      let level = -1;
      let curr = this;
      while(curr instanceof Cost) {
        level++;
        curr = curr.parent();
      }
      return level;
    }
  }
}

Cost.types = {};

Cost.freeId = (group, id) => Object.values(Cost.group(group).defined).indexOf(id) === -1;
Cost.remove = (uniqueId) => Cost.get(uniqueId).remove();

Cost.constructorId = (name) => name.replace(/Cost$/, '');
Cost.register = (clazz) => {
  Cost.types[Cost.constructorId(clazz.prototype.constructor.name)] = clazz;
  Cost.typeList = Object.keys(Cost.types).sort();
}

Cost.evaluator = new StringMathEvaluator(null, (attr, assem) => Assembly.resolveAttr(assem, attr))

module.exports = Cost
