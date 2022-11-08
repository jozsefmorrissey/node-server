


const Assembly = require('../assembly.js');

class Panel extends Assembly {
  constructor(partCode, partName, centerConfig, demensionConfig, rotationConfig) {
    super(partCode, partName, centerConfig, demensionConfig, rotationConfig);

    this.railThickness = () => this.thickness();
    Object.getSet(this, {hasFrame: false});
  }
}

Panel.abbriviation = 'pn';


module.exports = Panel
