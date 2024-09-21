


const SectionProperties = require('../section-properties.js');
const Panel = require('../../panel');
const Joint = require('../../../../joint/joint.js');
const Assembly = require('../../../assembly.js');

let count = 0;
class PanelSection extends Assembly {
  constructor(panel) {
    super('ps', 'panelSection');
    const instance = this;
    this.part = () => false;
    const sectionProps = () => instance.parentAssembly();
  }
}

PanelSection.fromJson = (json) => {
  const panel = Object.fromJson(json.subassemblies.ps);
  return new PanelSection(panel);
}

PanelSection.abbriviation = 'ps';
SectionProperties.addSection(PanelSection);

module.exports = PanelSection
