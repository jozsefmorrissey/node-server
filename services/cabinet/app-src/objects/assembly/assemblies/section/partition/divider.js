


const Divider = require('../../divider.js');
const Position = require('../../../../../position.js');
const Panel = require('../../panel.js');
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

    const panelCenterFunc = (attr) => {
      const center = sectionProperties.dividerInfo().center;
      if (attr) return attr ? dem[attr] : dem;
      return center;
    };

    this.part = () => false;
    this.included = () => false;

    const panelDemFunc = (attr) => {
      const thickness = 3 * 2.54 / 4;
      if (attr === 'z') return thickness;
      const props = sectionProperties.dividerInfo();
      const dem = {
        x: props.width,
        y: props.length,
        z: thickness
      };
      return attr ? dem[attr] : dem;
    };

    const panelRotFunc = (attr) => {
      const rotation = sectionProperties.rotation();
      if (sectionProperties.verticalDivisions()) {
        rotation.x += 90;
        rotation.y -= 90;
      } else {
        rotation.x += 90;
        rotation.y -= 90;
        rotation.z += 90;

      }
      return attr ? rotation[att] : rotation;
    }

    this.maxWidth = () => Math.max(panelDemFunc('z'), 0);


    panel = new Panel(`${partCode}-p`, 'Divider.Panel', panelCenterFunc, panelDemFunc, panelRotFunc);
    // const frame = new Frame(`df-${index}`, 'Divider.Frame', frameCenterFunc, frameDemFunc, frameRotFunc);
    this.addSubAssembly(panel);
    // this.addSubAssembly(frame);
  }
}

DividerSection.abbriviation = 'dvrs';


module.exports = DividerSection
