


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
      const biPoly = sectionProperties.dividerInfo();
      return biPoly.toModel(panel.getJoints().female);
    }

    let panelThickness = 3*2.54/4;
    this.panelThickness = (thickness) => {
      if (Number.isFinite(thickness) && thickness >= 0) {
        panelThickness = thickness;
      }
      return panelThickness;
    }
    this.part = () => false;
    this.included = () => false;


    this.maxWidth = () => 2.54*3/4;

    this.partName = () => `${sectionProperties.partName()}`;
    const panelPartName = () =>
        `${this.partName()}.Divider.Panel`;

    panel = new Divider('dvp' + String.random(4), panelPartName, null, null, null, toModel);
    // const frame = new Frame(`df-${index}`, 'Divider.Frame', frameCenterFunc, frameDemFunc, frameRotFunc);
    panel.parentAssembly(this);
    this.addSubAssembly(panel);
    // this.addSubAssembly(frame);

    this.panel = () => panel;
  }
}

DividerSection.abbriviation = 'dvrs';


module.exports = DividerSection
