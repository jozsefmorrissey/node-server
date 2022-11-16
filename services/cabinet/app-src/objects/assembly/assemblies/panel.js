


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
  constructor(partCode, partName, toModel) {
    super(partCode, partName);
    this.toModel = toModel;
  }
}

Panel.Model = PanelModel;
module.exports = Panel
