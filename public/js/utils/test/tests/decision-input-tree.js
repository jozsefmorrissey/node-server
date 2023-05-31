

// breakfast) Multiselect (food:bacon, eggs, toast, cereal)
//     eggs) Select (count:2,3,6), Select(type:overEasy, sunnySideUp, scrambled, fried)
//        requiresGourmetChef) upchange
//     toast) Select (white, wheat, texas)
//     cereal) Checkbox(milk), Select (type: rasinBrand, cheerios, life)
//     bacon) Leaf
//   dishes)
//      plate)
//      fork)
//      bowl)
//      spoon)


const Test = require('../test.js').Test;
const du = require('../../dom-utils');
const Input = require('../../input/input');
const Select = require('../../input/styles/select');
const DecisionInputTree = require('../../input/decision/decision');
const MultipleEntries = require('../../input/styles/multiple-entries');

const toastCost = .75;
const cerialCost = 2.25;
const baconCost = 1.20;
const eggsCost = 1.25;
const overEasyMultiplier = 25;

function createTree() {
  const bacon = new Input({type: 'checkbox', name: 'bacon'});
  const eggs = new Input({type: 'checkbox', name: 'eggs'});
  const eggCount = new Select({list: ['2','3','6'], name: 'count', mustChoose: true});
  const eggType = new Select({name: 'type', mustChoose: true, value: 'Scrambled', list: ['Over Easy', 'Sunny Side Up', 'Scrambled', 'Fried']});
  const toast = new Input({type: 'checkbox', name: 'toast'});
  const cereal = new Input({type: 'checkbox', name: 'cereal'});
  const toastType = new Select({name: 'type', mustChoose: true, list: ['white', 'wheat', 'texas']});
  const milk = new Input({type: 'checkbox', name: 'milk'});
  const cerealType = new Select({name: 'type', mustChoose: true, list: ['rasinBrand', 'cheerios', 'life']});

  const tree = new DecisionInputTree('breakfast', {inputArray: [bacon, eggs, toast, cereal]});

  const cost = (node) => eggsCost * Number.parseInt(node.find.input('count').value());
  const eggsNode = tree.root().then('Eggs', {cost});
  eggsNode.addInput(eggCount);
  eggsNode.addInput(eggType);
  const reqGourChef = eggsNode.then('requiresGourmetChef', {multiplier: overEasyMultiplier});
  const toastNode = tree.root().then('Toast', {cost: toastCost, inputArray: [toastType]});
  const cerealNode = tree.root().then('Cereal', {cost: cerialCost, inputArray: [cerealType]});
  tree.root().then('Bacon', {cost: baconCost});


  const dishes = tree.root().then('dishes');
  const plate = dishes.then('plate', {matirial: true});
  const fork = dishes.then('fork', {matirial: true});
  const bowl = dishes.then('bowl', {matirial: true});
  const spoon = dishes.then('spoon', {matirial: true});

  bowl.conditions.add((values) =>
    Object.pathValue(values, 'cereal') === true);

  cerealNode.conditions.add((values) =>
    Object.pathValue(values, 'cereal') === true);

  toastNode.conditions.add((values) =>
    Object.pathValue(values, 'toast') === true);

  eggsNode.conditions.add((values) =>
    Object.pathValue(values, 'eggs') === true);

  reqGourChef.conditions.add((values) =>
    values.type === "Over Easy");

  const vals = tree.values();

  return tree;
}

Test.add('DecisionInputTree structure', (ts) => {
  const tree = createTree();
  ts.success();
});

function simulateUserUpdate(input, value, tree, choiceCount, ts) {
  const inputElem = du.create.element('input', {id: input.id(), value});
  document.body.append(inputElem);
  inputElem.click();
  inputElem.remove();
  choices = tree.choices();
  ts.assertEquals(choices.length, choiceCount);
  ts.assertEquals(tree.isComplete(), choiceCount === 0);
}

function cost(tree) {
  const leaves = tree.root().leaves();
  let grandTotal = 0;
  for (let index = 0; index < leaves.length; index++) {
    let total = 0;
    leaves[index].forPath((node) => {
      const payload = node.payload();
      if (payload.cost) {
        total += (typeof payload.cost) === 'function' ? payload.cost(node) : payload.cost;
      }
      if (payload.multiplier) {
        total *= payload.multiplier;
      }
    });
    grandTotal += total;
  }
  return grandTotal;
}

function matirials(tree) {
  const leaves = tree.root().leaves();
  let mats = [];
  for (let index = 0; index < leaves.length; index++) {
    leaves[index].forPath((node) => {
      const payload = node.payload();
      if (payload.matirial) {
        mats.push(node.name());
      }
    });
  }
  return mats;
}


Test.add('DecisionInputTree choices', (ts) => {
  const toastCost = .75;
  const cerialCost = 2.25;
  const baconCost = 1.20;
  const eggsCost = 1.25;
  const overEasyMultiplier = 25;

  const justEggsCost = eggsCost * 6 * overEasyMultiplier;
  const total = justEggsCost + toastCost + baconCost + cerialCost;

  const tree = createTree();
  let choices = tree.choices();
  ts.assertEquals(choices.length, 0);

  const eggs = tree.find.input('eggs')
  eggs.setValue(true)
  choices = tree.choices();
  ts.assertEquals(choices.length, 2);

  const toast = tree.find.input('toast')
  toast.setValue(true)
  choices = tree.choices();
  ts.assertEquals(choices.length, 3);

  const noBowl = ['plate', 'fork', 'spoon'];
  ts.assertTrue(noBowl.equals(matirials(tree)));

  const cereal = tree.find.input('cereal')
  cereal.setValue(true)
  choices = tree.choices();
  ts.assertEquals(choices.length, 4);


  const count = tree.find.input('count', 'Eggs');
  const type = tree.find.input('type', 'Eggs');
  const eggsType = tree.find.input('type', 'Eggs');
  const toastType = tree.find.input('type', 'Toast');
  const cerialType = tree.find.input('type', 'Cereal');

  ts.assertNotEquals(type, undefined);
  ts.assertNotEquals(eggsType, toastType);
  ts.assertNotEquals(eggsType, cerialType);
  ts.assertNotEquals(cerialType, toastType);

  simulateUserUpdate(eggsType, 'Over Easy', tree, 3, ts);
  simulateUserUpdate(toastType, 'white', tree, 2, ts);
  simulateUserUpdate(cerialType, 'cheerios', tree, 1, ts);
  simulateUserUpdate(count, '6', tree, 0, ts);

  const allMaterials = ['plate', 'fork', 'bowl', 'spoon'];
  ts.assertTrue(allMaterials.equals(matirials(tree)));

  ts.assertEquals(cost(tree), total);

  ts.success();
});
