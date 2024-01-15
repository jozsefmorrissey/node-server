


const SectionProperties = require('../section-properties.js');
const Panel = require('../../panel');
const Joint = require('../../../../joint/joint.js');
const DividerSection = require('../partition/divider.js');
const Assembly = require('../../../assembly.js');

let count = 0;
class PanelSection extends Assembly {
  constructor(panel) {
    super('ps', 'panelSection');
    const instance = this;
    this.part = () => false;
    const sectionProps = () => instance.parentAssembly();

    const addJoint = (dir) => {
      const part = sectionProps()[dir]();
      const partCode = (part instanceof DividerSection ? part.panel() : part).locationCode();
      panel.addJoints(new Joint(panel.locationCode(), partCode));
    }

    this.initialize = (governingSection) => {
      this.on.change(updateJoints);
      if (!panel) panel = new Panel('ps', 'Panel-' + count++);
      panel.modelingMethod('Section')
    }

    function updateJoints() {
      panel.joints.deleteAll();
      addJoint('left');
      addJoint('right');
      addJoint('top');
      addJoint('bottom');
    }
  }
}

PanelSection.fromJson = (json) => {
  const panel = Object.fromJson(json.subassemblies.ps);
  return new PanelSection(panel);
}

PanelSection.abbriviation = 'ps';
SectionProperties.addSection(PanelSection);

module.exports = PanelSection
