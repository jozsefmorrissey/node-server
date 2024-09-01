
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

class Dependency extends Lookup {
  constructor(dependsSelector, dependentSelector, condition, locationId) {
    super();
    if (this.constructor.name === 'Dependency') locationId ||= this.id();
    this.locationId = (val) => val === undefined ? locationId : (locationId = val);
    this.selector = {};
    this.selector.depends = (val) => val === undefined ? dependsSelector : (dependsSelector = val);
    this.selector.dependent = (val) => val === undefined ? dependentSelector : (dependentSelector = val);
    this.condition = condition;

    this.apply = () => (typeof this.condition === 'function') ? this.condition(this) : true;

    this.clone = (...args) => {
      if (args.length > 0)
        throw new Error('clone with args has been relocated to Joint.sibling');
      return this.constructor.clone(this);
    }

    this.dependsOn = (assem) => (this.constructor.name === 'Dependency' ||
                                assem.jointSettings.male(assem)) &&
                                assem.match(this.selector.depends());
    this.isDependent = (assem) => (this.constructor.name === 'Dependency' ||
                                  assem.jointSettings.female(assem)) &&
                                  assem.match(this.selector.dependent());

    this.descriptor = () => locationId ? `${this.constructor.name}(${locationId})` :
        `${this.constructor.name}:${this.selector.depends()}->${this.selector.dependent()}`;
    this.toString = this.descriptor;
  }
}

Object.class.register(Dependency, 'selector.depends', 'selector.dependent', 'locationId');

Dependency.clone = (obj, clone) => {
  clone ||= new Dependency();
  clone.selector.depends(obj.selector.depends());
  clone.selector.dependent(obj.selector.dependent());
  clone.locationId(obj.locationId());
  clone.condition = obj.condition;
  return clone;
}

module.exports = Dependency;
