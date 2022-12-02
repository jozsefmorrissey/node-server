


const Assembly = require('../assembly.js');

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
    this.toModel = toModel;
    this.partName = partNameFunc;
  }
}

Panel.Model = PanelModel;
module.exports = Panel
