


const Category = require('../category.js');
const Cost = require('../../cost.js');

class ConditionalCost extends Category {
  constructor (props) {
    super(props);
    Object.getSet(this, props, 'propertyId', 'propertyValue', 'propertyCondition');
    this.categoryCalc = this.calc;
    this.calc = (assembly) => ConditionalCost.calc(this, assembly);
  }
}

ConditionalCost.toKey = (value) => new String(value).replace(/ /g, '_').toUpperCase();

ConditionalCost.conditions = {};
ConditionalCost.conditions.EQUAL = 'Equals';
ConditionalCost.conditions.NOT_EQUAL = 'Not Equal';
ConditionalCost.conditions.LESS_THAN = 'Less Than';
ConditionalCost.conditions.GREATER_THAN = 'Greater Than';
ConditionalCost.conditions.LESS_THAN_OR_EQUAL = 'Less Than Or Equal';
ConditionalCost.conditions.GREATER_THAN_OR_EQUAL = 'Greater Than Or Equal';

ConditionalCost.isCondition = (value) => ConditionalCost
                      .conditions(ConditionalCost.toKey(value)) !== undefined;

ConditionalCost.calc = (cost, assembly) => {
  let validationFunc;
  switch (cost.propertyCondition()) {
    case ConditionalCost.conditions.EQUAL:
      validationFunc = (value) => cost.propertyValue() === value;
      break;
    case ConditionalCost.conditions.NOT_EQUAL:
      validationFunc = (value) => cost.propertyValue() !== value;
      break;
    case ConditionalCost.conditions.LESS_THAN:
      validationFunc = (value) => cost.propertyValue() > value;
      break;
    case ConditionalCost.conditions.GREATER_THAN:
      validationFunc = (value) => cost.propertyValue() < value;
      break;
    case ConditionalCost.conditions.LESS_THAN_EQUAL:
      validationFunc = (value) => cost.propertyValue() >= value;
      break;
    case ConditionalCost.conditions.GREATER_THAN_EQUAL:
      validationFunc = (value) => cost.propertyValue() <= value;
      break;
    default:
      throw new Error('Some how you managed to have an invalid Condition');
  }

  const value = assembly.value(cost.propertyId);
  if (validationFunc(value)) {
    return cost.categoryCalc(assembly);
  }
  return 0;
}


ConditionalCost.explanation = `A cost that is applied if the a defined
                                condition is met`;

module.exports = ConditionalCost
