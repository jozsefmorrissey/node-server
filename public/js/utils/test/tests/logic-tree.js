

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

class ReferenceableFuctions {
  constructor(id) {
    id = id._TYPE === undefined ? id : id.id;
    Object.getSet(this, {id});
    this.condition = (tree) => {
      if (id === 1) {
        return tree.reachable('bacon') || tree.reachable('eggs');
      } else if (id === 2) {
        return tree.reachable('cereal');
      }
    }
    this.LOGIC_TYPE = 'Conditional';
    this.clone = () => new ReferenceableFuctions(id);
  }
}

function createTree(connectEggs, optional, shouldCopy, testFuncs) {
  const tree = new LogicTree(String.random());

  function runTestFunc(name) {
    if (testFuncs && testFuncs[name]) {
      testFuncs[name](tree, name);
    }
  }

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
  runTestFunc('onlyOne');
  const three = eggs.select(3, {multiplier: 3}).addChildren('2');
  runTestFunc('now2');
  const six = eggs.select(6, {multiplier: 6}).addChildren('2');
  runTestFunc('now3');
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
  const needPlate = dishes.conditional('need plate', new ReferenceableFuctions(1));
  needPlate.leaf('plate', {cost: .14});
  needPlate.leaf('fork', {cost: .07});
  const havingCereal = dishes.conditional('having cereal', new ReferenceableFuctions(2));
  havingCereal.leaf('bowl', {cost: .18});
  havingCereal.leaf('spoon', {cost: .06});
  runTestFunc('all');

  if (connectEggs) {
    two.valueSync(three);
    two.defaultSync(six);
  }
  return shouldCopy ? copy(tree) : tree;
}

function copy(origTree) {
    const treeJson = origTree.toJson();
    return Object.fromJson(treeJson);
}

function testIsComplete(ts) {
  return (tree, isComplete) => ts.assertTrue(isComplete === tree.isComplete());
}

function access(index, returnValue, testFuncs, tree) {
  const func = testFuncs[index];
  if ((typeof func === 'function')) {
    func(tree, returnValue);
  }
}

function accessProcess(ts, testFuncs, optional, shouldCopy) {
  let tree = createTree(true, optional, shouldCopy);
  access('init', tree, testFuncs, tree);
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
  return tree;
}

function LogicTest(tree, ts) {
  const properStructure = "breakfast) Branch\n  food) Multiselect\n    bacon) Leaf\n    eggs) Select\n      2) Select\n        over easy) Leaf\n        sunny side up) Leaf\n        scramble) Leaf\n        fried) Leaf\n      3) Select\n        over easy) Leaf\n        sunny side up) Leaf\n        scramble) Leaf\n        fried) Leaf\n      6) Select\n        over easy) Leaf\n        sunny side up) Leaf\n        scramble) Leaf\n        fried) Leaf\n    toast) Select\n      white) Leaf\n      wheat) Leaf\n      texas) Leaf\n    cereal) Branch\n      milk) Leaf\n      type) Select\n        raisin brand) Leaf\n        cheerios) Leaf\n        life) Leaf\n  dishes) Branch\n    need plate) Conditional\n      plate) Leaf\n      fork) Leaf\n    having cereal) Conditional\n      bowl) Leaf\n      spoon) Leaf\n";
  ts.assertEquals(tree.structure(), properStructure);
  ts.success();
}

function decisionsTest(ts, copy) {
  function validateDecisions (tree, ...names) {
    if (tree.decisions().length !== names.length) {
      console.log('badd!')
    }
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
  accessProcess(ts, testFuncs, undefined, copy);
  ts.success();
}

function optionalTest(ts, shouldCopy) {
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
  accessProcess(ts, testFuncs, true, shouldCopy);
  ts.success();
}

function notOptionalTest(ts, shouldCopy) {
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
  accessProcess(ts, testFuncs, false, shouldCopy);
  ts.success();
}

function instanceCountTest(ts, shouldCopy) {
  const instanceCountCorrect = (tree, countObj, stage) => {
    Object.keys(countObj).forEach((name) =>
      ts.assertEquals(countObj[name], tree.node.instanceCount(name),
          `@stage=${stage} name=${name} incorrect instance count shouldCopy=${shouldCopy}`)
    );
  }

  function instanceCountObj(count, obj, two, three, six) {
    obj['over easy'] = count;
    obj['sunny side up'] = count;
    obj['scramble'] = count;
    obj['fried'] = count;
    obj['2'] = two;
    obj['3'] = three;
    obj['6'] = six;
    return obj;
  }
  const food = 1;
  const eggs = 1;
  const two = 1;
  const three = 1;
  const six = 1;
  const toast = 1
  const white = 1;
  const wheat = 1;
  const texas = 1;
  const milk = 1;
  const type = 1;
  const cheerios = 1;
  const life = 1;
  const onlyOneObj = instanceCountObj(1, {food, eggs}, 1, 0, 0);
  const now2Obj = instanceCountObj(2, {food, eggs}, 1, 1, 0);
  const now3Obj = instanceCountObj(3, {food, eggs}, 1, 1, 1);
  const allObj = instanceCountObj(3, {food,eggs,toast,white,wheat,texas,milk,type,cheerios,life}, 1, 1, 1);
  const testFuncs = {
    onlyOne: (tree, stage) =>  instanceCountCorrect(tree, onlyOneObj, stage),
    now2: (tree, stage) =>  instanceCountCorrect(tree, now2Obj, stage),
    now3: (tree, stage) =>  instanceCountCorrect(tree, now3Obj, stage),
    all: (tree, stage) =>  instanceCountCorrect(tree, allObj, stage),
  }
  createTree(undefined, undefined, shouldCopy, testFuncs)
  ts.success();
}

function forPathTest(ts, shouldCopy) {
    function verifyCost(choices, expectedCost) {
      const tree = createTree(undefined, undefined, shouldCopy);
      const keys = Object.keys(choices);
      keys.forEach((key) => tree.setChoice(key, choices[key]));
      const data = tree.forPath((wrapper, cost) => {
        cost = cost || 0;
        const payload = wrapper.payload();
        if (payload.cost) cost += payload.cost;
        if (payload.multiplier) cost *= payload.multiplier;
        return cost;
      });
      let total = 0;
      data.forEach((cost) => total += cost);
      ts.assertEquals(Math.round(total * 100) / 100, expectedCost);
    }

    verifyCost({food: {bacon: true}}, 1.21)
    verifyCost({food: {bacon: false, eggs: false, cereal:true},
                type: 'life'}, 10.46);
    verifyCost({food: {bacon: true, eggs: true},
                eggs: '2', '2': 'fried'}, 2.51)
    verifyCost({food: {bacon: true, eggs: false, cereal:true},
                eggs: '2', '2': 'fried', type: 'life'}, 11.67);
    verifyCost({food: {bacon: true, eggs: true, cereal:true, toast: true},
                eggs: '6', '6': 'sunny side up', type: 'life', toast: 'wheat'}, 15.51);
    ts.success();
}

function forPathReverseTest(ts, shouldCopy) {
      function verifyCost(choices, expectedCost) {
        const tree = createTree(true, undefined, shouldCopy);
        const keys = Object.keys(choices);
        keys.forEach((key) => tree.setChoice(key, choices[key]));
        const data = tree.forPath((wrapper, cost) => {
          cost = cost || 0;
          const payload = wrapper.payload();
          if (payload.cost) cost += payload.cost;
          if (payload.multiplier) cost *= payload.multiplier;
          return cost;
        }, true);
        let total = 0;
        data.forEach((cost) => total += cost);
        ts.assertEquals(Math.round(total * 100) / 100, expectedCost);
      }

      verifyCost({food: {bacon: true}}, 1.21)
      verifyCost({food: {bacon: false, eggs: false, cereal:true},
                  type: 'life'}, 10.46);
      verifyCost({food: {bacon: true, eggs: true},
                  eggs: '2', '2': 'fried'}, 3.81)
      verifyCost({food: {bacon: true, eggs: true},
                  eggs: '3', '2': 'fried'}, 5.11)
      verifyCost({food: {bacon: true, eggs: true},
                  eggs: '6', '2': 'fried'}, 1.21)
      verifyCost({food: {bacon: true, eggs: true},
                  eggs: '6', '6': 'scramble'}, 20.41)
      verifyCost({food: {bacon: true, eggs: false, cereal:true},
                  eggs: '2', '2': 'fried', type: 'life'}, 11.67);
      verifyCost({food: {bacon: true, eggs: true, cereal:true, toast: true},
                  eggs: '6', '6': 'sunny side up', type: 'life', toast: 'wheat'}, 28.51);
      ts.success();
}

function leavesTest(ts, shouldCopy) {
      function verifyCost(choices, expectedCost) {
        const tree = createTree(undefined, undefined, true);
        const keys = Object.keys(choices);
        keys.forEach((key) => tree.setChoice(key, choices[key]));
        let total = 0;
        tree.leaves().forEach((wrapper) => {
          const payload = wrapper.payload();
          if (payload.cost) total += payload.cost;
        });
        ts.assertEquals(Math.round(total * 100) / 100, expectedCost);
      }

      verifyCost({food: {bacon: true}}, 1.21)
      verifyCost({food: {bacon: false, eggs: false, cereal:true},
                  type: 'life'}, 10.46);
      verifyCost({food: {bacon: true, eggs: true},
                  eggs: '2', '2': 'fried'}, 2.51)
      verifyCost({food: {bacon: true, eggs: false, cereal:true},
                  eggs: '2', '2': 'fried', type: 'life'}, 11.67);
      verifyCost({food: {bacon: true, eggs: true, cereal:true, toast: true},
                  eggs: '6', '6': 'sunny side up', type: 'life', toast: 'wheat'}, 15.51);
      ts.success();
}

function getNodeByPathTest(ts, shouldCopy) {
  const tree = createTree(undefined, undefined, shouldCopy)

  const fried2 = tree.root().node.next('food').next('eggs').next('2').next('fried');
  const fried3 = tree.root().node.next('food').next('eggs').next('3').next('fried');
  const fried6 = tree.root().node.next('food').next('eggs').next('6').next('fried');

  const friedBy2 = tree.node.getNodeByPath('food', 'eggs', '2', 'fried');
  const friedBy3 = tree.node.getNodeByPath('food', 'eggs', '3', 'fried');
  const friedBy6 = tree.node.getNodeByPath('food', 'eggs', '6', 'fried');

  ts.assertEquals(fried2, friedBy2);
  ts.assertEquals(fried3, friedBy3);
  ts.assertEquals(fried6, friedBy6);

  ts.assertNotEquals(fried2, friedBy3);
  ts.assertNotEquals(fried2, friedBy6);
  ts.assertNotEquals(fried3, friedBy2);
  ts.assertNotEquals(fried3, friedBy6);
  ts.assertNotEquals(fried6, friedBy2);
  ts.assertNotEquals(fried6, friedBy3);

  ts.success();
}

function removeTest(ts, shouldCopy) {
    const tree = createTree(null, null, shouldCopy);
    function checkNodeCounts(tree, nodeCounts) {
      Object.keys(nodeCounts).forEach((key) =>
          ts.assertEquals(nodeCounts[key], tree.node.instanceCount(key),
            `RemoveTest Failed: incorrect instance count for ${key}`));
    }
    function nodeCounts(overwrites, eggTypeCount, nuke) {
      overwrites = overwrites || {};
      function overVal(id, def) {
        return overwrites[id] !== undefined ? overwrites[id] :
                                (nuke !== undefined ? nuke : def);
      }
      return {
        food: overVal("food", 1),
        eggs: overVal("eggs", 1),
        '2': overVal("2", 1),
        '3': overVal("3", 1),
        '6': overVal("6", 1),
        toast: overVal("toast", 1),
        white: overVal("white", 1),
        wheat: overVal("wheat", 1),
        texas: overVal("texas", 1),
        milk: overVal("milk", 1),
        type: overVal("type", 1),
        cheerios: overVal("cheerios", 1),
        life: overVal("life", 1),

        scramble: overVal("scramble", eggTypeCount || 3),
        fried: overVal("fried", eggTypeCount || 3),
        "sunny side up": overVal("sunny side up", eggTypeCount || 3),
        "over easy": overVal("over easy", eggTypeCount || 3)
      }
    }

    try {
      tree.node.addState('food', {hello: 'world'});
      ts.fail();
    } catch (e) {}

    checkNodeCounts(tree, nodeCounts());
    tree.node.getNodeByPath('food', 'eggs', '3', 'fried').remove();
    checkNodeCounts(tree, nodeCounts({fried: 2}));
    tree.node.getNodeByPath('food', 'eggs', '3').remove();
    checkNodeCounts(tree, nodeCounts({'3': 0}, 2))
    tree.node.getNodeByPath('food', 'eggs', '2').remove();
    checkNodeCounts(tree, nodeCounts({'3': 0, '2': 0}, 1))
    tree.node.getNodeByPath('food').remove();
    checkNodeCounts(tree, nodeCounts(undefined, undefined, 0));
    ts.assertEquals(tree.node.instanceCount('dishes'), 1);

    const msg = 'hello world';
    const payload = {msg};
    tree.node.addState('food', payload);
    tree.node.then('food');
    const food = tree.node.getNodeByPath('food');
    ts.assertEquals(Object.keys(food.payload()).length, 2);
    ts.assertEquals(food.payload().msg, msg);

    ts.success();
}

function attachTreeTest(ts) {
  const orderTree = createTree();
  const origLeaves = orderTree.node.leaves();
  let leaveCount = origLeaves.length;
  const drinkTree = new LogicTree(String.random());

  const type = drinkTree.select('drink type');
  type.select('alcholic').leaf('beer');
  type.select('non alcholic').leaf('soda');
  orderTree.attachTree(drinkTree);
  let newLeaves = orderTree.node.leaves();
  ts.assertEquals(leaveCount + 2, newLeaves.length)
  leaveCount = newLeaves.length;

  const eggs = orderTree.getByPath('food', 'eggs');
  const nonAlcholic = orderTree.getByPath('drink type', 'non alcholic');
  nonAlcholic.attachTree(eggs);
  newLeaves = orderTree.node.leaves();
  ts.assertEquals(leaveCount + 12, newLeaves.length)
  leaveCount = newLeaves.length;

  const milk = orderTree.getByPath('food', 'cereal', 'milk');
  nonAlcholic.attachTree(milk);
  newLeaves = orderTree.node.leaves();
  ts.assertEquals(leaveCount + 1, newLeaves.length)

  milk.attachTree(nonAlcholic);

  ts.success();
}

Test.add('LogicTree structure', (ts) => {
  LogicTest(createTree(), ts);
});
Test.add('LogicTree structure (copy)', (ts) => {
  LogicTest(createTree(undefined, undefined, true), ts);
});

Test.add('LogicTree getNodeByPath', (ts) => {
  getNodeByPathTest(ts);
});
Test.add('LogicTree getNodeByPath (copy)', (ts) => {
  getNodeByPathTest(ts, true);
});

Test.add('LogicTree remove', (ts) => {
  removeTest(ts);
});
Test.add('LogicTree remove (copy)', (ts) => {
  removeTest(ts, true);
});

Test.add('LogicTree decisions', (ts) => {
  decisionsTest(ts);
});
Test.add('LogicTree decisions (copy)', (ts) => {
  decisionsTest(ts, true);
});

Test.add('LogicTree isComplete (optional)', (ts) => {
  optionalTest(ts);
});
Test.add('LogicTree isComplete (optional & copy)', (ts) => {
  optionalTest(ts,true);
});

Test.add('LogicTree isComplete (!optional)', (ts) => {
  notOptionalTest(ts);
});
Test.add('LogicTree isComplete (!optional & copy)', (ts) => {
  notOptionalTest(ts, true);
});

Test.add('LogicTree forPath (forward)', (ts) => {
  forPathTest(ts);
});
Test.add('LogicTree forPath (forward & copy)', (ts) => {
  forPathTest(ts, true);
});

Test.add('LogicTree forPath (reverse)', (ts) => {
  forPathReverseTest(ts);
});
Test.add('LogicTree forPath (reverse & copy)', (ts) => {
  forPathReverseTest(ts, true);
});

Test.add('LogicTree leaves', (ts) => {
  leavesTest(ts);
});
Test.add('LogicTree leaves (copy)', (ts) => {
  leavesTest(ts, true);
});

Test.add('LogicTree instanceCount', (ts) => {
  instanceCountTest(ts);
});
Test.add('LogicTree instanceCount (copy)', (ts) => {
  instanceCountTest(ts, true);
});

Test.add('LogicTree attachTree', (ts) => {
  attachTreeTest(ts);
});
Test.add('LogicTree attachTree (copy)', (ts) => {
  attachTreeTest(ts, true);
});

Test.add('LogicTree change', (ts) => {
  let tree = createTree();
  const food = tree.getByPath('food');
  const needPlate = tree.getByPath('dishes', 'need plate');
  food.node.change('needPlate');
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
