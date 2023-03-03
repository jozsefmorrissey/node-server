


const Position = require('../../../../../position.js');
const Divider = require('../../divider.js');
const Frame = require('../../frame.js');
const Assembly = require('../../../assembly.js');
const Joint = require('../../../../joint/joint');

class DividerSection extends Assembly {
  constructor(sectionProperties) {
    super(undefined, 'Divider');
    if (sectionProperties === undefined) return;
    const props = sectionProperties;
    const instance = this;
    let panel;

    this.partCode = () => `${sectionProperties.partCode()}-dp`;

    function toModel() {
      const biPoly = sectionProperties.dividerInfo(3*2.54/4);
      return biPoly.toModel();
    }

    this.part = () => false;
    this.included = () => false;


    this.maxWidth = () => 2.54*3/4;

    this.partName = () => `${sectionProperties.partName()}`;
    const panelPartName = () =>
        `${this.partName()}.Divider.Panel`;

    panel = new Divider('dvp', panelPartName, null, null, null, toModel);
    // const frame = new Frame(`df-${index}`, 'Divider.Frame', frameCenterFunc, frameDemFunc, frameRotFunc);
    panel.parentAssembly(this);
    this.addSubAssembly(panel);
    // this.addSubAssembly(frame);
  }
}

DividerSection.abbriviation = 'dvrs';


module.exports = DividerSection
