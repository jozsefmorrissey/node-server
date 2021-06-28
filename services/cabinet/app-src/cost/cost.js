
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
    const referenceCost = props.method instanceof Cost ? props.method : undefined;
    props.formula = referenceCost ? referenceCost.formula() : props.formula;
    this.children = [];
    const instance = this;
    this.formula = () => props.formula;
    this.id = () => props.id;
    this.company = () => props.company;
    this.partNumber = () =>props.partNumber;
    this.addChild = (cost) => this.children.push(cost);
    this.method = referenceCost ? referenceCost.method : () => props.method;
    this.length = referenceCost ? referenceCost.length : () => props.length;
    this.width = referenceCost ? referenceCost.width : () => props.width;
    this.depth = referenceCost ? referenceCost.depth : () => props.depth;
    this.cost = referenceCost ? referenceCost.cost : () => props.cost;
    this.childListHtml = () => 'Hello Children';
    // TODO: make unitcost reference parent;
    const unitCost = Cost.configure(instance.method(), instance.cost(),
      instance.length(), instance.width(), instance.depth());
    this.unitCost = referenceCost ? referenceCost.unitCost : (attr) => {
      const copy = JSON.parse(JSON.stringify(unitCost));
      if (attr) return copy[attr];
      return copy;
    }

    this.calc = (assemblyOrCount) => {
      if (assemblyOrCount instanceof Assembly)
        return Cost.evaluator.eval(`${this.unitCost}*${this.formula()}`, assembly);
      else return Cost.evaluator.eval(`${this.unitCost}*${assemblyOrCount}`);
    }

    const cName = this.constructor.name;
    if (Cost.lists[cName] === undefined) Cost.lists[cName] = {};
    Cost.lists[cName][props.id] = this;

    this.toJson = () => {
      const children = [];
      this.children.forEach((child) => children.push(child.toJson()));
      return {
        type: this.constructor.name,
        id: this.id(),
        company: this.company(),
        partNumber: this.partNumber(),
        method: this.method(),
        length: this.length(),
        width: this.width(),
        depth: this.depth(),
        cost: this.cost(),
        formula: this.formula(),
        children
      };
    }
  }
}
Cost.lists = {};
Cost.objMap = {};
Cost.types = [];
Cost.methods = {
  LINEAR_FEET: 'Linear Feet',
  SQUARE_FEET: 'Square Feet',
  CUBIC_FEET: 'Cubic Feet',
  UNIT: 'Unit'
},
Cost.get = (id) => {
  const listsKeys = Object.keys(Cost.lists);
  for (let index = 0; index < listsKeys.length; index += 1) {
    if (Cost.lists[listsKeys[index]][id]) return Cost.lists[listsKeys[index]][id];
  }
  return undefined;
};
Cost.freeId = (id) => Cost.get(id) === undefined;
Cost.methodList = Object.values(Cost.methods);
Cost.configure = (method, cost, length, width, depth) => {
  const retValue = {unitCost: {}};
  switch (method) {
    case Cost.methods.LINEAR_FEET:
      const perLinearInch = Cost.evaluator.eval(`${cost}/(${length} * 12)`);
      retValue.unitCost.name = 'Linear Inch';
      retValue.unitCost.value = perLinearInch;
      return retValue;
    case Cost.methods.SQUARE_FEET:
      const perSquareInch = Cost.evaluator.eval(`${cost}/(${length}*${width}*144)`);
      retValue.unitCost.name = 'Square Inch';
      retValue.unitCost.value = perSquareInch;
      return retValue;
    case Cost.methods.CUBIC_FEET:
      const perCubicInch = Cost.evaluator.eval(`${cost}/(${length}*${width}*${depth}*1728)`);
      retValue.unitCost.name = 'Cubic Inch';
      retValue.unitCost.value = perCubicInch;
      return retValue;
    case Cost.methods.UNIT:
      retValue.unitCost.name = 'Unit';
      retValue.unitCost.value = cost;
      return retValue;
    default:
      throw new Error('wtf');
      retValue.unitCost.name = 'Unknown';
      retValue.unitCost = -0.01;
      retValue.formula = -0.01;
      return retValue;
  }
};

Cost.register = (clazz) => {
  Cost.types[clazz.prototype.constructor.name] = clazz;
  Cost.typeList = Object.keys(Cost.types);
}

Cost.new = function(props) {
  return new Cost.types[props.type](props)
}

Cost.fromJson = (objOrArray) => {
  function instanceFromJson(obj) {
    const cost = Cost.new(obj);
    obj.children.forEach((childJson) => cost.addChild(Cost.fromJson(childJson)));
    return cost;
  }
  if (!Array.isArray(objOrArray)) return instanceFromJson(objOrArray);

  const list = [];
  objOrArray.forEach((obj) => list.push(instanceFromJson(obj)));
  return list;
}

Cost.toJson = (array) => {
  if (!Array.isArray(array)) throw new Error('Input argument must be of type Array');
  const list = [];
  array.forEach((cost) => {
    if (!(cost instanceof Cost)) throw new Error('All array object must be of type Cost');
    list.push(cost.toJson())
  });
  return list;
}

afterLoad.push(() =>
  Cost.evaluator = new StringMathEvaluator(null, (attr, assem) => Assembly.resolveAttr(assem, attr))
);
