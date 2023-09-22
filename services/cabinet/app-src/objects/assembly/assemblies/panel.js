


const Assembly = require('../assembly.js');
const Joint = require('../../joint/joint.js');

class Panel extends Assembly {
  constructor(partCode, partName, centerConfig, demensionConfig, rotationConfig) {
    super(partCode, partName, centerConfig, demensionConfig, rotationConfig);

    this.railThickness = () => this.thickness();
    Object.getSet(this, {hasFrame: false});
  }
}

Panel.abbriviation = 'pn';

class PanelModel extends Panel {
  constructor(partCode, partNameFunc, toModel) {
    super(partCode);
    this.toModel = () => {
      let joints = this.getJoints().female;
      let model = toModel();
      return Joint.apply(model, joints);
    };
    this.partName = (typeof partNameFunc) === 'function' ? partNameFunc : () => partNameFunc;
  }
}

Panel.Model = PanelModel;
module.exports = Panel
