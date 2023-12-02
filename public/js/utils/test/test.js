




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

function round(value, accuracy) {
  if (accuracy === undefined) return value;
  return Math.round(value * accuracy) / accuracy;
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

    this.failed = () => fail;
    this.succeed = () => success;
    this.name = () => testName;

    let cleanUp;
    this.onCleanUp = (func) => cleanUp = func;
    this.cleanUp = () => (typeof cleanUp) === 'function' && cleanUp(this);

    function printError(msg, stackOffset) {
      stackOffset = stackOffset || 4;
      if (msg instanceof Error) console.error(msg);
      else console.error(`%c${Error.reducedStack(msg, stackOffset)}`, 'color: red');
    }
    function assert(b) {
      assertT++;
      if (b === true) {
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
    function failStr(msg) {
      console.log(`%c ${testName} - Failed (${assertC}/${assertT})${
          msg ? `\n\t\t${msg}` : ''}`, 'color: red');
    }
    const possiblyFail = (msg) => failOnError ? instance.fail(msg, 6) : printError(msg, 5);

    this.assertTrue = (b, msg) => assert(b) ||
                            possiblyFail(`${msg}\n\t\t'${b}' should be true`);
    this.assertFalse = (b, msg) => assert(b === false) ||
                            possiblyFail(`${msg}\n\t\t'${b}' should be false`);
    this.assertEquals = (a, b, msg, acc) => assert(round(a, acc) === round(b, acc)) ||
                            possiblyFail(`${msg}\n\t\t'${a}' === '${b}' should be true`);
    this.assertNotEquals = (a, b, msg, acc) => assert(round(a, acc) !== round(b, acc)) ||
                            possiblyFail(`${msg}\n\t\t'${a}' !== '${b}' should be true`);
    this.assertTolerance = (n1, n2, tol, msg, stackOffset) => {
      return assert(Math.abs(n1-n2) < tol) ||
      possiblyFail(`${msg}\n\t\t${n1} and ${n2} are not within tolerance ${tol}`, stackOffset);
    }
    this.fail = (msg, stackOffset) => {
      fail = true;
      failStr();
      printError(msg, stackOffset);
      Test.reportIn(this);
      throw failureError;
    };
    this.success = (msg, stackOffset) => {
      success = true;
      Test.reportIn(this);
      return successStr(msg, stackOffset);
    }
  }
}

TestStatus.successCount = 0;
TestStatus.failCount = 0;
TestStatus.successAssertions = 0;
TestStatus.failAssertions = 0;

const ran = {};
const Test = {
  tests: {},
  add: (name, func) => {
    if ((typeof func) === 'function') {
      if (Test.tests[name] ===  undefined) Test.tests[name] = [];
      Test.tests[name].push(func);
    }
  },
  list: () => Object.keys(Test.tests),
  count: () => Test.list().length,
  run: () => {
    const testNames = Object.keys(Test.tests);
    for (let index = 0; index < testNames.length; index += 1) {
      const testName = testNames[index];
      if (!ran[testName]) {
        const ts = new TestStatus(testName);
        try {
          Test.tests[testName].forEach((testFunc) => {
            const isAsync = testFunc.constructor.name === "AsyncFunction";
            if (isAsync) {
              testFunc(ts).then(() => {}, (e) =>
                ts.fail(e.stack || e.msg));
            } else {
              testFunc(new TestStatus(testName));
            }
          });
        } catch (e) {
          if (e !== failureError) try {ts.fail(e);} catch(e) {}
        }
        ran[testName] = true;
      }
    }
  },
  results: () => ({
    tests: {
      success: TestStatus.successCount,
      failed: TestStatus.failCount
    },
    asserts: {
      success: TestStatus.successAssertions,
      failed: TestStatus.failAssertions
    }
  }),
  printResults: (imPending) => {
    if (imPending !== true && pending) return;
    const res = Test.results();
    if (Object.equals(res, lastResults)) {
      pending = false;
      const failedColor = (res.tests.failed + res.asserts.failed) > 0 ? 'color:red' : 'color:green';
      console.log(`\n%c Successfull Tests:${res.tests.success} Successful Assertions: ${res.asserts.success}`, 'color: green');
      console.log(`%c Failed Tests:${res.tests.failed} Failed Assertions: ${res.asserts.failed}`, failedColor);
    } else {
      pending = true;
      lastResults = res;
      setTimeout(() => Test.printResults(true), 1000);
    }
  },
  allReportsIn: () => {
    const ranNames = Object.keys(ran).sort();
    const reportNames = Object.keys(reported).sort();
    return ranNames.equals(reportNames);
  },
  reportIn: (ts) => {
    if (reported[ts.name()]) throw new Error(`Test: '${ts.name()}' is double reporting.\n\t\tonly one call should be made to fail || success`);
    if (ts.failed() || !ts.succeed()) TestStatus.failCount++;
    else TestStatus.successCount++;
    Test.printResults();
    ts.cleanUp();
    //runCollectiveCleanup(); ... implement
  }
}
let lastResults;
let pending = false;
let reported = {};

exports.ArgumentAttributeTest = ArgumentAttributeTest;
exports.FunctionArgumentTestError = FunctionArgumentTestError;
exports.FunctionArgumentTest = FunctionArgumentTest;
exports.TestStatus = TestStatus;
exports.Test = Test;
