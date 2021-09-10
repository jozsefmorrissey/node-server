


const RelationInput = require('../../../../public/js/utils/input/styles/select/relation.js');



Test.add('RelationInput: Equal',(ts) => {
  ts.assertEquals(RelationInput.eval('Equal', [1,4,3,5,6,4,8,9], 6), 4);
  ts.assertEquals(RelationInput.eval('equal', [1,4,3,5,6,4,8,9], 7), undefined);
  ts.assertEquals(RelationInput.eval('EQual', [1,4,3,5,6,4,8,9], 1), 0);
  ts.assertEquals(RelationInput.eval('EqUAL', [1,4,3,5,6,4,8,9], 9), 7);
  ts.assertEquals(RelationInput.eval('EquaL', [1,4,3,5,6,4,8,9], 4), 1);
  ts.assertEquals(RelationInput.eval('EqUal', [1,4,3,5,6,undefined,8,9], 8), 6);
  ts.success();
});


Test.add('RelationInput: Less Than',(ts) => {
  ts.assertEquals(RelationInput.eval('Less ThAn', [1,4,3,5,6,4,8,9], 6), 3);
  ts.assertEquals(RelationInput.eval('LeSs_Than', [1,4,3,5,6,4,8,9], 1), undefined);
  ts.assertEquals(RelationInput.eval('LeSS Than', [1,4,3,5,6,4,8,9], 200), 7);
  ts.assertEquals(RelationInput.eval('less than', [1,4,3,5,6,4,8,9], 9), 6);
  ts.assertEquals(RelationInput.eval('Less Than', [1,4,3,5,6,4,8,9], -2), undefined);
  ts.assertEquals(RelationInput.eval('Less Than', [1,4,3,5,6,undefined,8,9], 8), 4);
  ts.success();
});

Test.add('RelationInput: Greater Than',(ts) => {
  ts.assertEquals(RelationInput.eval('Greater ThAn', [1,4,3,5,6,4,8,9], 6), 6);
  ts.assertEquals(RelationInput.eval('Greater_Than', [1,4,3,5,6,4,8,9], 1), 2);
  ts.assertEquals(RelationInput.eval('Greater Than', [1,4,3,5,6,4,8,9], 200), undefined);
  ts.assertEquals(RelationInput.eval('Greater than', [1,4,3,5,6,4,8,9], 9), undefined);
  ts.assertEquals(RelationInput.eval('Greater Than', [1,4,3,5,6,4,8,9], -2), 0);
  ts.assertEquals(RelationInput.eval('Greater Than', [1,4,3,5,6,undefined,8,9], 8), 7);
  ts.success();
});

Test.add('RelationInput: Less Than Or Equal',(ts) => {
  ts.assertEquals(RelationInput.eval('Less Than Or Equal', [1,4,3,5,6,4,8,9], 6), 4);
  ts.assertEquals(RelationInput.eval('Less Than Or Equal', [1,4,3,5,6,4,8,9], 2), 0);
  ts.assertEquals(RelationInput.eval('Less Than Or Equal', [1,4,3,5,6,4,8,9], 200), 7);
  ts.assertEquals(RelationInput.eval('Less Than Or Equal', [1,4,3,5,6,4,8,9], 9), 7);
  ts.assertEquals(RelationInput.eval('Less Than Or Equal', [1,4,3,5,6,4,8,9], -2), undefined);
  ts.assertEquals(RelationInput.eval('Less Than Or Equal', [1,4,3,5,6,undefined,8,9], 7.5), 4);
  ts.success();
});

Test.add('RelationInput: Greater Than Or Equal',(ts) => {
  ts.assertEquals(RelationInput.eval('Greater Than Or Equal', [1,4,3,5,6,4,8,9], 6), 4);
  ts.assertEquals(RelationInput.eval('Greater Than Or Equal', [1,4,3,5,6,4,8,9], 1.01), 2);
  ts.assertEquals(RelationInput.eval('Greater Than Or Equal', [1,4,3,5,6,4,8,9], 200), undefined);
  ts.assertEquals(RelationInput.eval('Greater Than Or Equal', [1,4,3,5,6,4,8,9], 9), 7);
  ts.assertEquals(RelationInput.eval('Greater Than Or Equal', [1,4,3,5,6,4,8,9], -2), 0);
  ts.assertEquals(RelationInput.eval('Greater Than Or Equal', [1,4,3,5,6,undefined,8,9], 8), 6);
  ts.success();
});
