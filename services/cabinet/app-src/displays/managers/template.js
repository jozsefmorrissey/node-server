


const AbstractManager = require('../abstract-manager.js');
const Cost = require('../../cost/cost.js');
const Input = require('../../../../../public/js/utils/input/input.js');
const Select = require('../../../../../public/js/utils/input/styles/select.js');
const MeasurementInput = require('../../../../../public/js/utils/input/styles/measurement.js');
const DecisionInputTree = require('../../../../../public/js/utils/input/decision/decision.js');
const Material = require('../../cost/types/material.js');
const Inputs = require('../../input/inputs.js');


class TemplateManager extends AbstractManager {
  constructor(id, name) {
    super(id, name);
    const getObject = (values) => mangager.getObject(values);
    this.loadPoint = () => EPNTS.templates.get();
    this.savePoint = () => EPNTS.templates.save();
    this.fromJson = Cost.fromJson;
  }
}

new TemplateManager('template-manager', 'template');

TemplateManager.inputTree = (callback) => {
  const idTypeMethod = [Inputs('id'), Inputs('costType'), Inputs('method')];

  const length = Inputs('length');
  const width = Inputs('width');
  const depth = Inputs('depth');
  const cost = Inputs('cost');
  const lengthCost = [length, cost];
  const lengthWidthCost = [length, width, cost];
  const lengthWidthDepthCost = [length, width, depth, cost];
  const color = [Inputs('color')];

  // const decisionInput = new DecisionInputTree('cost',
  //   idTypeMethod, callback);
  //
  // decisionInput.addStates({
  //   lengthCost, lengthWidthCost, lengthWidthDepthCost, cost, color
  // });
  //
  // decisionInput.then(`method:${Material.methods.LINEAR_FEET}`)
  //       .jump('lengthCost');
  // decisionInput.then(`method:${Material.methods.SQUARE_FEET}`)
  //       .jump('lengthWidthCost');
  // decisionInput.then(`method:${Material.methods.CUBIC_FEET}`)
  //       .jump('lengthWidthDepthCost');
  // decisionInput.then(`method:${Material.methods.UNIT}`)
  //       .jump('cost');
  // decisionInput.then('type:Material').jump('color');
  //
  // return decisionInput;
}
module.exports = TemplateManager
