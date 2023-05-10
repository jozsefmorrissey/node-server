
const Test = require('../test.js').Test;
const Lookup = require('../../object/lookup');

Test.add('Lookup structure', (ts) => {
  const l1 = new Lookup();
  const l2 = new Lookup(null, 'id2');
  const l3 = {};
  Lookup.convert(l3);
  const l4 = {hic: 'cups'};
  Lookup.convert(l4, 'id2');
  Object.fromJson(l4.toJson())

  const l12 = Lookup.fromJson(l1.toJson());
  ts.assertTrue(l12 === l1);
  const l22 = Lookup.fromJson(l2.toJson());
  ts.assertTrue(l22 === l2);
  const l32 = Lookup.fromJson(l3.toJson());
  ts.assertTrue(l32 === l3);
  const l42 = Lookup.fromJson(l4.toJson());
  ts.assertTrue(l42 === l4);

  const l5Json = {pickes: 'fried', id5: 'Lookup_gibberish', ID_ATTRIBUTE: 'id5'};
  const l5 = Lookup.fromJson(l5Json);
  ts.assertEquals(l5.pickes, 'fried');
  const l52 = Lookup.fromJson(l5.toJson());
  ts.assertTrue(l52 === l5);
  l52.pickes = 'boiled...(Ewwwwww)';
  ts.assertEquals(l52.pickes, 'boiled...(Ewwwwww)');

  ts.success();
});
