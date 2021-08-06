
Error.stackInfo = (steps) => {
  steps = steps || 1;
  const err = new Error();
  const lines = err.stack.split('\n');
  const match = lines[steps].match(/at (([a-zA-Z\.]*?) |)(.*\.js):([0-9]{1,}):([0-9]{1,})/);;
  if (match) {
    return {
      filename: match[3].replace(/^\(/, ''),
      function: match[2],
      line: match[4],
      character: match[5]
    }
  }
}

Error.reducedStack = (steps) => {
  steps = steps || 1;
  const err = new Error();
  let lines = err.stack.split('\n');
  lines = lines.splice(steps);
  return `Error\n${lines.join('\n')}`;
}


class TestStatus {
  constructor(testName) {
    let assertT = 0;
    let assertC = 0;
    let success = false;
    let fail = false;
    function printError(msg) {
      console.log(`${msg}\n${Error.reducedStack(4)}`);
    }
    function assert(b) {
      assertT++;
      if (b) {
        assertC++;
        return true;
      }
      return false;
    }
    function successStr(msg) {
      console.log(`${testName} - Successfull (${assertC}/${assertT})${
          msg ? `\n\t\t${msg}` : ''}`);
    }
    this.assertTrue = (b, msg) => !assert(b) &&
                            printError(`'${b}' should be true`);
    this.assertFalse = (b, msg) => !assert(!b) &&
                            printError(`'${b}' should be false`);
    this.assertEquals = (a, b, msg) => !assert(a === b) &&
                            printError(`'${a}' === '${b}' should be true`);
    this.assertNotEquals = (a, b, msg) => !assert(a !== b) &&
                            printError(`'${a}' !== '${b}' should be true`);
    this.assertTolerance = (n1, n2, tol, msg) => {
      !assert(Math.abs(n1-n2) < tol) &&
      printError(`${n1} and ${n2} are not within tolerance ${tol}`);
    }
    this.fail = (msg) => {
      fail = true;
      printError(msg);
      throw new Error();
    };
    this.success = (msg) => (success = true) && successStr(msg);
  }
}

Test = {
  tests: {},
  add: (name, func) => {
    if ((typeof func) === 'function') {
      if (Test.tests[name] ===  undefined) Test.tests[name] = [];
      Test.tests[name].push(func);
    }
  },
  run: () => {
    const testNames = Object.keys(Test.tests);
    for (index = 0; index < testNames.length; index += 1) {
      const testName = testNames[index];
      try {
        Test.tests[testName].forEach((testFunc) => testFunc(new TestStatus(testName)));
      } catch (e) {
        console.log(e)
      }
    }
  }
}

afterLoad.push(() => Test.run());
