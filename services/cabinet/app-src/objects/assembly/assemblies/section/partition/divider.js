


const Divider = require('../../divider.js');
const Position = require('../../../../../position.js');
const PanelModel = require('../../panel.js').Model;
const Frame = require('../../frame.js');
const Assembly = require('../../../assembly.js');
const Joint = require('../../../../joint/joint');

class DividerSection extends Assembly {
  constructor(partCode, sectionProperties) {
    super(partCode, 'Divider');
    if (sectionProperties === undefined) return;
    const props = sectionProperties;
    const instance = this;
    let panel;

    function toModel() {
      const biPoly = sectionProperties.dividerInfo(3*2.54/4);
      return biPoly.toModel();
    }

    this.part = () => false;
    this.included = () => false;


    this.maxWidth = () => 2.54*3/4;


    panel = new PanelModel(`${partCode}-p`, 'Divider.Panel', toModel);
    // const frame = new Frame(`df-${index}`, 'Divider.Frame', frameCenterFunc, frameDemFunc, frameRotFunc);
    this.addSubAssembly(panel);
    // this.addSubAssembly(frame);
  }
}

DividerSection.abbriviation = 'dvrs';


module.exports = DividerSection
