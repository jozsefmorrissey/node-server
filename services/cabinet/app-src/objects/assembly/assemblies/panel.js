


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

Panel.abbriviation = 'pn';

class PanelModel extends Panel {
  constructor(partCode, partNameFunc, toModel, toBiPolygon) {
    super(partCode);
    this.toModel = new FunctionCache(() => {
      let joints = this.getJoints().female;
      let model = toModel();
      return Joint.apply(model, joints);
    }, this, 'alwaysOn');
    if (toBiPolygon) this.toBiPolygon = toBiPolygon;
    this.partName = (typeof partNameFunc) === 'function' ? partNameFunc : () => partNameFunc;
  }
}

Panel.Model = PanelModel;
module.exports = Panel
