
const Test = require('../test.js').Test;
const Tolerance = require('../../tolerance.js');

Test.add('Array: scale',(ts) => {
  const original = [1,2,3,4];
  const arr = Array.from(original);
  const valScale = arr.scale(3, true);
  ts.assertTrue(original.equals(arr));
  ts.assertTrue(valScale.equals([3,6,9,12]));
  const funcScale = arr.scale((val, index) => index, true);
  ts.assertTrue(original.equals(arr));
  ts.assertTrue(funcScale.equals([0,2,6,12]));
  arr.scale([9,5,3,2]);
  ts.assertTrue(!original.equals(arr));
  ts.assertTrue(arr.equals([9,10,9,8]));

  ts.success();
});

Test.add('Array: add', (ts) => {
  const original = [1,2,3,4];
  const arr = Array.from(original);
  const valScale = arr.add(3, true);
  ts.assertTrue(original.equals(arr));
  ts.assertTrue(valScale.equals([4,5,6,7]));
  const funcScale = arr.add((val, index) => index, true);
  ts.assertTrue(original.equals(arr));
  ts.assertTrue(funcScale.equals([1,3,5,7]));
  arr.add([9,5,3,2]);
  ts.assertTrue(!original.equals(arr));
  ts.assertTrue(arr.equals([10,7,6,6]));

  ts.success();
});

Test.add('Object.pathValue', (ts) => {
  const eightNine = {eight: {nine: 9}};
  const testObj = {
    one: () => ({two: 2, three: () => eightNine}),
    four: [4, {five: 5, six: {seven: 7}}, () => 10]
  };
  let value = testObj.pathValue('four.1.six.seven');
  ts.assertEquals(value, 7);
  value = testObj.pathValue('one().three().eight.nine')
  ts.assertEquals(value, 9);
  value = testObj.pathValue('four.2()');
  ts.assertEquals(value, 10);

  ts.assertEquals(testObj.pathValue('four.five', 10), 10);
  ts.assertEquals(testObj.pathValue('four.five'), 10);
  ts.assertEquals(testObj.pathValue('one().three().eight.nine', 18), 18);
  ts.assertEquals(testObj.pathValue('one().three().eight.nine'), 18);

  ts.assertEquals(testObj.pathValue('one().three().eight.eleven.twelve.13.14.fifteen', 15), 15);
  ts.assertEquals(testObj.pathValue('one().three().eight.eleven.twelve.13.14.fifteen'), 15);
  ts.assertTrue(Array.isArray(testObj.pathValue('one().three().eight.eleven.twelve')));
  ts.assertTrue(Array.isArray(testObj.pathValue('one().three().eight.eleven.twelve.13')));
  ts.success();
});

Test.add('Utils: Array.relitiveIndex',(ts) => {
  let a = [0,1,2,3,4,5,6,7,8,9]
  ts.assertEquals(a.relitiveIndex(5, 5), 0);
  ts.assertEquals(a.relitiveIndex(6, 5), 1);
  ts.assertEquals(a.relitiveIndex(4, 5), -1);
  ts.assertEquals(a.relitiveIndex(9, 5), 4);
  ts.assertEquals(a.relitiveIndex(1, 5), -4);
  ts.assertEquals(a.relitiveIndex(0, 5), 5);
  ts.success();
});

Test.add('Tolerance: bounds',(ts) => {
  let a = [0,1,2,3,4,5,6,7,8,9];
  a.add(.5);
  a.scale(.1);

  const places = 10;
  const tol = .001;
  const tolObj = new Tolerance(tol);
  for (let i = 0; i < places; i++) {
    if (i !== 0) a.scale(10);
    for (let j = 0; j < 10; j++) {
      const tolerance = a[j] < 1 ? tol:
            Math.pow(10, Math.floor(Math.log10(a[j]) + 1)) * tol;
      const target = Math.roundTo(Math.floor(Math.roundTo(a[j] / tolerance, tol)) * tolerance);
      const answer = {
        upper: Math.roundTo(target+tolerance, tol),
        target: Math.roundTo(target, tol),
        lower: Math.roundTo(target - tolerance, tol)
      };
      if (answer.lower === 0 && answer.target > tol)
        answer.lower = Math.roundTo(answer.target - answer.target/10, tol);
      const bounds = tolObj.bounds(answer.target);
      if (bounds.lower !== answer.lower ||
          bounds.upper !== answer.upper ||
          bounds.target !== answer.target) {
        tolObj.bounds(answer.target);
      }
      console.log(a[j], tolerance, answer);
    }
  }
  ts.success();
});
