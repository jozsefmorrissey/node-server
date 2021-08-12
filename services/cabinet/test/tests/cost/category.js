//
//
// {
//   const frame = new Frame('f', 'Frame', '0,0,0', '4, 196\', .75');
//   const panel = new Panel('p', 'Panel', '0,0,0', '24, 10, .75');
//   const frame.addSubAssembly(panel);
//   const props = {};
//   const smeRound = StringMathEvaluator.round;
//
//   let unitCostValue = smeRound(15.37/(8*12));
//   let costValue = smeRound(unitCostValue * 2 * 196 * 12);
//   let assembly = frame;
//   props.linear = {
//     id: 'frame',
//     method: 'Linear Feet',
//     length: '8\'',
//     cost: '15.37',
//     formula: '2*l',
//     unitCostValue, costValue, assembly
//   };
//
//   unitCostValue = smeRound((75.13)/(96*48));
//   costValue = smeRound(unitCostValue * 24 * 10);
//   props.square = {
//     id: 'panel0',
//     method: 'Square Feet',
//     length: '96',
//     width: '48',
//     cost: 75.13,
//     unitCostValue, costValue, assembly
//   };
//
//   unitCostValue = smeRound(29.86/(12*6*1));
//   costValue = smeRound(unitCostValue * 24 * 10 * .75);
//   props.cubic = {
//     id: 'metal',
//     method: 'Cubic Feet',
//     length: '12',
//     width: '6',
//     depth: '1',
//     cost: 29.86,
//     unitCostValue, costValue, assembly
//   };
//
//   unitCostValue = smeRound(50.12/10);
//   costValue = smeRound(unitCostValue * 13);
//   console.log('costValue', costValue)
//   props.unit = {
//     id: 'parts',
//     method: 'Unit',
//     laborType: 'Instalation',
//     hourlyRate: '20',
//     hours: '.66',
//     cost: '50.12',
//     count: '10',
//     unitCostValue, costValue,
//     assembly: 13
//   };
//   const catCost = new Category({id: 'catTest'});
//
//   Test.add('CategoryCost: calc',(ts) => {
//     let totalCost = 0;
//     function testProps(props) {
//       const matCost = new Material(props);
//       catCost.addChild(matCost);
//       totalCost += matCost.calc(props.assembly);
//     }
//     Object.values(props).forEach(testProps);
//     ts.assertTolerance(totalCost, catCost.calc(), .0001);
//     ts.success();
//   });
// }
