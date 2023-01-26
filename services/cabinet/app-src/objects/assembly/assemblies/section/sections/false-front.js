


const SectionProperties = require('../section-properties.js');
const PULL_TYPE = require('../../../../../../globals/CONSTANTS.js').PULL_TYPE;
const DrawerFront = require('../../drawer/drawer-front.js');
const Assembly = require('../../../assembly.js');

class FalseFrontSection extends Assembly {
  constructor(front) {
    super();
    const instance = this;
    const sectionProps = () => instance.parentAssembly();
    this.part = () => false;

    this.getBiPolygon = () => {
      return sectionProps().coverInfo().biPolygon;
    }

    if (!front) front = new DrawerFront('ff', 'DrawerFront');
    this.front = () => front;
    front.partName = () => `${sectionProps().partName()}-ff`;
    this.pull = (i) => front.pull(i);
    this.addSubAssembly(front);
  }
}

FalseFrontSection.fromJson = (json) => {
  const front = Object.fromJson(json.subassemblies.ff);
  return new FalseFrontSection(front);
}

FalseFrontSection.abbriviation = 'ffs';
SectionProperties.addSection(FalseFrontSection);



module.exports = FalseFrontSection
