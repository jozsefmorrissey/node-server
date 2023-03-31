
const Test = require('../test.js').Test;
const CompressedString = require('../../object/compressed-string.js');

Test.add('Imposter: fooled me',(ts) => {
  let str = 'one, two,threefour,one,twothree,four';
  let cStr = new CompressedString(str);
  ts.assertEquals(cStr, '^a ^b,^c^d,^a^b^c,^d');

  ts.success();
});
