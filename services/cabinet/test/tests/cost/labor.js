
const frame = new Frame('f', 'Frame', '0,0,0', '4, 196\', .75');
const panel = new Panel('p', 'Panel', '0,0,0', '24, 10, .75');
const props = {};
const smeRound = StringMathEvaluator.round;

let unitCostValue = smeRound((35*.017)/(8*12));
let costValue = smeRound(unitCostValue * 196 * 12);
let assembly = frame;
props.linear = {
  id: 'Sand',
  method: 'Linear Feet',
  laborType: 'Sand',
  hourlyRate: '35',
  length: '8\'',
  hours: '.017',
  formula: 'l',
  unitCostValue, costValue, assembly
};

unitCostValue = smeRound((35*.08)/(48*48));
costValue = smeRound(unitCostValue * 24 * 10);
assembly = panel;
props.square = {
  id: 'Sand',
  method: 'Square Feet',
  laborType: 'Sand',
  length: '48',
  width: '48',
  hours: '.08',
  formula: 'l*w',
  unitCostValue, costValue, assembly
};

// unitCostValue = smeRound((35*.08)/(48*48));
// costValue = smeRound(unitCostValue * 24 * 10);
// console.log('costValue', costValue)
// props.cubic = {
//   id: 'Sand',
//   method: 'Cubic Feet',
//   laborType: 'Sand',
//   hourlyRate: '35',
//   length: '12',
//   width: '6',
//   depth: '1',
//   hours: '.06',
//   formula: 'l',
//   unitCostValue, costValue, assembly
// };

// props.unit = {
//   id: 'Sand',
//   method: 'Linear Feet',
//   laborType: 'Sand',
//   hourlyRate: '35',
//   length: '8\'',
//   hours: '.06',
//   formula: 'l'
// };

Test.add('LaborCost: unitCost',(ts) => {
  function testProps(props) {
    const labor = new Labor(props);
    ts.assertEquals(labor.unitCost().value, props.unitCostValue);
    ts.assertTolerance(labor.calc(props.assembly), props.costValue, .0001);
  }
  Object.values(props).forEach(testProps);
  ts.success();
});
