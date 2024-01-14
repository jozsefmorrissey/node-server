


const Assembly = require('../assembly.js');
const Joint = require('../../joint/joint.js');
const FunctionCache = require('../../../../../../public/js/utils/services/function-cache.js');

class Panel extends Assembly {
  constructor(partCode, partName, config) {
    super(partCode, partName, config);

    this.railThickness = () => this.thickness();
    Object.getSet(this, {hasFrame: false});
  }
}

class PanelVoidIndex extends Panel {
  constructor(index, vOid) {
    const partCode = `:p${index}`;
    const partName = vOid.partName() + `-panel-${index}`
    super(partCode, partName);
    this.index = index;
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
