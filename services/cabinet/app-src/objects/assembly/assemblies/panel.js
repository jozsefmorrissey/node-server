


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
  constructor(index, void) {
    const partCode = `:p${index}`;
    const partName = void.partName() + `-panel-${index}`
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

module.exports = Panel
