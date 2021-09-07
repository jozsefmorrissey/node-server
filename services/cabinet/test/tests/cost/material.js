

const Frame = require('./labor.js').Frame;
const Material = require('./category.js').Material;


{
  const frame = new Frame('f', 'Frame', '0,0,0', '4, 196\', .75');
  const panel = new Panel('p', 'Panel', '0,0,0', '24, 10, .75');
  const props = {};
  const smeRound = StringMathEvaluator.round;
  const referenceable = true;
  const group = 'localTest30487';

  let unitCostValue = smeRound(15.37/(8*12));
  let costValue = smeRound(unitCostValue * 2 * 196 * 12);
  let assembly = frame;
  props.linear = {
    id: 'frame',
    method: 'Linear Feet',
    objectId: 'Frame',
    length: '8\'',
    cost: '15.37',
    formula: '2*l',
    referenceable, unitCostValue, costValue, assembly, group
  };

  unitCostValue = smeRound((75.13)/(96*48));
  costValue = smeRound(unitCostValue * 24 * 10);
  assembly = panel;
  props.square = {
    id: 'panel0',
    method: 'Square Feet',
    objectId: 'Panel',
    length: '96',
    width: '48',
    cost: 75.13,
    referenceable, unitCostValue, costValue, assembly, group
  };

  unitCostValue = smeRound(29.86/(12*6*1));
  costValue = smeRound(unitCostValue * 24 * 10 * .75);
  props.cubic = {
    id: 'metal',
    method: 'Cubic Feet',
    objectId: 'Panel',
    length: '12',
    width: '6',
    depth: '1',
    cost: 29.86,
    referenceable, unitCostValue, costValue, assembly, group
  };

  unitCostValue = smeRound(50.12/10);
  costValue = smeRound(unitCostValue * 13);
  console.log('costValue', costValue)
  props.unit = {
    id: 'parts',
    method: 'Unit',
    laborType: 'Instalation',
    hourlyRate: '20',
    hours: '.66',
    cost: '50.12',
    count: '10',
    referenceable, unitCostValue, costValue, group,
    assembly: 13
  };

  Test.add('MaterialCost: unitCost/calc',(ts) => {
    const costs = [];
    function testProps(props) {
      const labor = new Material(props);
      costs.push(labor);
      ts.assertTolerance(labor.unitCost().value, props.unitCostValue, .0001);
      ts.assertTolerance(labor.calc(props.assembly), props.costValue, .0001);
    }
    Object.values(props).forEach(testProps);
    costs.forEach((cost) => cost.delete());
    ts.success();
  });
}

exports.Frame = Frame
exports.Material = Material


