




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

Error.reducedStack = (msg, steps) => {
  steps = steps || 1;
  const err = new Error();
  let lines = err.stack.split('\n');
  lines = lines.splice(steps);
  return `Error: ${msg}\n${lines.join('\n')}`;
}

class ArgumentAttributeTest {
  constructor(argIndex, value, name, errorCode, errorAttribute) {
    function fail (ts, func, actualErrorCode, args) {
      ts.fail('AttributeTest Failed: use null if test was supposed to succeed' +
      `\n\tFunction: '${func.name}'` +
      `\n\tArgument Index: '${argIndex}'` +
      `\n\tName: '${name}'` +
      `\n\tValue: '${value}'` +
      `\n\tErrorCode: '${actualErrorCode}' !== '${errorCode}'`);
    }

    this.run = function (ts, func, args, thiz) {
      thiz = thiz || null;
      const testArgs = [];
      for (let index = 0; index < args.length; index += 1) {
        const obj = args[index];
        let arg;
        if (index === argIndex) {
          if (name) {
            arg = JSON.parse(JSON.stringify(obj));
            arg[name] = value;
          } else {
            arg = value;
          }
        }
        testArgs.push(arg);
      }
      try {
        func.apply(thiz, testArgs)
        if (errorCode || errorCode !== null) fail(ts, func, null, arguments);
      } catch (e) {
        errorAttribute = errorAttribute || 'errorCode';
        const actualErrorCode = e[errorAttribute];
        if (errorCode !== undefined &&
              (errorCode === null || actualErrorCode !== errorCode))
          fail(ts, func, actualErrorCode, arguments);
      }
    }
  }
}

class FunctionArgumentTestError extends Error {
  constructor(argIndex, errorAttribute) {
    super();
    this.message = 'errorCode should be null if no error thrown and undefined if no errorCode';
    if (argIndex === undefined) {
      this.message += '\n\targIndex must be defined.';
    }
    if (errorAttribute === undefined) {
      this.message += '\n\terrorAttribute must be defined.';
    }
  }
}

const failureError = new Error('Test Failed');

class FunctionArgumentTest {
  constructor(ts, func, args, thiz) {
    if (!(ts instanceof TestStatus))
      throw new Error('ts must be a valid instance of TestStatus');
    if ((typeof func) !== 'function')
      throw new Error("Function must be defined and of type 'function'");
    if (!Array.isArray(args) || args.length === 0)
      throw new Error("This is not a suitable test for a function without arguments");
    const funcArgTests = [];
    let argIndex, errorCode;
    let errorAttribute = 'errorCode';
    this.setIndex = (i) => {argIndex = i; return this;}
    this.setErrorCode = (ec) => {errorCode = ec; return this;}
    this.setErrorAttribute = (ea) => {errorAttribute = ea; return this};
    const hasErrorCode =  errorCode !== undefined;
    this.run = () => {
      funcArgTests.forEach((fat) => {
        fat.run(ts, func, args, thiz);
      });
      return this;
    }
    this.add = (name, value) =>  {
      if (errorAttribute === undefined || argIndex === undefined)
        throw new FunctionArgumentTestError(argIndex, errorAttribute);
      const at = new ArgumentAttributeTest(argIndex, value, name, errorCode, errorAttribute);
      funcArgTests.push(at);
      return this;
    }
  }
}

// ts for short
class TestStatus {
  constructor(testName) {
    let assertT = 0;
    let assertC = 0;
    let success = false;
    let fail = false;
    let failOnError = true;
    let instance = this;
    function printError(msg, stackOffset) {
      stackOffset = stackOffset || 4;
      console.error(`%c${Error.reducedStack(msg, stackOffset)}`, 'color: red');
    }
    function assert(b) {
      assertT++;
      if (b) {
        assertC++;
        TestStatus.successAssertions++;
        return true;
      }
      TestStatus.failAssertions++;
      return false;
    }
    function successStr(msg) {
      console.log(`%c ${testName} - Successfull (${assertC}/${assertT})${
          msg ? `\n\t\t${msg}` : ''}`, 'color: green');
    }
    const possiblyFail = (msg) => failOnError ? instance.fail(msg, 6) : printError(msg, 5);

    this.assertTrue = (b, msg) => !assert(b) &&
                            possiblyFail(`${msg}\n\t\t'${b}' should be true`);
    this.assertFalse = (b, msg) => !assert(!b) &&
                            possiblyFail(`${msg}\n\t\t'${b}' should be false`);
    this.assertEquals = (a, b, msg) => !assert(a === b) &&
                            possiblyFail(`${msg}\n\t\t'${a}' === '${b}' should be true`);
    this.assertNotEquals = (a, b, msg) => !assert(a !== b) &&
                            possiblyFail(`${msg}\n\t\t'${a}' !== '${b}' should be true`);
    this.assertTolerance = (n1, n2, tol, msg, stackOffset) => {
      !assert(Math.abs(n1-n2) < tol) &&
      possiblyFail(`${msg}\n\t\t${n1} and ${n2} are not within tolerance ${tol}`, stackOffset);
    }
    this.fail = (msg, stackOffset) => {
      fail = true;
      printError(msg, stackOffset);
      throw failureError;
    };
    this.success = (msg, stackOffset) => (success = true) && successStr(msg, stackOffset);
  }
}

TestStatus.successCount = 0;
TestStatus.failCount = 0;
TestStatus.successAssertions = 0;
TestStatus.failAssertions = 0;

const Test = {
  tests: {},
  add: (name, func) => {
    if ((typeof func) === 'function') {
      if (Test.tests[name] ===  undefined) Test.tests[name] = [];
      Test.tests[name].push(func);
    }
  },
  run: () => {
    const testNames = Object.keys(Test.tests);
    for (let index = 0; index < testNames.length; index += 1) {
      const testName = testNames[index];
      try {
        Test.tests[testName].forEach((testFunc) => testFunc(new TestStatus(testName)));
        TestStatus.successCount++;
      } catch (e) {
        TestStatus.failCount++;
        if (e !== failureError)
          console.log(`%c ${e.stack}`, 'color: red')
      }
    }
    const failed = (TestStatus.failCount + TestStatus.failAssertions) > 0;
    console.log(`\n%c Successfull Tests:${TestStatus.successCount} Successful Assertions: ${TestStatus.successAssertions}`, 'color: green');
    console.log(`%c Failed Tests:${TestStatus.failCount} Failed Assertions: ${TestStatus.failAssertions}`, !failed ? 'color:green' : 'color: red');
  }
}

exports.ArgumentAttributeTest = ArgumentAttributeTest;
exports.FunctionArgumentTestError = FunctionArgumentTestError;
exports.FunctionArgumentTest = FunctionArgumentTest;
exports.TestStatus = TestStatus;
exports.Test = Test;
