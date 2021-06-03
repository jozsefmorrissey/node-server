class Cost {
  constructor(id, method, cost, length, width, depth) {
    const configuration = Cost.configure(method, cost, length, width, depth);
    const formula = configuration.formula;
    const unitCost = configuration.unitCost;
    let percentage = 100;
    this.id = () => id;
    this.method = () => method;
    this.length = () => length;
    this.width = () => width;
    this.depth = () => depth;
    this.cost = () => cost;
    this.unitCost = () => JSON.parse(JSON.stringify(unitCost));

    this.calc = (assembly) => Cost.evaluator.eval(formula, assembly);

    const cName = this.constructor.name;
    if (Cost.lists[cName] === undefined) Cost.lists[cName] = {};
    if (Cost.lists[cName][id] === undefined) Cost.lists[cName][id] = [];
    Cost.lists[cName][id].push(this);

    this.toJson = () => {
      return {
        type: this.constructor.name,
        id, method, length, width, depth, cost
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
Cost.methodList = Object.values(Cost.methods);
Cost.configure = (method, cost, length, width, depth) => {
  const retValue = {unitCost: {}};
  switch (method) {
    case Cost.methods.LINEAR_FEET:
      const perLinearInch = Cost.evaluator.eval(`${cost}/(${length} * 12)`);
      retValue.unitCost.name = 'Linear Inch';
      retValue.unitCost.value = perLinearInch;
      retValue.formula = `${perLinearInch}*l`;
      return retValue;
    case Cost.methods.SQUARE_FEET:
      const perSquareInch = Cost.evaluator.eval(`${cost}/(${length}*${width}*144)`);
      retValue.unitCost.name = 'Square Inch';
      retValue.unitCost.value = perSquareInch;
      retValue.formula = `${perSquareInch}*l*w`;
      return retValue;
    case Cost.methods.CUBIC_FEET:
      const perCubicInch = Cost.evaluator.eval(`${cost}/(${length}*${width}*${depth}*1728)`);
      retValue.unitCost.name = 'Cubic Inch';
      retValue.unitCost.value = perCubicInch;
      retValue.formula = `${perCubicInch}*l*w*d`;
      return retValue;
    case Cost.methods.UNIT:
      retValue.unitCost.name = 'Unit';
      retValue.unitCost.value = cost;
      retValue.formula = cost;
      return retValue;
    default:
      throw new Error('wtf');
      retValue.unitCost.name = 'Unknown';
      retValue.unitCost = -0.01;
      retValue.formula = -0.01;
      return retValue;
  }
};

Cost.get = (name) => {
  const obj = Cost.lists[id];
  if (obj === undefined) return null;
  return new obj.constructor();
}
Cost.addRelations = (type, id, name) => {
  names.forEach((name) => {
    if (objMap[id] === undefined) Cost.objMap[id] = {Labor: [], Material: []}
    if (type === Labor) Cost.objMap[id].Labor.push(Cost.get(name));
    if (type === Material) Cost.objMap[id].Material.push(Cost.get(name));
  });
}

Cost.register = (clazz) => {
  Cost.types[clazz.prototype.constructor.name] = clazz;
  Cost.typeList = Object.keys(Cost.types);
}

Cost.new = function(type) {
  return new Cost.types[type](...Array.from(arguments).slice(1))
}

Cost.fromJson = (objOrArray) => {
  function instanceFromJson(obj) {
    return Cost.new(obj.type, obj.id, obj.method, obj.cost, obj.length, obj.width, obj.depth);
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
