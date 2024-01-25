
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
    return a.constructor.joinable && a.includeJoints() && isMatch(pclcarf, a) && (!runFilter || filter(a));
  }
}


class Dependency extends Lookup {
  constructor(dependsSelector, dependentSelector, condition, locationId) {
    super();
    if (this.constructor.name === 'Dependency') locationId ||= this.id();
    const initialVals = {
      dependsSelector, dependentSelector, locationId
    }
    Object.getSet(this, initialVals);

    this.apply = () => (typeof condition === 'function') ? condition(this) : true;
    this.clone = (dependsSelector, dependentSelector, cond, locId) => {
      const mpc = dependsSelector || this.dependsSelector();
      const fpc = dependentSelector || this.dependentSelector();
      locId ||= locationId;
      const clone = Object.class.new(this, mpc, fpc, cond || condition, locId);
      return clone;
    }

    this.dependsSelector = () => dependsSelector;
    this.dependentSelector = () => dependentSelector;

    this.dependsOn = (assem) => isMatch(this.dependsSelector(), assem);
    this.isDependent = (assem) => isMatch(this.dependentSelector(), assem);

    this.discriptor = () => `${this.constructor.name}(${locationId}):${this.dependsSelector()}->${this.dependentSelector()}`;
    this.toString = this.discriptor;
  }
}

module.exports = Dependency;
