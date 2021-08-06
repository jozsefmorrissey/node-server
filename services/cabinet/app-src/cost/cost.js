
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
    this.props = () => JSON.parse(JSON.stringify(props));
    props = this.props();
    const instance = this;
    const uniqueId = randomString();
    const lastUpdated = props.lastUpdated || new Date().getTime();
    this.lastUpdated = new Date(lastUpdated).toLocaleDateString();
    this.uniqueId = () => uniqueId;
    this.objectId = Cost.getterSetter(props, 'objectId');
    this.id = Cost.getterSetter(props, 'id');
    this.children = props.children || [];

    if (props.objectId !== undefined) {
      if (Cost.objMap[props.objectId] === undefined) Cost.objMap[props.objectId] = [];
      Cost.objMap[props.objectId].push(this);
    }

    if (!(this instanceof ReferenceCost)) {
      Cost.unique[props.id] = this;
      if (props.referenceable) Cost.defined.push(this.id());
    }

    this.addChild = (cost) => {
      if (cost instanceof Cost) {
        this.children.push(cost);
      }
    }
    const cName = this.constructor.name;
    if (Cost.lists[cName] === undefined) Cost.lists[cName] = {};
    Cost.lists[cName][props.id] = this;

    this.toJson = () => {
      const json = {
        type: Cost.constructorId(this.constructor.name),
        id: this.id(),
        objectId: this.objectId(),
        lastUpdated: lastUpdated,
        children
      };
      const children = [];
      this.children.forEach((child) => children.push(child.toJson()));
      let allProps = this.constructor.staticProps || [];
      allProps = allProps.concat(this.constructor.instanceProps);
      reqProps.forEach((prop) => json[prop] = this[prop]());
      return json;
    }
  }
}


Cost.getterSetter = (obj, attr, validation) => (val) => {
  if (val && validation && validation(val)) obj[attr] = val;
  if (validation && !validation(obj[attr])) throw new Error(`Invalid Cost Value ${obj[attr]}`);
  return obj[attr];
}
Cost.unique = {};
Cost.defined = ['Custom'];
Cost.lists = {};
Cost.objMap = {};
Cost.types = [];
Cost.get = (id) => {
  const listsKeys = Object.keys(Cost.lists);
  for (let index = 0; index < listsKeys.length; index += 1) {
    if (Cost.lists[listsKeys[index]][id]) return Cost.lists[listsKeys[index]][id];
  }
  return undefined;
};

Cost.freeId = (id) => Cost.get(id) === undefined;

Cost.constructorId = (name) => name.replace(/Cost$/, '');
Cost.register = (clazz) => {
  Cost.types[Cost.constructorId(clazz.prototype.constructor.name)] = clazz;
  Cost.typeList = Object.keys(Cost.types).sort();
}

Cost.new = function(propsOreference) {
  let constructer;
  if (propsOreference instanceof Cost)
    constructer = Cost.types[Cost.constructorId(propsOreference.constructor.name)];
  else constructer = Cost.types[Cost.constructorId(propsOreference.type)]
  return new constructer(propsOreference)
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
