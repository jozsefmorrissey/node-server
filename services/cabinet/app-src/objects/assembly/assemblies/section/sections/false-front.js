


const SectionProperties = require('../section-properties.js');
const PULL_TYPE = require('../../../../../../globals/CONSTANTS.js').PULL_TYPE;
const DrawerFront = require('../../drawer/drawer-front.js');
const Assembly = require('../../../assembly.js');

class FalseFrontSection extends Assembly {
  constructor(sectionProperties) {
    super();
    if (sectionProperties === undefined) return;
    this.part = () => false;

    function getBiPolygon () {
      return sectionProperties.coverInfo().biPolygon;
    }

    const front = new DrawerFront('ff', 'DrawerFront', getBiPolygon);
    this.front = () => door;
    this.pull = (i) => front.pull(i);
    this.addSubAssembly(front);
  }
}

FalseFrontSection.abbriviation = 'ffs';
SectionProperties.addSection(FalseFrontSection);



module.exports = FalseFrontSection
