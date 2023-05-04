
require('../../object/json-utils');
const Test = require('../test.js').Test;

Test.add('Object: filter/merge',(ts) => {
  const assertFunc = (assert, func) => (v) => assert(func(v));
  const notObject = (value) => !(value instanceof Object);
  const isObject = (value) => value instanceof Object;

  let obj = getObject();
  let merged = {};
  let isString = (v) => (typeof v) === 'string';
  let filtered = obj.filter(isString);
  filtered.foreach(assertFunc(ts.assertTrue, isString), notObject);
  obj.foreach(assertFunc(ts.assertFalse, isString), notObject);
  merged.merge(obj, filtered);
  ts.assertTrue(Object.equals(merged, getObject()));

  obj = getObject();
  merged = {};
  let isArray = (v) => Array.isArray(v);
  filtered = obj.filter(isArray);
  obj.foreach(assertFunc(ts.assertFalse, isArray));
  merged.merge(obj, filtered);
  ts.assertTrue(Object.equals(merged, getObject()));

  ts.success();
});


Test.add('JSON: deconstruct/reconstruct',(ts) => {
  const obj = getObject();

  let destc = JSON.deconstruct(obj);
  let cunst = JSON.reconstruct(destc);
  ts.assertTrue(Object.equals(obj, cunst));

  destc = JSON.deconstruct(obj, 10, 2);
  cunst = JSON.reconstruct(destc);
  ts.assertTrue(Object.equals(obj, cunst));

  destc = JSON.deconstruct(obj, 100, 2);
  cunst = JSON.reconstruct(destc);
  ts.assertTrue(Object.equals(obj, cunst));

  ts.success();
});


const getObject = () => {
  const eighteen = [];
  eighteen[98321] = 'Big Number';
  eighteen[9831] = 'Big Number';
  eighteen[983213] = 'Big Number';
  eighteen.a = 'Little Letter';
  const complexSparceAndBuried = [21,22,,23,[24,,25],[]];
  complexSparceAndBuried.fruits = 'pickles';
  complexSparceAndBuried.true = false;
  complexSparceAndBuried.integer = 2.448
  return {
    eighteen,
    one: ['a', 'ab', 'abcd', 'abcdefgh', 'abcd', 'ab', 'a'],
    two: 2,
    fifteen: undefined, // I defined undefined... sounds like nonsense.
    three: {
      four: 4,
      five: 'abcdefghijklmnop',
      six: 'abcdefghijklmnop',
      fourteen: false
    },
    seven: {
      eight: {
        nine: {
          thirteen: true,
          twenty: complexSparceAndBuried,
          ten: {
            eleven: {
              twelve: 12,
              sixteen: null,
              nineteen: 'booyackaa'
            }
          }
        }
      }
    }
  }
}
