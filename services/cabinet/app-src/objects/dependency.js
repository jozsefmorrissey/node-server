
const Lookup = require('../../../../public/js/utils/object/lookup.js');

function isMatch(partCodeOlocationCodeOassemblyOregexOfunc, assem) {
  let pclcarf = partCodeOlocationCodeOassemblyOregexOfunc;
  if (pclcarf instanceof Function) return pclcarf(assem) === true;
  if ((typeof pclcarf) === 'string') pclcarf = new RegExp(`^${pclcarf}(:.*|)$`);
  if (pclcarf instanceof RegExp) {
    return null !== (assem.partCode().match(pclcarf) || assem.locationCode().match(pclcarf));
  }
  return assem === pclcarf;
}

const matchFilter = (pclcarf, filter) => {
  const runFilter = filter instanceof Function;
  return (a) => {
    return isMatch(pclcarf, a) && (!runFilter || filter(a));
  }
}


class Dependency extends Lookup {
  constructor(dependsSelector, dependentSelector, condition, locationId) {
    super();
    if (this.constructor.name === 'Dependency') locationId ||= this.id();
    this.locationId = (val) => val === undefined ? locationId : (locationId = val);
    this.selector = {};
    this.selector.depends = (val) => val === undefined ? dependsSelector : (dependsSelector = val);
    this.selector.dependent = (val) => val === undefined ? dependentSelector : (dependentSelector = val);

    this.apply = () => (typeof condition === 'function') ? condition(this) : true;

    this.clone = (...args) => {
      if (args.length > 0)
        throw new Error('clone with args has been relocated to Joint.sibling');
      return this.constructor.clone(this);
    }

    this.dependsOn = (assem) => isMatch(this.selector.depends(), assem, 'male');
    this.isDependent = (assem) => isMatch(this.selector.dependent(), assem, 'female');

    this.descriptor = () => locationId ? `${this.constructor.name}(${locationId})` :
        `${this.constructor.name}:${this.selector.depends()}->${this.selector.dependent()}`;
    this.toString = this.descriptor;
  }
}

Object.class.register(Dependency, 'selector.depends', 'selector.dependent', 'locationId');

module.exports = Dependency;
