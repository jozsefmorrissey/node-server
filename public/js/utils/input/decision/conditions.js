const DecisionTree = require('../../decision-tree.js');

const CONDITIONS = {};

class Condition extends DecisionTree.Condition {
  constructor() {super();}
}

class AttributeCondition extends Condition {
  constructor(attribute, value, deligator) {
    super(attribute, value, deligator);
    Object.getSet(this, {attribute, value, deligator});
    this.resolveValue = (val, attribute) => deligator.resolveValue(val, attribute);
  }
}

class NumberCondition extends AttributeCondition {
  constructor(attribute, value, deligator) {
    super(attribute, value, deligator);
    Object.getSet(this, {attribute, value});
    this.resolveValue = (val, attribute) => Number.parseFloat(deligator.resolveValue(val, attribute));
  }
}

class LessThanOrEqualCondition extends NumberCondition {
  constructor(attribute, value, deligator) {
    super(attribute, value, deligator);
    this.satisfied = (val) => {
      return this.resolveValue(val, attribute) <= value;
    }
  }
}
class GreaterThanOrEqualCondition extends NumberCondition {
  constructor(attribute, value, deligator) {
    super(attribute, value, deligator);
    this.satisfied = (val) => {
      return this.resolveValue(val, attribute) >= value;
    }
  }
}
class LessThanCondition extends NumberCondition {
  constructor(attribute, value, deligator) {
    super(attribute, value, deligator);
    this.satisfied = (val) => {
      return this.resolveValue(val, attribute) < value;
    }
  }
}
class GreaterThanCondition extends NumberCondition {
  constructor(attribute, value, deligator) {
    super(attribute, value, deligator);
    this.satisfied = (val) => {
      return this.resolveValue(val, attribute) > value;
    }
  }
}
class EqualCondition extends NumberCondition {
  constructor(attribute, value, deligator) {
    super(attribute, value, deligator);
    this.satisfied = (val) => {
      return this.resolveValue(val, attribute) === value;
    }
  }
}

class AnyCondition extends AttributeCondition {
  constructor(attribute, value, deligator) {
    super(attribute, value, deligator);
    this.satisfied = (val) => {
      return this.resolveValue(val, attribute) != '';
    }
  }
}
class ExactCondition extends AttributeCondition {
  constructor(attribute, value, deligator) {
    super(attribute, value, deligator);
    this.satisfied = (val) => {
      return this.resolveValue(val, attribute) === value;
    }
  }
}
class ExceptCondition extends AttributeCondition {
  constructor(attribute, value, deligator) {
    super(attribute, value, deligator);
    this.satisfied = (val) => {
      return this.resolveValue(val, attribute) !== value;
    }
  }
}
class ContainsCondition extends AttributeCondition {
  constructor(attribute, value, deligator) {
    super(attribute, value, deligator);
    this.satisfied = (val) => {
      return value.indexOf(this.resolveValue(val, attribute)) !== -1;
    }
  }
}

class AndCondition extends Condition {
  constructor(conditions) {
    super();
    Object.getSet(this, 'conditions');
    this.conditions = () => Object.merge([], conditions);
    this.add = (cond) => (cond instanceof Condition) && conditions.push(cond);
    this.clone = () => new AndCondition(this.conditions());
    this.satisfied = (val) => {
      for (let index = 0; index < conditions.length; index++) {
        if (!conditions[index].satisfied(val)) return false;
      }
      return true;
    }
  }
}

class OrCondition extends Condition{
  constructor(conditions) {
    super();
    Object.getSet(this, 'conditions');
    this.conditions = () => Object.merge([], conditions);
    this.add = (cond) => (cond instanceof Condition) && conditions.push(cond);
    this.clone = () => new OrCondition(this.conditions());
    this.satisfied = (val) => {
      for (let index = 0; index < conditions.length; index++) {
        if (conditions[index].satisfied(val)) return true;
      }
      return false;
    }
  }
}

class ExclusiveCondition extends AttributeCondition {
  constructor(attribute, value, deligator) {
    super(attribute, value, deligator);
    this.satisfied = (val) => {
      return value.indexOf(this.resolveValue(val, attribute)) === -1;
    }
  }
}
class InclusiveCondition extends AttributeCondition {
  constructor(attribute, value, deligator) {
    super(attribute, value, deligator);
    this.satisfied = (val) => {
      return value.indexOf(this.resolveValue(val, attribute)) !== -1;
    }
  }
}

class RegexCondition extends AttributeCondition {
  constructor(attribute, value, deligator) {
    super(attribute, value, deligator);
    const regex = (typeof value) === 'string' ? new RegExp(value) : value;
    if (!(regex instanceof RegExp)) throw new Error('Something went wrong, this object requires a regular expression');
    this.value(regex.toString());
    this.satisfied = (val) => {
      val = this.resolveValue(val, attribute);
      if ((typeof val) !== 'string') return false;
      return val.match(regex);
    }
  }
}

function getCondition(attribute, value, type, deligator) {
  if (value instanceof RegExp) return new RegexCondition(attribute, value, deligator);
  if ((typeof value) === 'number') {
    if (type === 'lessThanOrEqual') return new LessThanOrEqualCondition(attribute, value, deligator);
    if (type === 'greaterThanOrEqual') return new GreaterThanOrEqualCondition(attribute, value, deligator);
    if (type === 'lessThan') return new LessThanCondition(attribute, value, deligator);
    if (type === 'greaterThan') return new GreaterThanCondition(attribute, value, deligator);
    return new EqualCondition(attribute, value, deligator);
  }
  if ((typeof value) === 'string') {
    if (type === 'any') return new AnyCondition(attribute, value, deligator);
    if (type === 'except') return new ExceptCondition(attribute, value, deligator);
    if (type === 'contains') return new ContainsCondition(attribute, value, deligator);
    return new ExactCondition(attribute, value, deligator);
  }
  if (Array.isArray(value)) {
    if (type === 'and') return new AndCondition(attribute, value, deligator);
    if (type === 'or') return new OrCondition(attribute, value, deligator);
    if (type === 'exclusive') return new ExclusiveCondition(attribute, value, deligator);
    return new InclusiveCondition(attribute, value, deligator);
  }
  throw new Error('This should not be reachable Condition must not be defined');
}

class NodeCondition {
  constructor(attribute, value, type) {
    this.toJson = () => ({_TYPE: 'NodeCondition'});
    this.resolveValue = (node, attribute) => {
      const values = node.values();
      return Object.pathValue(values, attribute);
    }
    if (attribute._TYPE === 'NodeCondition') return this;

    type &&= type.toCamel();
    return getCondition(attribute, value, type, this);
  }
}

Object.class.register(LessThanOrEqualCondition);
Object.class.register(GreaterThanOrEqualCondition);
Object.class.register(LessThanCondition);
Object.class.register(GreaterThanCondition);
Object.class.register(EqualCondition);
Object.class.register(AnyCondition);
Object.class.register(ExactCondition);
Object.class.register(ExceptCondition);
Object.class.register(ContainsCondition);
Object.class.register(ExclusiveCondition);
Object.class.register(InclusiveCondition);
Object.class.register(RegexCondition);
Object.class.register(NodeCondition);

Condition.fromJson = (json) => {
  const deligator = Object.fromJson(json.deligator);
  const attribute = Object.fromJson(json.attribute);
  const value = Object.fromJson(json.value);
  return new (Object.class.get(json._TYPE))(attribute, value, deligator);
}


CONDITIONS.node = NodeCondition;
CONDITIONS.And = AndCondition;
CONDITIONS.Or = OrCondition;
module.exports = CONDITIONS;
