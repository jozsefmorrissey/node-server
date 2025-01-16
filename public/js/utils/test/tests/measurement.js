
const Test = require('../test.js').Test;


Test.add('Measurement: areaReg',(ts) => {
  const tests = [
    {str: '4x8SQFT', factors: [4,8], unit: 'SQFT', sqcm: 29728.9728},
    {str: '20.5X16SQIN', factors: [20.5,16], unit: 'SQIN', sqcm: 2116.1248},
    {str: '2.5x1.7SQM', factors: [2.5,1.7], unit: 'SQM', sqcm: 425000},
    {str: '400x800SQMM', factors: [400,800], unit: 'SQMM', sqcm: 3200}
  ];
  for (let index = 0; index < tests.length; index++) {
    const test = tests[index];
    const breakDown = Measurement.areaReg.breakdown(test.str);
    ts.assertEquals(breakDown.factors[0], test.factors[0]);
    ts.assertEquals(breakDown.factors[1], test.factors[1]);
    ts.assertEquals(breakDown.unit, test.unit);
    const sq = test.factors[0] * test.factors[1];
    const sqcm = Measurement.tocm2(test.factors, test.unit);
    ts.assertEquals(sqcm, test.sqcm);
    const areaDisplay = Measurement.display.area(sqcm, test.unit, .001);
    const value = Number.parseFloat(areaDisplay);
    ts.assertEquals(value, sq);
    const sheetDisp = Measurement.display.area(sqcm, test.str);
    const sheets = Number.parseFloat(sheetDisp);
    ts.assertEquals(sheets, 1);

  }
  ts.success();
});

Test.add('Measurement: area',(ts) => {
  let sqcm = Measurement.area([{x:4*12,y:8*12}], true);
  let display = Measurement.display.area(sqcm, 'SQFT');
  let thirtyTwo = Number.parseFloat(display.replace(/(^.*?) SQFT/, '$1'));
  ts.assertEquals(thirtyTwo, 32);
  ts.success();
});
