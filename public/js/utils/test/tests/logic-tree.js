

// breakfast) Branch
//   food) Multiselect
//     bacon) Leaf
//     eggs) Select
//       2) Select
//         over easy) Leaf
//         sunny side up) Leaf
//         scramble) Leaf
//         fried) Leaf
//       3) Select
//         over easy) Leaf
//         sunny side up) Leaf
//         scramble) Leaf
//         fried) Leaf
//       6) Select
//         over easy) Leaf
//         sunny side up) Leaf
//         scramble) Leaf
//         fried) Leaf
//     toast) Select
//       white) Leaf
//       wheat) Leaf
//       texas) Leaf
//     cereal) Branch
//       milk) Leaf
//       type) Select
//         raisin brand) Leaf
//         cheerios) Leaf
//         life) Leaf
//   dishes) Branch
//     plate) Leaf
//     fork) Leaf
//     having cereal) Conditional
//       bowl) Leaf
//       spoon) Leaf


const Test = require('../test.js').Test;
const LogicTree = require('../../logic-tree');

function createTree(connectEggs, optional) {
  const tree = new LogicTree(String.random());
  const branch = tree.branch('breakfast');
  const food = branch.multiselect('food');
  food.optional(optional);
  food.leaf('bacon', {cost: 1});
  const eggs = food.select('eggs');
  const two = eggs.select(2, {multiplier: 2});
  eggs.optional(optional);
  two.optional(optional);
  two.leaf('over easy', {cost: 1.8});
  two.leaf('sunny side up', {cost: 2.6});
  two.leaf('scramble', {cost: 3.2});
  two.leaf('fried', {cost: 1.3});
  const three = eggs.select(3, {multiplier: 3}).addChildren('2');
  const six = eggs.select(6, {multiplier: 6}).addChildren('2');
  const toast = food.select('toast');
  three.optional(optional);
  six.optional(optional);
  toast.optional(optional);
  toast.leaf('white', {cost: 1.01});
  toast.leaf('wheat', {cost: 1.24});
  toast.leaf('texas', {cost: 1.17});
  const cereal = food.branch('cereal');
  cereal.leaf('milk', {cost: 8.99});
  const type = cereal.select('type');
  type.optional(optional);
  type.leaf('raisin brand', {cost: -0.55});
  type.leaf('cheerios', {cost: 1.58});
  type.leaf('life', {cost: 1.23});

  const dishes = branch.branch('dishes');
  const needPlate = dishes.conditional('need plate', (tree) => tree.reachable('bacon') || tree.reachable('eggs'));
  needPlate.leaf('plate', {cost: .14});
  needPlate.leaf('fork', {cost: .07});
  const havingCereal = dishes.conditional('having cereal', (tree) => tree.reachable('cereal'));
  havingCereal.leaf('bowl', {cost: .18});
  havingCereal.leaf('spoon', {cost: .06});

  if (connectEggs) {
    two.connectValues(three);
    two.connectDefaults(six);
  }
  return tree;
}


function access(index, returnValue, testFuncs, tree) {
  const func = testFuncs[index];
  if ((typeof func === 'function')) {
    func(tree, returnValue);
  }
}

function accessProcess(ts, testFuncs, optional) {
  let tree;

  access('init', tree = createTree(true, optional), testFuncs, tree);
  access('dontEat2', tree.setChoice('food', null), testFuncs, tree);
  if (optional)
    access('dontEat', tree.setChoice('food', {}), testFuncs, tree);

  access('bacon', tree.setChoice('food', {bacon: true}), testFuncs, tree);

  access('toast', tree.setChoice('food', {toast: true}), testFuncs, tree);
  access('chooseToast', tree.setChoice('toast', 'white'), testFuncs, tree);

  access('chooseCereal', tree.setChoice('type', 'life'), testFuncs, tree);
  access('cereal', tree.setChoice('food', {cereal: true}), testFuncs, tree);

  access('eggs', tree.setChoice('food', {eggs: true}), testFuncs, tree);
  access('2', tree.setChoice('eggs', '2'), testFuncs, tree);
  access('2value', tree.setChoice('2', 'scramble'), testFuncs, tree);
  if (optional)
    access('2NoValue', tree.setChoice('2', null), testFuncs, tree);
  access('2valueAgain', tree.setChoice('2', 'scramble'), testFuncs, tree);
  access('2default', tree.setDefault('2', 'fried'), testFuncs, tree);
  access('3', tree.setChoice('eggs', '3'), testFuncs, tree);
  access('6', tree.setChoice('eggs', '6'), testFuncs, tree);


  access('all', tree.setChoice('food', {eggs: true, bacon: true, toast: true, cereal: true}), testFuncs, tree);
}


Test.add('LogicTree structure', (ts) => {
  const tree = createTree();
  const properStructure = "breakfast) Branch\n  food) Multiselect\n    bacon) Leaf\n    eggs) Select\n      2) Select\n        over easy) Leaf\n        sunny side up) Leaf\n        scramble) Leaf\n        fried) Leaf\n      3) Select\n        over easy) Leaf\n        sunny side up) Leaf\n        scramble) Leaf\n        fried) Leaf\n      6) Select\n        over easy) Leaf\n        sunny side up) Leaf\n        scramble) Leaf\n        fried) Leaf\n    toast) Select\n      white) Leaf\n      wheat) Leaf\n      texas) Leaf\n    cereal) Branch\n      milk) Leaf\n      type) Select\n        raisin brand) Leaf\n        cheerios) Leaf\n        life) Leaf\n  dishes) Branch\n    need plate) Conditional\n      plate) Leaf\n      fork) Leaf\n    having cereal) Conditional\n      bowl) Leaf\n      spoon) Leaf\n";
  ts.assertEquals(tree.structure(), properStructure);
  ts.success();
});

Test.add('LogicTree decisions', (ts) => {
  function validateDecisions (tree, ...names) {
    const decisions = tree.decisions();
    ts.assertEquals(decisions.length, names.length);
    const decisionNames = decisions.map((elem) => elem.name);
    for (let index = 0; index < names.length; index += 1) {
      ts.assertNotEquals(decisionNames.indexOf(names[index]) === -1);
    }
  }

  const testFuncs = {
    init: (tree) => validateDecisions(tree, 'food'),
    dontEat: (tree) => validateDecisions(tree, 'food'),

    bacon: (tree) => validateDecisions(tree, 'food'),

    toast: (tree) => validateDecisions(tree, 'food', 'toast'),
    chooseToast: (tree) => validateDecisions(tree, 'food', 'toast'),

    chooseCereal: (tree) => validateDecisions(tree, 'food', 'toast'),
    cereal: (tree) => validateDecisions(tree, 'food', 'having cereal'),

    eggs: (tree) => validateDecisions(tree, 'food', 'eggs'),
    "2": (tree) => validateDecisions(tree, 'food', 'eggs', '2'),
    "2value": (tree) => validateDecisions(tree, 'food', 'eggs', '2'),
    "2NoValue": (tree) => validateDecisions(tree, 'food', 'eggs', '2'),
    "2valueAgain": (tree) => validateDecisions(tree, 'food', 'eggs', '2'),
    "2default": (tree) => validateDecisions(tree, 'food', 'eggs', '2'),
    "3": (tree) => validateDecisions(tree, 'food', 'eggs', '3'),
    "6": (tree) => validateDecisions(tree, 'food', 'eggs', '6'),

    all: (tree) => validateDecisions(tree, 'food', 'eggs', '6', 'having cereal', 'toast')
  }
  accessProcess(ts, testFuncs);
  ts.success();
});

function testIsComplete(ts) {
  return (tree, isComplete) => ts.assertTrue(isComplete === tree.isComplete());
}

Test.add('LogicTree isComplete (optional)', (ts) => {
  const tic = testIsComplete(ts);
  const testFuncs = {
    init: (tree) => tic(tree, true),
    dontEat: (tree) =>  tic(tree, true),
    dontEat2: (tree) =>  tic(tree, true),
    bacon: (tree) =>  tic(tree, true),
    toast: (tree) =>  tic(tree, true),
    chooseToast: (tree) =>  tic(tree, true),
    chooseCereal: (tree) =>  tic(tree, true),
    cereal: (tree) =>  tic(tree, true),
    eggs: (tree) =>  tic(tree, true),
    "2": (tree) =>  tic(tree, true),
    "2value": (tree) =>  tic(tree, true),
    "2NoValue": (tree) =>  tic(tree, true),
    "2valueAgain": (tree) =>  tic(tree, true),
    "2default": (tree) =>  tic(tree, true),
    "3": (tree) =>  tic(tree, true),
    "6": (tree) =>  tic(tree, true),
    all: (tree) =>  tic(tree, true),
  }
  accessProcess(ts, testFuncs, true);
  ts.success();
});

Test.add('LogicTree isComplete (!optional)', (ts) => {
  const tic = testIsComplete(ts);
  const testFuncs = {
    init: (tree) => tic(tree, false),
    dontEat: (tree) =>  tic(tree, false),
    dontEat2: (tree) =>  tic(tree, false),
    bacon: (tree) =>  tic(tree, true),
    toast: (tree) =>  tic(tree, false),
    chooseToast: (tree) =>  tic(tree, true),
    chooseCereal: (tree) =>  tic(tree, true),
    cereal: (tree) =>  tic(tree, true),
    eggs: (tree) =>  tic(tree, false),
    "2": (tree) =>  tic(tree, false),
    "2value": (tree) =>  tic(tree, true),
    "2NoValue": (tree) =>  tic(tree, false),
    "2valueAgain": (tree) =>  tic(tree, true),
    "2default": (tree) =>  tic(tree, true),
    "3": (tree) =>  tic(tree, true),
    "6": (tree) =>  tic(tree, true),
    all: (tree) =>  tic(tree, true),
  }
  accessProcess(ts, testFuncs, false);
  ts.success();
});

// Test.add('LogicTree ', (ts) => {
//   function validateDecisions (tree, ...names) {
//     const decisions = tree.decisions();
//     ts.assertEquals(decisions.length, names.length);
//     const decisionNames = decisions.map((elem) => elem.name);
//     for (let index = 0; index < names.length; index += 1) {
//       ts.assertNotEquals(decisionNames.indexOf(names[index]) === -1);
//     }
//   }
//
//   const testFuncs = {
//     init: (tree) => ,
//     dontEat: (tree) => ,
//
//     bacon: (tree) => ,
//
//     toast: (tree) => ,
//     chooseToast: (tree) => ,
//
//     chooseCereal: (tree) => ,
//     cereal: (tree) => ,
//
//     eggs: (tree) => ,
//     "2": (tree) => ,
//     "2value": (tree) => ,
//     "2NoValue": (tree) => ,
//     "2valueAgain": (tree) => ,
//     "2default": (tree) => ,
//     "6": (tree) => ,
//
//     all: (tree) =>
//   }
//   accessProcess(ts, testFuncs);
//   ts.success();
// });
