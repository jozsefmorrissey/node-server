


const OpeningCoverSection = require('../open-cover.js');
const Section = require('../../../../section.js');
const PULL_TYPE = require('../../../../../../../../../globals/CONSTANTS.js').PULL_TYPE;
const DrawerFront = require('../../../../../drawer/drawer-front.js');
const Assembly = require('../../../../../../assembly.js');

class FalseFrontSection extends OpeningCoverSection {
  constructor(partCode, divideProps, parent) {
    super(FalseFrontSection.filePath('false-front'), partCode, 'False.Front.Section', divideProps, PULL_TYPE.DRAWER);
    this.addSubAssembly(new DrawerFront('ff', 'DrawerFront', this.coverCenter, this.coverDems, '', this));
  }
}

FalseFrontSection.abbriviation = 'ffs';

Assembly.register(FalseFrontSection);
module.exports = FalseFrontSection
