


const Frame = require('../../../app-src/objects/assembly/assemblies/frame.js');
const Panel = require('../../../app-src/objects/assembly/assemblies/panel.js');
const StringMathEvaluator = require('../../../../../public/js/utils/string-math-evaluator.js');
const Labor = require('../../../app-src/cost/types/material/labor.js');
const FunctionArgumentTest = require('../../test.js').FunctionArgumentTest;


{
  const frame = new Frame('f', 'Frame', '0,0,0', '4, 196\', .75');
  const panel = new Panel('p', 'Panel', '0,0,0', '24, 10, .75');
  const props = {};
  const smeRound = StringMathEvaluator.round;
  const referenceable = true;
  const group = 'localTest30487';

  let unitCostValue = smeRound((35*.017)/(8*12));
  let costValue = smeRound(unitCostValue * 196 * 12);
  let assembly = frame;
  props.linear = {
    id: 'Sand Frame',
    method: 'Linear Feet',
    laborType: 'Sand',
    objectId: 'Frame',
    hourlyRate: '35',
    length: '8\'',
    hours: '.017',
    formula: 'l',
    referenceable, unitCostValue, costValue, assembly, group
  };

  unitCostValue = smeRound((35*.08)/(48*48));
  costValue = smeRound(unitCostValue * 24 * 10);
  assembly = panel;
  props.square = {
    id: 'Sand Panel',
    method: 'Square Feet',
    laborType: 'Sand',
    length: '48',
    objectId: 'Panel',
    width: '48',
    hours: '.08',
    formula: 'l*w',
    referenceable, unitCostValue, costValue, assembly, group
  };

  unitCostValue = smeRound((35*.06)/(12*6*1));
  costValue = smeRound(unitCostValue * 24 * 10 * .75);
  props.cubic = {
    id: 'Sand Block',
    method: 'Cubic Feet',
    laborType: 'Sand',
    hourlyRate: '35',
    objectId: 'Panel',
    length: '12',
    width: '6',
    depth: '1',
    hours: '.06',
    formula: 'l*w*d',
    referenceable, unitCostValue, costValue, assembly, group
  };

  unitCostValue = smeRound(20*.66);
  costValue = smeRound(unitCostValue * 13);
  props.unit = {
    id: 'instalation',
    method: 'Unit',
    laborType: 'Instalation',
    hourlyRate: '20',
    hours: '.66',
    referenceable, unitCostValue, costValue, group,
    assembly: 13
  };

  Test.add('LaborCost: unitCost/calc',(ts) => {
    const costs = [];
    function testProps(props) {
      const labor = new Labor(props);
      costs.push(labor);
      ts.assertTolerance(labor.unitCost().value, props.unitCostValue, .00001);
      ts.assertTolerance(labor.calc(props.assembly), props.costValue, .00001);
    }
    Object.values(props).forEach(testProps);
    costs.forEach((cost) => cost.delete());
    ts.success();
  });

  // Test.add('LaborCost: argument validation',(ts) => {
  //   const args = [props.linear];
  //   const func = function (args) {new (Labor.prototype.constructor)(...arguments);}
  //   new FunctionArgumentTest(ts, func, args)
  //       .setIndex(0)
  //       .add('id', undefined)
  //       .run();
  //   ts.success();
  // });
}

exports.Frame = Frame
exports.Panel = Panel
exports.StringMathEvaluator = StringMathEvaluator
exports.Labor = Labor
exports.FunctionArgumentTest = FunctionArgumentTest
