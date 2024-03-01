


const Position = require('../../../../../position.js');
const Divider = require('../../divider.js');
const Frame = require('../../frame.js');
const Assembly = require('../../../assembly.js');
const Joint = require('../../../../joint/joint');

let count = 0;
// TODO: Rename to Partition
class DividerSection extends Assembly {
  constructor(sectionProperties, divider) {
    super('dv', '');
    if (sectionProperties === undefined) return;
    this.parentAssembly(sectionProperties);
    const props = sectionProperties;
    const instance = this;

    let count = 0;

    this.part = () => false;
    this.included = () => false;


    divider ||= new Divider(null, 'Section');
    // const frame = new Frame(`df-${index}`, 'Divider.Frame', frameCenterFunc, frameDemFunc, frameRotFunc);
    divider.parentAssembly(this);
    this.addSubAssembly(divider);
    // this.addSubAssembly(frame);

    this.divider = () => divider;
  }
}

DividerSection.fromJson = (json) => {
  const divider = Object.fromJson(json.subassemblies.dv);
  return new DividerSection(json.parent, divider);
}

DividerSection.abbriviation = 'dvrs';


module.exports = DividerSection
