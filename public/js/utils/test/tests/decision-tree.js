

// branch structure
//
// style
//   solid
//     isInset:false
//     material
//       mdf
//         cost
//         profile
//       soft maple
//         cost
//         profile
//       walnut
//         cost
//         profile
//       alder
//         cost
//         profile
//   panel
//     isInset:true
//     profile
//       shaker
//         mdfCore
//           soft maple
//         nonMdfCore
//           soft maple
//           walnut
//           alder
//
// isInset (type===Inset)
//   magnet

const Test = require('../test.js').Test;
const DecisionTree = require('../../decision-tree');
const states = {};

states[5] = {descriptor: 'style'}
states[6] = {descriptor: 'solid'}
states[7] = {descriptor: 'isInset=false'}
states[8] = {descriptor: 'material'}
states[9] = {descriptor: 'mdf'}
states[10] = {descriptor: 'cost'}
states[11] = {descriptor: 'profile'}
states[12] = {descriptor: 'soft maple'}
states[13] = {descriptor: 'cost'}
states[14] = {descriptor: 'profile'}
states[15] = {descriptor: 'walnut'}
states[16] = {descriptor: 'cost'}
states[17] = {descriptor: 'profile'}
states[18] = {descriptor: 'alder'}
states[19] = {descriptor: 'cost'}
states[20] = {descriptor: 'profile'}
states[21] = {descriptor: 'panel'}
states[22] = {descriptor: 'isInset=true'}
states[23] = {descriptor: 'profile'}
states[24] = {descriptor: 'shaker'}
states[25] = {descriptor: 'mdfCore'}
states[26] = {descriptor: 'soft maple'}
states[27] = {descriptor: 'nonMdfCore'}
states[28] = {descriptor: 'soft maple'}
states[29] = {descriptor: 'walnut'}
states[30] = {descriptor: 'alder'}

states[32] = {descriptor: 'isInset (type===Inset)'}
states[33] = {descriptor: 'magnet'}

const dNode = new DecisionTree('root', {_UNIQUE_NAME_GROUP: 'tester'});
const dNode2 = new DecisionTree('root2', {_UNIQUE_NAME_GROUP: 'tester'});
const dNode3 = new DecisionTree('root3', {_UNIQUE_NAME_GROUP: 'testerr'});
const statess = dNode.addStates(states);
const style = dNode.then(5);
const solid = style.then(6);
const material = solid.then([7,8])[1];
const materials = material.then([9,12,15,18]);
materials[0].then([10,11]);
materials[1].then([13,14]);
materials[2].then([16,17]);
materials[3].then([19,20]);


const panel = style.then(21);
panel.then(22);
const profile = panel.then(23);
const shaker = profile.then(24);
shaker.then(25).then(26);
const nonMdfCore = shaker.then(27);
nonMdfCore.then([28,29,30]);

dNode.then(32).then(33);
const func = (node) => node.payload().descriptor !== 'cost';
const subtree = style.subtree({'21': '23', '27': /29|30/, '9': func});


Test.add('DecisionTree Subtree',(ts) => {
  const kept = ['5','6','7','8','9','11','12','13','14','15','16','17',
                '18','19','20','21','23','24','25','26','27','29','30'];
  const ignored = ['10','22', '28','32','33','root'];
  const errors = {
    '10': 'Function condition did not work',
    '28': 'Regular expression condition did not work',
    '22': 'String condition did not work.',
    '32': 'Subtree is including parents',
    '33': 'Subtree is including parents',
    'root': 'Subtree is including parents',
    'default': 'This should not happen I would check the modification history of this test file.'
  }
  let nodeCount = 0;
  subtree.forEach((node) => {
    const errorMsg = errors[node.name] || errors.default;
    ts.assertNotEquals(kept.indexOf(node.name), -1, errorMsg);
    nodeCount++;
  });
  ts.assertEquals(nodeCount, 23, 'Subtree does not include all the nodes it should');
  ts.success();
});

Test.add('DecisionTree Leaves', (ts) => {
  const leaves = subtree.leaves();
  ts.assertEquals(leaves.length, 11, 'Not plucking all the leaves');
  ts.assertEquals(dNode.leaves().length, 15, 'Not plucking all the leaves');
  ts.success();
});
//
// Test.add('DecisionTree _UNIQUE_NAME_GROUP', (ts) => {
//   try {
//     dNode2.addState('5', {});
//     ts.fail('_UNIQUE_NAME_GROUP should have caused an error to be thrown');
//   } catch (e) {}
//   try {
//     dNode3.addState('5', {});
//   } catch (e) {
//     ts.fail('_UNIQUE_NAME_GROUP should have caused an error to be thrown');
//   }
//   try {
//     const dNode4 = new DecisionTree('root', {_UNIQUE_NAME_GROUP: 'tester'});
//     ts.fail('_UNIQUE_NAME_GROUP should have caused an error to be thrown');
//   } catch (e) {}
//   ts.success();
// });
