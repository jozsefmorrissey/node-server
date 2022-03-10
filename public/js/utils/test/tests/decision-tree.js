

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
const statess = dNode.addStates(states);
dNode.then('style')
dNode.then('isInset (type===Inset)');

Test.add('DecisionTree',(ts) => {
  ts.assertEquals(6, 6);
  ts.success();
});
