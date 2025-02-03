function safeStdLibAddition() {
  const addition = [];
  function verify() {
    additions.forEach((a) => {
      if ((a.static && a.lib[a.field] !== a.func) ||
      (!a.static && a.lib.prototype[a.field] !== a.func))
        throw new Error(`Functionality was overwritten -` +
                          `\n\tLibrary: ${a.lib}` +
                          `\n\tStatic: ${a.static}` +
                          `\n\tField: ${a.field}`)
    });
    delete additions;
  }
  function safeAdd (lib, field, func, static) {
    if (!static && lib.prototype[field] === undefined) {
      Object.defineProperty(lib.prototype, field, {
          value: func,
          writable: true,
          itterable: false
      });
    } else if (lib[field] === undefined)
      lib[field] = func;
    else
      console.error(`Attempting to overwrite functionality -` +
                        `\n\tLibrary: ${lib}` +
                        `\n\tStatic: ${static}` +
                        `\n\tField: ${field}`);
    addition.push({lib, field, func, static})
  }
  safeAdd(Function, 'safeStdLibAddition', safeAdd);
}
safeStdLibAddition();



Function.safeStdLibAddition(Function, 'AsyncRunIgnoreSuccessPrintError', function(afunc, args) {
  afunc(args).then(() => {}, (e) => console.error(e));
}, true);

Function.safeStdLibAddition(Function, 'Arguments', function() {
  const argumentReg = /^(function|)[^(]*?\(([^)]*?)\)\s*/;
  return this.toString().match(argumentReg)[2].split(/\s*,\s*/);
});

class EventFunction {
  constructor(event, list) {
    const add = (func, orderIndex) => {
      if (func instanceof Function) {
        if (event.triggered()) func(event.triggered());
        else {
          if (!Number.isFinite(orderIndex)) orderIndex = 0;
          list.push({func, orderIndex});
        }
      }
    }
    // TODO: I dont know how to define custom function classes....
    add.id = this.constructor.name;
    return add;
  }
}

class Event {
  constructor(name) {
    const list = [];
    let triggered = false;
    this.name = () => name;
    this.triggered = () => triggered;
    this.add = new EventFunction(this, list);
    this.trigger = (info) => {
      const run = !triggered;
      triggered = info;
      if (run) list.sortByAttr('orderIndex').forEach(fo => fo.func(info));
    }
    return ;
  }
}

Function.safeStdLibAddition(Function, 'event', (eventName, object, recursiveFilter) => {
  const eventFunc = new Event(eventName);
  if (recursiveFilter === true) recursiveFilter = () => true;
  const recursive = recursiveFilter instanceof Function;
  if(object[eventName] && object[eventName].id === 'EventFunction') object[eventName](eventFunc.trigger);
  const definition = {
      writable: true,
      enumerable: false,
      configurable: false,
      value: eventFunc.add
  };
  const define = (target) => {
    if (!recursive || recursiveFilter(target)) {
      Object.defineProperty(target, eventName, definition);
    }
    if (recursive) {
      const keys = Object.keys(target);
      for (let index = 0; index < keys.length; index++) {
        const child = target[keys[index]];
        if (child instanceof Object) define(child);
      }
    }
  }
  define(object);
  return eventFunc.trigger;
}, true);

Function.safeStdLibAddition(Function, 'orVal',  function (funcOrVal, ...args) {
  return (typeof funcOrVal) === 'function' ? funcOrVal(...args) : funcOrVal;
}, true);


const lastCallDelay = 1000;
const lastCallers = {};
function lastCall(callerId, delayOptional, ...args) {
  let delay = delayOptional;
  if (arguments.length === 1) {
    delay = lastCallDelay;
    args = [callerId];
  } else {
    if (!Number.isFinite(delay) || delay > 60000) {
      delay = delay;
      args = [delayOptional].concat(args);
    }
  }
  const id = String.random();
  lastCallers[callerId] = id;
  setTimeout(() => {
    if (id === lastCallers[callerId]) {
      this(...args);
    }
  }, delay);
}

const defaultInterval = 1000;
const lastTimeStamps = {};
function intervalFunction(callerId, intervalOptional, ...args) {
  let interval = intervalOptional;
  if (arguments.length === 1) {
    interval = defaultInterval;
    args = [callerId];
  } else {
    if (!Number.isFinite(interval) || interval > 60000) {
      interval = defaultInterval;
      args = [intervalOptional].concat(args);
    }
  }
  const lastTime = lastTimeStamps[callerId];
  const thisTime = new Date().getTime();
  if (lastTime === undefined || lastTime + interval < thisTime)
    this(...args);
  lastTimeStamps[callerId] = thisTime;
}

const logData = {};
function logarithmic(callerId, baseOptional, ...args) {
  let base = baseOptional;
  if (arguments.length === 1) {
    base = 10;
    args = [callerId];
  } else {
    if (!Number.isFinite(base) || base < 2) {
      base = 10;
      args = [baseOptional].concat(args);
    }
  }
  if (!logData[callerId]) logData[callerId] = {base};
  if (!logData[callerId].count) {
    logData[callerId].count  = 1;
    this(1 + '', ...args);
  } else {
    count = ++logData[callerId].count;
    const log = Math.log(count)/Math.log(logData[callerId].base);
    if (log === Math.roundTo(log)) this(count + '', ...args);
  }
}
logarithmic.reset = (callerId) => logData[callerId] && (logData[callerId].count = 0)

function periodic(callEveryMilSec, terminationTest, ...args) {
  let call;
  if (terminationTest instanceof Function) {
    call = () =>
      terminationTest() && this(...args) & setTimeout(call, callEveryMilSec)
  } else {
    args.splice(0,0,terminationTest);
    call = () => this(...args) && setTimeout(call, callEveryMilSec);
  }
  setTimeout(call, callEveryMilSec);
}

function progress(onProgress, ...args) {
  let call;
  if (terminationTest instanceof Function) {
    call = () =>
      terminationTest() && this(...args) & setTimeout(call, callEveryMilSec)
  } else {
    args.splice(0,0,terminationTest);
    call = () => this(...args) && setTimeout(call, callEveryMilSec);
  }
  setTimeout(call, callEveryMilSec);
}

Function.safeStdLibAddition(Function, 'subtle',   intervalFunction);
Function.safeStdLibAddition(Function, 'lastCall',   lastCall);
Function.safeStdLibAddition(Function, 'logarithmic',   logarithmic);
Function.safeStdLibAddition(Function, 'periodic',   periodic);

function HashCache(object, hashAttr, CacheLocation, hashChangeEvent) {
  if (!hashAttr) hashAttr = 'hash';
  CacheLocation = `${CacheLocation || '_HashCache'}.${hashAttr}`;
  const CacheId = `${CacheLocation}.${String.random()}`;
  let lastHash;
  const path = (...args) => `${CacheId}.${Object.hash(args)}`;
  if (hashChangeEvent) hashChangeEvent.on(() => object.pathValue(CacheLocation, {}));
  const func = (...args) => {
    const p = path(...args);
    const hash = object.pathValue(hashAttr);
    if (hash !== lastHash) object.pathValue(CacheLocation, {});
    if (object.pathValue(p) === undefined) {
      object.pathValue(p, this(...args));
      lastHash = object.pathValue(hashAttr);
    }
    return object.pathValue(p);
  };
  func.force = (...args) => {
    const info = object.pathInfo(path(...args));
    info.parent[info.attr] = undefined;
    return func(...args);
  }
  return func;
}
Function.safeStdLibAddition(Function, 'HashCache',   HashCache);
