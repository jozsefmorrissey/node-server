

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
const Lookup = require('../../object/lookup');
// const DecisionTree = require('../../logic-tree');

function createTree() {
  const states = {};

  states[5] = {descriptor: 'style'}
  states[6] = {descriptor: 'solid'}
  states[7] = {descriptor: 'isInset=false'}
  states[8] = {descriptor: 'material'}
  states[9] = {descriptor: 'mdf'}
  states[10] = {descriptor: 'cost'}
  states[11] = {descriptor: 'profile'}
  states[12] = {descriptor: 'soft maple'}
  states[15] = {descriptor: 'walnut'}
  states[18] = {descriptor: 'alder'}
  states[21] = {descriptor: 'panel'}
  states[22] = {descriptor: 'isInset=true'}
  states[24] = {descriptor: 'shaker'}
  states[25] = {descriptor: 'mdfCore'}
  states[26] = {descriptor: 'soft maple'}
  states[27] = {descriptor: 'nonMdfCore'}
  states[28] = {descriptor: 'soft maple'}
  states[29] = {descriptor: 'walnut'}
  states[30] = {descriptor: 'alder'}

  states[32] = {descriptor: 'isInset (type===Inset)'}
  states[33] = {descriptor: 'magnet'}


  const dTree = new DecisionTree('root');
  const dNode = dTree.root();
  const statess = dTree.addStates(states);
  const style = dNode.then(5);
  const solid = style.then(6);
  const material = solid.then([7,8])[1];
  const materials = material.then([9,12,15,18]);
  materials[0].then([10,11]);
  materials[1].addChildren(9);
  materials[2].addChildren(materials[1]);
  materials[3].addChildren(materials[0].stateConfig());
  dTree.toString();

  const panel = style.then(21);
  panel.then(22);
  const profile = panel.then(11);
  const shaker = profile.then(24);
  shaker.then(25).then(26);
  const nonMdfCore = shaker.then(27);
  const alder = nonMdfCore.then([28,29,30])[2];

  dNode.then(32).then(33);

  return dTree;
}

Test.add('DecisionTree: subtree',(ts) => {
  const tree = createTree();
  const style = tree.root().next(5);
  const shaker = tree.getByName('5','21','11',24);
  const subtree = style.subtree();
  const shakerSubtree = shaker.subtree();

  ts.assertEquals(style.payload(true), subtree.root().payload(true));
  ts.assertEquals(style, style.payload().node);
  ts.assertNotEquals(subtree.root().payload().node, style.payload().node);
  ts.assertEquals(subtree.root(), subtree.root().payload().node);
  ts.assertTrue(style.equals(subtree.root()));
  ts.assertFalse(shaker.equals(subtree.root()));
  ts.assertFalse(shakerSubtree.equals(subtree.root()));
  ts.assertTrue(shaker.equals(shakerSubtree.root()));
  ts.success();
});


Test.add('DecisionTree: reachable',(ts) => {
  const tree = createTree();
  const style = tree.root().next(5);
  const subtree = style.subtree();
  const func = (node) => node.payload().descriptor !== 'cost';
  const conditions = {'21': '11', '27': /29|30/, '9': func};

  const kept = ['5','6','7','8','9', '10', '11','12','15',
                '18','21','24','25','26','27','29','30'];
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
    const errorMsg = errors[node.name()] || errors.default;
    ts.assertNotEquals(kept.indexOf(node.name()), -1, errorMsg);
    nodeCount++;
  }, conditions);
  ts.assertEquals(nodeCount, 47, 'Subtree does not include all the nodes it should');
  ts.success();
});

Test.add('DecisionTree: leaves', (ts) => {
  const tree = createTree();
  const style = tree.root().next(5);
  const subtree = style.subtree();
  const func = (node) => node.payload().descriptor !== 'cost';
  const conditions = {'21': '11', '27': /29|30/, '9': func};

  const leaves = subtree.leaves(conditions);
  ts.assertEquals(leaves.length, 19, 'Not plucking all the leaves');
  ts.assertEquals(tree.root().leaves().length, 27, 'Not plucking all the leaves');
  ts.success();
});

function createSelfRefernceTree() {
  const tree = new DecisionTree('root');
  const recursive = tree.root().then('recursive', {id: 'recDefault'});
  recursive.setValue('id', 'original');
  recursive.then('recursive', {id: 'recusion1'});
  const other = tree.root().then('other', {id: 'otherDefault'});
  other.setValue('id', 'original');
  other.then('recursive', {id: 'other'}).then('other', {id: 'recursive'});
  return tree;
}

Test.add('DecisionTree: selfRefernce', (ts) => {
  const tree = createSelfRefernceTree();
  const recOrig = tree.getByName('recursive');
  ts.assertEquals(recOrig.payload().id, 'original');
  const rec1 = tree.getByName('recursive', 'recursive');
  ts.assertEquals(rec1.payload().id, 'recusion1');
  const otherOrig = tree.getByName('other');
  ts.assertEquals(otherOrig.payload().id, 'original');
  const otherRec = tree.getByName('other', 'recursive', 'other');
  ts.assertEquals(otherRec.payload().id, 'recursive');

  const recDeep = tree.getByName('other', 'recursive', 'recursive', 'other','recursive');
  ts.assertEquals(recDeep.payload().id, 'recDefault');
  const otherDeep = tree.getByName('recursive', 'other', 'recursive', 'recursive', 'other','recursive', 'other');
  ts.assertEquals(otherDeep.payload().id, 'otherDefault');

  ts.assertTrue(recOrig.subtree().root().equals(recOrig));

  ts.success();
});

Test.add('DecisionTree: remove', (ts) => {
  const tree = createSelfRefernceTree();
  const other = tree.getByName('recursive', 'other');
  other.remove();

  let otherList = tree.root().list((n) => n.name() === 'other');
  ts.assertEquals(otherList.length, 1);
  otherList[0].remove();
  otherList = tree.root().list((n) => n.name() === 'other');
  ts.assertEquals(otherList.length, 0);

  ts.success();
});

Test.add('DecisionTree: change', (ts) => {
  const tree = createSelfRefernceTree();
  const other = tree.getByName('recursive', 'other');
  other.stateConfig().name('other2');
  ts.success();
});

Test.add('DecisionTree: toJson', (ts) => {
  const tree = createSelfRefernceTree();
  const treeJson = tree.toJson();
  const rootJson = tree.root().toJson();
  ts.assertTrue(Object.equals(treeJson, rootJson));

  const recNode = tree.getByName('recursive');
  ts.assertFalse(recNode.equals(tree.root()));
  const recJson = recNode.toJson();
  ts.assertFalse(Object.equals(recNode, rootJson));
  const recFromRootJson = {name: 'recursive', root: rootJson.root.children.recursive,
              _TYPE: rootJson._TYPE, stateConfigs: rootJson.stateConfigs};
  ts.assertTrue(Object.equals(recJson, recFromRootJson));
  ts.success();
});

Test.add('DecisionTree: fromJson', (ts) => {
  const tree = createSelfRefernceTree();
  const treeJson = tree.toJson();
  const treeFromJson = Object.fromJson(treeJson);
  ts.assertTrue(treeFromJson.root().equals(tree.root()));
  ts.assertTrue(tree.root().payload(true) === treeFromJson.root().payload(tree));
  ts.success();
});

Test.add('DecisionTree: clone', (ts) => {
  const tree = createSelfRefernceTree();
  const clone = tree.clone();
  ts.assertTrue(clone !== tree);
  ts.assertTrue(clone.root().equals(tree.root()));
  ts.assertTrue(tree.root().payload(true) === clone.root().payload(tree));

  ts.success();
});
