const CONDITIONS = {};

class Condition {constructor() {Object.getSet(this, 'group')}}
CONDITIONS.Condition = Condition;

class AttributeCondition extends Condition {
  constructor(attribute, value, deligator) {
    super(attribute, value, deligator);
    Object.getSet(this, {attribute, value, deligator});
    this.prefix = () => {
      const dotIndex = attribute.indexOf('.');
      return dotIndex === -1 ? attribute : attribute.substring(0, dotIndex);
    }
    this.resolveValue = (val, attribute) => deligator.resolveValue(val, attribute);
    this.toString = () => `${this.attribute()}=>${this.value()}`;
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

const wildCardMapFunc = (str) => new RegExp('^' + RegExp.escape(str).replace(/\\\*/g, '.*') + '$');
class WildCardCondition extends AttributeCondition {
  constructor(wildCard, value, deligator) {
    super(wildCard, value, deligator);

    const valueReg = wildCardMapFunc(value);
    const paths = wildCard.split('.').map(wildCardMapFunc);

    function followPath(pIndex, object, values) {
      const keys = Object.keys(object);
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index];
        if (key.match(paths[pIndex])) {
          const value = object[key];
          if (pIndex === paths.length - 1) {
            if (value.length > 0) values.push(value);
          } else {
            followPath(pIndex + 1, value, values);
          }
        }
      }
    }

    this.satisfied = (val) => {
      const valueObj = this.resolveValue(val);
      const potentials = [];
      followPath(0, valueObj, potentials);
      for (let index = 0; index < potentials.length; index++) {
        const potVal = potentials[index];
        if (potVal.match(valueReg)) return true;
      }
      return false;
    }
  }
}
class CaseInsensitiveCondition extends AttributeCondition {
  constructor(attribute, value, deligator) {
    super(attribute, value, deligator);
    value = value.toLowerCase();
    this.satisfied = (val) => {
      const resolved = this.resolveValue(val, attribute);
      return (typeof resolved) === 'string' ? resolved.toLowerCase() === value : false;
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
  if ((typeof type) === 'string') type = type.toCamel();
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
    if (type === 'exact') return new ExactCondition(attribute, value, deligator);
    if (type === 'wildCard' || (type === undefined && (attribute + value).indexOf('*') !== -1))
      return new WildCardCondition(attribute, value, deligator);
    return new CaseInsensitiveCondition(attribute, value, deligator);
  }
  if (Array.isArray(value)) {
    if (type === 'and') return new AndCondition(attribute, value, deligator);
    if (type === 'or') return new OrCondition(attribute, value, deligator);
    if (type === 'exclusive') return new ExclusiveCondition(attribute, value, deligator);
    return new InclusiveCondition(attribute, value, deligator);
  }
  throw new Error('This should not be reachable Condition must not be defined');
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
Object.class.register(CaseInsensitiveCondition);
Object.class.register(WildCardCondition);

Condition.fromJson = (json) => {
  const deligator = Object.fromJson(json.deligator);
  const attribute = Object.fromJson(json.attribute);
  const value = Object.fromJson(json.value);
  return new (Object.class.get(json._TYPE))(attribute, value, deligator);
}

CONDITIONS.implement = (obj, conditionGetter) => {
  conditionGetter ||= getCondition;
  const conditions = [];
  const groupedConditions = {};
  const ungrouped = [];

  Object.getSet(obj, {conditions});

  obj.conditions = (group) => [].merge((group === null ? ungrouped :
          (typeof group === 'string') ?
          (groupedConditions[group] ? groupedConditions[group] : []) :
          conditions));

  obj.conditions.add = (condition, group) => {
    let dc = condition instanceof Condition ? condition : conditionGetter(condition);
    conditions.push(dc);
    condition.group(group);
    if ((typeof group) === 'string') {
      if (!groupedConditions[group]) groupedConditions[group] = [];
      groupedConditions[group].push(dc);
    }
    else ungrouped.push(dc);
  }
  obj.conditions.addAll = (conds) => {
    for (let index = 0; index < conds.length; index++) {
      const cond = conds[index];
      if (!(cond instanceof Condition)) throw new Error('WTF(sorry its been a long week): this needs to be a Condition');
      conditions.push(cond);
    }
  }
  obj.conditions.remove = (cond) => conditions.remove(cond);
}

CONDITIONS.get = getCondition;
CONDITIONS.And = AndCondition;
CONDITIONS.Or = OrCondition;
module.exports = CONDITIONS;
