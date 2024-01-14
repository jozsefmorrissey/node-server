


const SectionProperties = require('../section-properties.js');
const PULL_TYPE = require('../../../../../../globals/CONSTANTS.js').PULL_TYPE;
const DrawerFront = require('../../drawer/drawer-front.js');
const Assembly = require('../../../assembly.js');
const GovernedBySection = require('../governed-by-section');
const DrawerFrontGoverned = GovernedBySection.DrawerFront;


class FalseFrontSection extends GovernedBySection {
  constructor(front) {
    super('ff');
    const instance = this;
    const sectionProps = () => instance.parentAssembly();
    this.part = () => false;
    this.front = () => front;
    this.pull = (i) => front.pull(i);

    this.initialize = () => {
      if (!front) front = new DrawerFrontGoverned('ff', 'DrawerFront');
      front.partName = () => `${sectionProps().partName()}-ff`;
      this.addSubAssembly(front);
    }
  }
}

FalseFrontSection.fromJson = (json) => {
  const front = Object.fromJson(json.subassemblies.ff);
  return new FalseFrontSection(front);
}

FalseFrontSection.abbriviation = 'ffs';
SectionProperties.addSection(FalseFrontSection);



module.exports = FalseFrontSection
