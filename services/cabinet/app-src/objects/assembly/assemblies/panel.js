


const Assembly = require('../assembly.js');
const Joint = require('../../joint/joint.js');

class Panel extends Assembly {
  constructor(partCode, partName, config) {
    super(partCode, partName, config);

    this.railThickness = () => this.thickness();
    Object.getSet(this, {hasFrame: false});
  }
}

class PanelVoidIndex extends Panel {
  constructor(index, vOid, included) {
    const partCode = `:p${index}`;
    super(partCode);
    this.index = index;
    this.included = included;
  }
}

class PanelToeKickBacker extends Panel {
  constructor(...args) {
    super(...args);
  }
}

Panel.abbriviation = 'pn';

Panel.VoidIndex = PanelVoidIndex;
Panel.ToeKickBacker = PanelToeKickBacker;

module.exports = Panel
