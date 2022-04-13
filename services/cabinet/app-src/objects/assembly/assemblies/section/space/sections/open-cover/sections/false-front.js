


const OpeningCoverSection = require('../open-cover.js');
const Section = require('../../../../section.js');
const PULL_TYPE = require('../../../../../../../../../globals/CONSTANTS.js').PULL_TYPE;
const DrawerFront = require('../../../../../drawer/drawer-front.js');
const Assembly = require('../../../../../../assembly.js');

class FalseFrontSection extends OpeningCoverSection {
  constructor(partCode, divideProps, parent) {
    super(partCode, 'False.Front.Section', divideProps, parent, PULL_TYPE.DRAWER);
    this.addSubAssembly(new DrawerFront('ff', 'DrawerFront', this.coverCenter, this.coverDems, '', this));
  }
}

FalseFrontSection.abbriviation = 'ffs';


module.exports = FalseFrontSection
