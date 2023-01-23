
const Test = require('../../../../public/js/utils/test/test').Test;

class JustTryAndCopyMe {
  constructor() {
    Object.getSet(this, {one: 1, two: 2, override1: 'unchanged1'});
    this.three = 3;
    this.four = 4;
    this.override2 = 'unchanged2'
    this.array = [1,2,3,4];
    this.object = {one: 1, two: 2, three: 3};

    this.equals = () => false;
  }
}

Test.add('Imposter: fooled me',(ts) => {
  const orig = new JustTryAndCopyMe();
  const imposter = new Imposter(orig, {override1: () => 'changed1', override2: 'changed2'});
  ts.assertTrue(imposter instanceof JustTryAndCopyMe);
  ts.assertEquals(orig.one(), imposter.one());
  ts.assertEquals(orig.two(), imposter.two());
  ts.assertEquals(orig.three, imposter.three);
  ts.assertEquals(orig.four, imposter.four);

  ts.assertEquals(orig.one(4), imposter.one());
  ts.assertEquals(orig.two(3), imposter.two());
  orig.three = 7;
  ts.assertEquals(orig.three, imposter.three);
  orig.four = 8;
  ts.assertEquals(orig.four, imposter.four);

  ts.assertEquals(imposter.one(2), orig.one());
  ts.assertEquals(imposter.two(1), orig.two());
  imposter.three = 5;
  ts.assertEquals(orig.three, imposter.three);
  imposter.four = 0;
  ts.assertEquals(orig.four, imposter.four);

  ts.assertEquals(orig.array, imposter.array);
  ts.assertEquals(orig.object, imposter.object);
  orig.array[0] = 44;
  imposter.object.one = 66;
  ts.assertEquals(orig.array[0], imposter.array[0]);
  ts.assertEquals(orig.object.one, imposter.object.one);

  ts.assertFalse(orig === imposter);
  ts.assertFalse(orig.equals(imposter));
  ts.assertTrue(imposter.equals(orig));

  // Test initial values
  ts.assertEquals(imposter.override1(), 'changed1');
  ts.assertEquals(imposter.override2, 'changed2');
  ts.assertEquals(orig.override1(), 'unchanged1');
  ts.assertEquals(orig.override2, 'unchanged2');

  // Test function changes
  ts.assertEquals(imposter.override1('changed3'), 'changed1');
  ts.assertEquals(imposter.override2, 'changed2');
  ts.assertEquals(orig.override1('unchanged3'), 'unchanged3');
  ts.assertEquals(orig.override2, 'unchanged2');

  // Test field assinments
  imposter.override2 = 'changed4';
  ts.assertEquals(imposter.override2, 'changed4');
  ts.assertEquals(imposter.override1(), 'changed1');
  orig.override2 = 'unchanged5';
  ts.assertEquals(orig.override2, 'unchanged5');
  ts.assertEquals(orig.override1(), 'unchanged3');

  ts.success();
});
