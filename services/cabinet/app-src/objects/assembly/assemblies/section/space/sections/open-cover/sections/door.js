


const OpeningCoverSection = require('../open-cover.js');
const Door = require('../../../../../door/door.js');
const Assembly = require('../../../../../../assembly.js');

class DoorSection extends OpeningCoverSection {
  constructor(partCode, divideProps, parent) {
    super(partCode, 'Door.Section', divideProps, parent);
    this.addSubAssembly(new Door('d', 'Door', this.coverCenter, this.coverDems));
  }
}

DoorSection.abbriviation = 'drs';

module.exports = DoorSection
