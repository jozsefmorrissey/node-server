


const SectionProperties = require('../section-properties.js');
const PULL_TYPE = require('../../../../../../globals/CONSTANTS.js').PULL_TYPE;
const DrawerFront = require('../../drawer/drawer-front.js');
const Assembly = require('../../../assembly.js');

class FalseFrontSection extends Assembly {
  constructor(sectionProperties) {
    super();
    if (sectionProperties === undefined) return;
    this.part = () => false;

    function center() {
      return sectionProperties.coverInfo().center;
    }
    this.part = () => false;

    function dems() {
      const coverInfo = sectionProperties.coverInfo();
      return {
        x: coverInfo.width,
        y: coverInfo.length,
        z: coverInfo.doorThickness
      }
    }

    this.addSubAssembly(new DrawerFront('ff', 'DrawerFront', center, dems, sectionProperties.rotation));
  }
}

FalseFrontSection.abbriviation = 'ffs';


module.exports = FalseFrontSection
