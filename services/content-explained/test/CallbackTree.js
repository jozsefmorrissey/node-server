const testing = require('testing');

const { CallbackTree } = require('../services/callbackTree.js');

function timeout(name, argCount) {
  return function (success) {
    return function () {
      const args = arguments;
      function printName() {
        if (success) {
          args[argCount]();
        } else {
          args[argCount + 1]();
        }
      }
      const time = Math.floor(Math.random() * 200);
      setTimeout(printName, time);
    }
  }
}
const crud = {};
crud.exists = timeout('exists', 1);
crud.read = timeout('read', 2);
crud.write = timeout('write', 3);
crud.touch = timeout('touch', 1)
const dne = crud.exists(false);
const exists = crud.exists(true);
const cantTouch = crud.touch(false);
const canTouch = crud.touch(true);
const cantRead = crud.read(false);
const canRead = crud.read(true);
const cantWrite = crud.write(false);
const canWrite = crud.write(true);

const callbackError = new Error('Failed to follow callback tree');

function testPaths(testCallback) {
  let printCount = 0;
  const testTrees = {};
  function printPaths(key, expectedPath) {
    printCount++;
    const callback = testTrees[key];
    testing.assertEquals(callback.getLastPath(), expectedPath,
          `\ntestTree '${key}' faild to follow expectedPath.
                expected: ${expectedPath}
                followed: ${callback.getLastPath()}`, testCallback);
    testing.success(`\n\ttestTree ${key} succeeded!!!`);
    if (printCount === Object.keys(testTrees).length) testing.success('\n\tAll Tree Paths Passed!!!', testCallback);
  }

  let expectedPath = 'exists->cantRead->cantTouch->printPaths->';
  testTrees.accessDenied = new CallbackTree(exists, 'exists', 'dummy')
    .success(cantRead, 'cantRead', 'dummy', 'arg')
    .fail('cantRead', cantTouch, 'cantTouch', 'dummy')
    .fail('cantTouch', printPaths, undefined, 'accessDenied', expectedPath)

    .fail(callbackError, 'existsButShouldNot', 'filename')
    .success('cantRead', callbackError, 'readRestricted', 'dummy')
    .success('cantTouch', callbackError, 'touchRestricted', 'dummy');

  expectedPath = 'doesNotExist->canTouch->canWrite->canRead->printPaths->';
  testTrees.createWriteRead = new CallbackTree(dne, 'doesNotExist', 'dummy')
    .fail(canTouch, 'canTouch', 'dummy')
    .success('canTouch', canWrite, 'canWrite', 4, 'readRestricted', 'dummy')
    .success('canWrite', canRead, 'canRead', 4, 2)
    .success('canRead', printPaths, undefined, 'createWriteRead', expectedPath)

    .success(callbackError)
    .fail('canTouch', callbackError)
    .fail('canWrite', callbackError)
    .fail('canRead', callbackError);

  expectedPath = 'doesNotExist->exists->cantTouch->canTouch->cantRead->canRead->cantWrite->canWrite->printPaths->';
  testTrees.fullTrain = new CallbackTree(dne, 'doesNotExist', 'dummy')
    .fail(exists, 'exists', 'dummy')
    .success('exists', cantTouch, 'cantTouch', 4)
    .fail('cantTouch', canTouch, 'canTouch', 4)
    .success('canTouch', cantRead, 'cantRead', 4, 2)
    .fail('cantRead', canRead, 'canRead', 4, 2)
    .success('canRead', cantWrite, 'cantWrite', 5, 4, 2)
    .fail('cantWrite', canWrite, 'canWrite', 4, 2, 2)
    .success('canWrite', printPaths, 'printPaths', 'fullTrain', expectedPath)

    .success(callbackError)
    .fail('exists', callbackError)
    .success('cantTouch', callbackError)
    .fail('canTouch', callbackError)
    .success('cantRead', callbackError)
    .fail('canRead', callbackError)
    .success('cantWrite', callbackError)
    .fail('canWrite', callbackError);

  function executeTrees() {
    const keys = Object.keys(testTrees);
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      const tree = testTrees[key];
      tree.execute();
    }
  }

  executeTrees();
}

function argumentTest (testCallback) {
  function one(shouldSucceed, success, fail) {
    testing.assertEquals((typeof shouldSucceed), 'boolean');
    testing.assertEquals(success.cbTreeContext, 4);
    testing.assertEquals(fail.cbTreeContext, 4);
    if (shouldSucceed) {
      success('goto', 2);
    } else {
      fail()
    }
  }

  function two(goto, two, success, fail) {
    testing.assertEquals(goto, 'goto');
    testing.assertEquals(two, 2);
    testing.assertEquals(success.cbTreeContext, 4);
    testing.assertEquals(fail.cbTreeContext, 4);
    if (false) {
      success();
    } else {
      fail('fail', {msg: {msg:'goto'}}, 3)
    }
  }

  function three(goto, failStr, three, success, fail) {
    testing.assertEquals(goto, 'goto');
    testing.assertEquals(failStr, 'fail');
    testing.assertEquals(three, 3);
    testing.assertEquals(success.cbTreeContext, 4);
    testing.assertEquals(fail.cbTreeContext, 4);
    if (false) {
      success();
    } else {
      fail()
    }
  }

  function four(goto, failStr, soup, four, success, fail) {
    testing.assertEquals(goto, 'goto');
    testing.assertEquals(failStr, undefined);
    testing.assertEquals(soup, true);
    testing.assertEquals(four, 4);
    testing.assertEquals(success.cbTreeContext, 4);
    testing.assertEquals(fail.cbTreeContext, 4);
    testing.assertEquals(cbTree.getLastPath(), 'one->two->three->four->', testCallback);
    testing.success('\n\tAll Args Correct!!!', testCallback);
  }

  const cbTree = new CallbackTree(one, 'one', true)
    .setContext(4)
    .success(two, 'two')
    .fail('two', three, 'three', '$cbtArg[1].msg.msg', '$cbtArg[0]', 3)
    .fail('three', four, 'four', 'goto', '$cbtArg[0]', true, 4);
  cbTree.execute();
}

function testCustomPaths(testCallback) {
  let total = 0;
  function assertTotal() {
    testing.assertEquals(total, 1+2+3+4+5+6);
    testing.success(testCallback);
  }
  new CallbackTree(['one', 'two', 'three', 'four', 'five', 'six'],
        (one, two) => {total += 1; two()}, 'one')
        .two('one', (one, two, three) => {total += 2; three();}, 'two')
        .three('two', (one, two, three, four) => {total += 3; four();}, 'three')
        .four('three', (one, two, three, four, five, six) => {total += 4; six()}, 'five')
        .six('five', (one, two, three, four, five, six) => {total += 5; one()}, 'six')
        .one('six', () => {total += 6; assertTotal();})
        .execute();
}

testing.run([testPaths, argumentTest, testCustomPaths]);
