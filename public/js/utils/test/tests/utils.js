
const Test = require('../test.js').Test;

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

Test.add('Array: add',(ts) => {
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
