Math.PI12 = Math.PI/2;
Math.PI32 = 3*Math.PI/2;
Math.PI2 = 2*Math.PI;

Math.PI14 = Math.PI/4;
Math.PI34 = 3*Math.PI/4;
Math.PI54 = 5*Math.PI/4;
Math.PI74 = 7*Math.PI/4;

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

Function.safeStdLibAddition(Object, 'definedPropertyNames', function(object) {
  const names = [];
  for (var key in object) names.push(key);
  return names;
}, true);

Function.safeStdLibAddition(Boolean, 'is', (boolean) =>
    (typeof boolean) === 'boolean' || boolean instanceof Boolean, true);
Function.safeStdLibAddition(Boolean, 'first', (...booleans) => booleans.find(b => Boolean.is(b)), true);

// TODO: implement depth first search... I cant remember needing it so not worth my time
Function.safeStdLibAddition(Object, 'linkListFind', function(attr, is) {
  let toSearch = [this];
  let index = 0;
  while(index < toSearch.length && !is(curr = toSearch[index])) {
    objOArr = curr.pathValue(attr);
    if (objOArr) {
      if (Array.isArray(objOArr)) toSearch.concatInPlace(objOArr);
      else toSearch.push(objOArr);
    }
    index++;
  }
  return toSearch[index];
});


const isNotUndefined = (key, obj) => obj[key] !== undefined;
Function.safeStdLibAddition(Object, 'defined', function(...keys) {
  let condition = isNotUndefined;
  if (keys[0] instanceof Object) {
    const conditionMap = keys[0];
    keys = Object.keys(conditionMap);
    condition = (key) =>
      conditionMap[key](this[key]);
  }
  for (var index in keys) if (!condition(keys[index], this)) return false;
  return true;
});

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

// Stole this from: https://stackoverflow.com/a/71115598
// was useful in finding a data leak
function roughSizeOfObject(object) {
  const objectList = [];
  const stack = [object];
  const bytes = [0];
  while (stack.length) {
    const value = stack.pop();
    if (value == null) bytes[0] += 4;
    else if (typeof value === 'boolean') bytes[0] += 4;
    else if (typeof value === 'string') bytes[0] += value.length * 2;
    else if (typeof value === 'number') bytes[0] += 8;
    else if (typeof value === 'object' && objectList.indexOf(value) === -1) {
      objectList.push(value);
      if (typeof value.byteLength === 'number') bytes[0] += value.byteLength;
      else if (value[Symbol.iterator]) {
        // eslint-disable-next-line no-restricted-syntax
        for (const v of value) stack.push(v);
      } else {
        Object.keys(value).forEach(k => {
           bytes[0] += k.length * 2; stack.push(value[k]);
        });
      }
    }
  }
  return bytes[0];
}

Function.safeStdLibAddition(Object, 'sizeOf', roughSizeOfObject);

function arraySet(array, values, start, end) {
  if (start!== undefined && end !== undefined && start > end) {
    const temp = start;
    start = end;
    end = temp;
  }
  start = start || 0;
  end = end || values.length;
  for (let index = start; index < end; index += 1)
    array[index] = values[index];
  return array;
}

Function.safeStdLibAddition(Array, 'set',   arraySet, true);
Function.safeStdLibAddition(Array, 'set',   function (values, start, end) {return arraySet(this, values, start, end)});

Function.safeStdLibAddition(Array, 'copy',   function (other) {
  if (Array.isArray(other)) {
    this.deleteAll();
    this.merge(other, false);
  } else {
    const newArr = [];
    newArr.merge(this, false);
    return newArr;
  }
});

Function.safeStdLibAddition(Array, 'filterSplit',   function (filter, truthy) {
  const retVal = {};
  for (let index = 0; index < this.length; index++) {
    let path = filter(this[index]);
    if (truthy === true) path = path && true;
    if (retVal.pathValue(path) === undefined) retVal.pathValue(path, []);
    retVal.pathValue(path).push(this[index]);
  }
  return retVal;
});

Function.safeStdLibAddition(Array, 'idMap',   function (idFunc) {
  const retVal = {};
  for (let index = 0; index < this.length; index++) {
    let id = idFunc(this[index]);
    retVal[id] = this[index];
  }
  return retVal;
});


Function.safeStdLibAddition(JSON, 'copy',   function  (obj) {
  if (!(obj instanceof Object)) return obj;
  return JSON.parse(JSON.stringify(obj));
}, true);

function processValue(value) {
  let retVal;
  if ((typeof value) === 'object' && value !== null) {
    if (value.toJson) {
      retVal = value.toJson();
    } else if (value.toJSON) {
      retVal = value.toJSON();
    } else if (value.constructor.toJson) {
      retVal = value.constructor.toJson(value);
    } else if (Array.isArray(value)){
      const arr = [];
      value.forEach((val) => arr.push(processValue(val)));
      retVal = arr;
    } else {
      const keys = Object.keys(value);
      const obj = {};
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        obj[key] = processValue(value[key]);
      }
      retVal = obj;
    }
  } else {
    retVal = value;
  }
  return retVal;
}

// TODO: make moore efficient... dis es terible
Function.safeStdLibAddition(Array, 'unique', function (attrFunc) {
  if (!(attrFunc instanceof Function)) attrFunc = (e) => e;
  return this.filter((() => {let found = []; return (e) => found.indexOf(attrFunc(e)) === -1 && (found.push(attrFunc(e)) || e);})());
});

Function.safeStdLibAddition(Array, 'equals', function (other, startIndex, endIndex) {
    startIndex =  startIndex > -1 ? startIndex : 0;
    endIndex = endIndex < this.length ? endIndex : this.length;
    if (endIndex < other.length) return false;
    let equal = true;
    for (let index = startIndex; equal && index < endIndex; index += 1) {
      const elem = this[index];
      if (elem && (typeof elem.equals) === 'function') {
        if (!elem.equals(other[index])) {
          return index;
        }
      } else if (!Object.equals(elem, other[index])) {
        equal = false;
      }
    }
    return equal;
});

Function.safeStdLibAddition(String, 'random',  function (len) {
    len = len || 7;
    let str = '';
    while (str.length < len) str += Math.random().toString(36).substr(2);
    return str.substr(0, len);
}, true);


const compoundReg = /^(.*)\(([^)]{1,}?)\)(.*)$/
Function.safeStdLibAddition(String, 'paths',  function (len) {
    const paths = [];
    if (this.match(compoundReg) === null) return [this];
    const compoundAttrs = [this];
    while(compoundAttrs.length > 0) {
      const ca = compoundAttrs[compoundAttrs.length - 1];
      let match = ca.match(compoundReg);
      if (match === null) {
        paths.push(ca);
        compoundAttrs.pop();
      } else {
        compoundAttrs.pop();
        const split = match[2].split(',');
        split.forEach(v => {
          const attr = match[1] + v + match[3];
          compoundAttrs.push(attr);
        });
      }
    }
    return paths;
});


// const specialRegChars = /[-[\]{}()*+?.,\\^$|#\\s]/g;
// TODO: Removed \\s not sure if its the right move
const specialRegChars = /[-[\]{}()*+?.,\\^$|#]/g;
Function.safeStdLibAddition(RegExp, 'escape',  function (str) {
  return str.replace(specialRegChars, '\\$&');
}, true);

Function.safeStdLibAddition(RegExp, 'g',  function (str) {
  if (!this.GLOBAL)
    this.property('GLOBAL', new RegExp(this.source, 'g'), false, false, false);
  return this.GLOBAL;
});


Function.safeStdLibAddition(RegExp, 'object',  function (string, ...keys) {
  const match = string.match(this);
  if (match === null) return null;
  const returnVal = {};
  for (let index = 0; index < keys.length; index += 1) {
    const attr = keys[index];
    if (attr && match[index + 1]) returnVal[attr] = match[index + 1];
  }
  return returnVal;
});

Function.safeStdLibAddition(String, 'replaceIterativly',  function (exp, replace) {
  let str = this;
  let next;
  while ((next = str.replace(exp, replace)) !== str) str = next;
  return str;
});

Function.safeStdLibAddition(String, 'count',  function (needle, length) {
  const clean = RegExp.escape(this.substring(0, length));
  const reg = new RegExp(`[^${RegExp.escape(needle)}]`, 'g');
  return clean.replace(reg, '').length
});


const decimalRegString = "((-|)(([0-9]{1,}\\.[0-9]{1,})|[0-9]{1,}(\\.|)|(\\.)[0-9]{1,}))";
const decimalReg = new RegExp(`^${decimalRegString}$`);
Function.safeStdLibAddition(String, 'isNumber', function (len) {
  return this.trim().match(decimalReg) !== null;
});

const npiweblt = 'No Positive Integer (lt 10) Will Ever Be Less Than 0 (Duh)';
const npiwebgt = 'No Positive Integer (lt 10) Will Ever Be Greater Than 9 (Duh)';
const lessThanRegSingle = (int) => int >= 0 ? `[0-${int}]` : npiweblt;
const greaterThanRegSingle = (int) => int <= 9 ? `[${int}-9]` : npiwebgt;
const lessThanFormat = (prefix, leadInt, length) => {
  const lessButSameLength = leadInt !== 0 ? `|[0-${leadInt - 1}][0-9]{${length-1}}` : ''
  return `(${prefix}${lessButSameLength}|[0-9]{0,${length-1}})`;
}
const greaterThanFormat = (prefix, leadInt, length) => {
  const greaterButSameLength = leadInt !== 9 ? `|[${leadInt + 1}-9][0-9]{${length-1}}` : ''
  return `(${prefix}${greaterButSameLength}|[1-9][0-9]{${length},})`;
}

const integerCompareReg = (lessThan, equalTo) => (integer, asString) => {
  lessThan = lessThan === true;
  const ints = (integer + '').split('');
  const compareFunc = lessThan ? lessThanRegSingle : greaterThanRegSingle;
  const compareOffset = lessThan ? -1 : 1;
  let offset = equalTo === true ? 0 : compareOffset;
  let leadInt;
  let reg = '';
  let endOrVals = [];
  let secondToLast;
  let singleDigit = ints.length === 1;
  for (let index = 0; index < ints.length; index++) {
    const int = Number.parseInt(ints[index]);
    if (index === 0) leadInt = int;
    const str = index === ints.length - 1 ? compareFunc(int + offset) : compareFunc(int);
    if (index === ints.length - 2) secondToLast = int;
    const lastTwo = index > ints.length - 3;
    if (!singleDigit && lastTwo && ((!lessThan && secondToLast !== 9) || (lessThan && secondToLast !== 0))) {
      endOrVals.push(str);
      const orValue = index !== ints.length - 1 ? compareFunc(int + compareOffset) : '[0-9]';
      endOrVals.push(orValue);
    } else reg += str;
  }
  if (endOrVals.length !== 0) {
    reg = `${reg}(${endOrVals[0]}${endOrVals[2]}|${endOrVals[1]}${endOrVals[3]})`;
  }
  reg = (lessThan ? lessThanFormat : greaterThanFormat)(reg, leadInt, ints.length);
  return asString ? reg : new RegExp(`^${reg}$`);
}

Function.safeStdLibAddition(String, 'reverse', function () {
  return this.split('').reverse().join('');
});

Function.safeStdLibAddition(String, 'splice', function (startIndex, length, replaceWith) {
  if ((typeof length) === 'string') {
    replaceWith = length; length = this.length;
  }
  return this.substring(0, startIndex) + (replaceWith || '') + this.substring(startIndex + length, this.length);
});


function foreachStringSection (str, func, opening, closing, index = 0) {
  const openFunc = (typeof opening) === 'string' ? 'indexOf' : 'search';
  const closeFunc = (typeof closing) === 'string' ? 'indexOf' : 'search';
  const openStack = [];
  let closedMatch;
  let closedIndex = 0;
  while (closedMatch = str.substring(closedIndex).match(closing)) {
    closedIndex = closedMatch.index + closedIndex + closedMatch[0].length;
    do {
      const match = str.substring(index).match(opening);
      if (match === null) break;
      const i = match.index + index;
      if (i >= closedIndex) break;
      openStack.push({index: i, match});
      index = i + 1;
    } while (true);
    if (openStack.length === 0) continue;
    const openDets = openStack.pop();
    const openIndex = openDets.index;
    const openMatch = openDets.match;
    const details = {openIndex, closedIndex, str, openMatch, closedMatch}
    const change = func(str.substring(openIndex, closedIndex), details);
    if ((typeof change) === 'string') {
      str = str.splice(openIndex, closedIndex - openIndex, change);
      closedIndex = openIndex + change.length;
    }
    index = closedIndex;
  }
  return str + '';
}

Function.safeStdLibAddition(String, 'foreachSection', function (...args) {return foreachStringSection(this, ...args)});

Function.safeStdLibAddition(RegExp, 'reverse', function() {
  return this.source.reverse();
});

const openReg = /(?<!(^|[^\\])\\(\\\\)*)\(/;
const closeReg = /(?<!(^|[^\\])\\(\\\\)*)\)/;
const ignoreReg = /\((?=\?)/;
Function.safeStdLibAddition(RegExp, 'matchless', function () {
  const matchlessSource = this.source.foreachSection((section, dets) =>
    dets.str.substring(dets.openIndex - 1, dets.openIndex + 2).match(ignoreReg) ?
      null : section.splice(1,0,'?:'), openReg, closeReg);
  return new RegExp(matchlessSource);
});

Function.safeStdLibAddition(RegExp, 'mls', function () {
  const matchlessSource = this.source.foreachSection((section, dets) =>
    dets.str.substring(dets.openIndex - 1, dets.openIndex + 2).match(ignoreReg) ?
      null : section.splice(1,0,'?:'), openReg, closeReg);
  return matchlessSource;
});

Function.safeStdLibAddition(RegExp, 'lessThan', integerCompareReg(true, false), true);
Function.safeStdLibAddition(RegExp, 'greaterThan',  integerCompareReg(false, false), true);
Function.safeStdLibAddition(RegExp, 'lessThanEqual',  integerCompareReg(true, true), true);
Function.safeStdLibAddition(RegExp, 'greaterThanEqual',  integerCompareReg(false, true), true);
const evenReg = '[0-9]*[02468](?![0-9])';
Function.safeStdLibAddition(RegExp, 'even', (asString) => asString ? evenReg : new RegExp(`${evenReg}`));
const oddReg = '[0-9]*[13579](?![0-9])';
Function.safeStdLibAddition(RegExp, 'odd', (asString) => asString ? oddReg : new RegExp(`${oddReg}`));
Function.safeStdLibAddition(RegExp, 'toObject',  function (str) {
  const match = str.match(this);
  if (match === null) return null;
  const returnVal = {};
  for (let index = 1; index < arguments.length; index += 1) {
    const attr = arguments[index];
    if (attr) returnVal[attr] = match[index];
  }
  return returnVal;
}, false);


const test = (testUpTo, funcName, test) => {
  for (let value = 0; value < testUpTo; value++) {
    for (let index = 0; index < 100; index++) {
      try {
        if (!test(index, value, `${index}`.match(RegExp[funcName](value)))) {
          throw new Error('FAILED!!!');
        }
      } catch (e) {
        console.log(`'${index}'.match(RegExp.${funcName}(${value})); //Failed`);
        RegExp[funcName](value);
        break;
      }
    }
  }
}

Function.safeStdLibAddition(String, 'number',  function (str) {
  str = new String(str);
  const match = str.match(/([0-9]).([0-9]{1,})e\+([0-9]{2,})/);
  if (match) {
    const zeros = Number.parseInt(match[3]) - match[2].length;
    str = match[1] + match[2] + new Array(zeros).fill('0').join('');
  }
  return new String(str)
      .split('').reverse().join(',')
      .replace(/([0-9]),([0-9]),([0-9]),/g, '$1$2$3,')
      .replace(/,([0-9]{1,2}),/g, ',$1')
      .replace(/,([0-9]{1,2}),/g, ',$1')
      .split('').reverse().join('')
}, true);

Function.safeStdLibAddition(DataView, 'toByteString',  function () {
  let bytes = [];
  for (let index = 0; index < this.byteLength; index++) {
    bytes.push(this.getUint8(index));
  }
  return `[${bytes.join(',')}]`;
});

function formatNumber(number, biteLen, func, bigEndian) {
  const buffer = new ArrayBuffer(biteLen);
  const view = new DataView(buffer);

  view[func](0, number, !bigEndian);

  return buffer;
}

let nr = '(?:-|)[0-9]{1,}';
Number.regex = new RegExp(`(?:${nr}\\.${nr}|${nr}|\\.${nr})`);

Function.safeStdLibAddition(Number, 'float32',  {}, true);
Function.safeStdLibAddition(Number, 'float64',  {}, true);
Function.safeStdLibAddition(Number, 'int32',  {}, true);
Function.safeStdLibAddition(Number, 'bigInt64',  {}, true);
Function.safeStdLibAddition(Number.float32, 'littleEndian',  function (float) {
  return formatNumber(float, 4, 'setFloat32');
}, true);

Function.safeStdLibAddition(Number.float32, 'bigEndian',  function (float) {
  return formatNumber(float, 4, 'setFloat32', true);
}, true);

Function.safeStdLibAddition(Number.float64, 'littleEndian',  function (float) {
  return formatNumber(float, 8, 'setFloat64');
}, true);

Function.safeStdLibAddition(Number.float64, 'bigEndian',  function (float) {
  return formatNumber(float, 8, 'setFloat64', true);
}, true);

Function.safeStdLibAddition(Number.int32, 'littleEndian',  function (float, U) {
  return formatNumber(float, 4, U !== false ? 'setInt32' : 'setUInt32');
}, true);

Function.safeStdLibAddition(Number.int32, 'bigEndian',  function (float, U) {
  return formatNumber(float, 4, U !== false ? 'setInt32' : 'setUInt32', true);
}, true);

Function.safeStdLibAddition(Number.bigInt64, 'littleEndian',  function (float, U) {
  return formatNumber(float, 8, U !== false ? 'setBigInt64' : 'setBigUint64', true);
}, true);

Function.safeStdLibAddition(Number.bigInt64, 'bigEndian',  function (float, U) {
  return formatNumber(float, 8, U !== false ? 'setBigInt64' : 'setBigUint64', true);
}, true);

Function.safeStdLibAddition(Math, 'mod',  function (val, mod) {
  mox = Math.abs(mod);

  if(val < 0) {
    val -= Math.floor(val/-mod) * mod
    val += mod;
  }
  return val % mod;
}, true);

const ratioReg = /^([0-9]{0,})(r|ratio)([0-9]{0,})$/i;
Function.safeStdLibAddition(Math, 'ratio', function (string) {
  const rMatch = string.match(ratioReg);
  if (rMatch) {
    const ratio1 = rMatch[1];
    const ratio2 = rMatch[3];
    if (ratio1 && ratio2) return ratio1/ratio2;
    else if (ratio1) return ratio1/100;
    else if (ratio2) return 1 - ratio2/100;
  }
}, true);

Function.safeStdLibAddition(Math, 'copysign',  function (a, b) {
  return b < 0 ? -Math.abs(a) : Math.abs(a);
}, true);

Function.safeStdLibAddition(Math, 'modWithin',  function (val, mod, lowerLimit, upperLimit) {
  val = Math.mod(val, mod);
  lowerLimit = Math.mod(lowerLimit, mod);
  upperLimit = Math.mod(upperLimit, mod);
  return lowerLimit <= upperLimit ? val >= lowerLimit && val <= upperLimit : (val >= lowerLimit || val <= upperLimit);
}, true);

Function.safeStdLibAddition(Math, 'modTolerance',  function (val1, val2, mod, tol) {
  if (tol > mod) return true;
  const min2 = Math.mod(val2 - tol/2, mod);
  const max2 = Math.mod(val2 + tol/2, mod);
  return Math.modWithin(val1, mod, min2, max2);
}, true);

Function.safeStdLibAddition(Number, 'NaNfinity',  function (...vals) {
  for (let index = 0; index < vals.length; index++) {
    let val = vals[index];
    if(Number.isNaN(val) || !Number.isFinite(val)) return true;
  }
  return false;
}, true);

function adjustPolarity(value, positive) {
  if (positive === true && value < 0) value *= -1;
  if (positive === false && value > 0) value *= -1;
  return value;
}

function stringHash(digits, positive) {
  let hashString = this;
  let hash = 0;
  for (let i = 0; i < hashString.length; i += 1) {
    const character = hashString.charCodeAt(i);
    hash = ((hash << 5) - hash) + character;
    hash &= hash; // Convert to 32bit integer
  }
  if (!digits) return adjustPolarity(hash, positive);
  let mod = 1;
  for (let i = 0; i < digits; i++) mod *= 10;
  return adjustPolarity(mod ? hash % mod : hash, positive);
}

Function.safeStdLibAddition(String, 'hash',  stringHash, false);

const LEFT = 1;
const RIGHT = 0;
Function.safeStdLibAddition(String, 'obscure',  function (count) {
    const direction = count < 0 ? LEFT : RIGHT;
    const test = (index) => direction === LEFT ? index > this.length + count - 1 : index < count;
    let str = '';
    for (let index = 0; index < this.length; index += 1) {
      if (test(index)) {
        str += '*';
      } else {
        str += this[index];
      }
    }
    return str;
});

const singleCharReg = /([a-zA-Z]{1,})[^a-z^A-Z]{1,}([a-zA-Z])[^a-z^A-Z]{1,}([a-zA-Z]{1,})/;
const specialCharReg = /([a-zA-Z])[^a-z^A-Z^0-9]{1,}([a-zA-Z])/g;
const charNumberReg = /([a-zA-Z])([0-9])/
function singleCharReplace(whoCares, one, two, three) {
  const oneLastChar = one[one.length - 1];
  const twoLower = oneLastChar !== oneLastChar.toLowerCase();
  const twoStr = twoLower ? two.toLowerCase() : two.toUpperCase();
  const threeStr = twoLower ? `${three[0].toUpperCase()}${three.substr(1)}` :
                                `${three[0].toLowerCase()}${three.substr(1)}`;
  return `${one}${twoStr}${threeStr}`;
}
function camelReplace(whoCares, one, two) {return `${one}${two.toUpperCase ? two.toUpperCase() : two}`;}
function toCamel() {
  let string = `${this.substr(0,1).toLowerCase()}${this.substr(1)}`.replace(charNumberReg, camelReplace);
  while (string.match(singleCharReg)) string = string.replace(singleCharReg, singleCharReplace);
  return string.replace(specialCharReg, camelReplace);
}
Function.safeStdLibAddition(String, 'toCamel',  toCamel);

const multipleUpperReg = /([A-Z]{2,})([a-z])/g;
const caseChangeReg = /([a-z])([A-Z])/g;
function pascalReplace(whoCares, one, two) {return `${one.toLowerCase()}_${two.toUpperCase ? two.toUpperCase() : two}`;}
function toPascal() {
  let string = this;
  return string.replace(multipleUpperReg, pascalReplace)
                .replace(caseChangeReg, pascalReplace)
                .replace(charNumberReg, pascalReplace)
                .replace(specialCharReg, pascalReplace);
}
Function.safeStdLibAddition(String, 'toPascal',  toPascal);

function toKebab() {
  return this.toPascal().toLowerCase().replace(/_/g, '-');
}
Function.safeStdLibAddition(String, 'toKebab',  toKebab);

Function.safeStdLibAddition(String, 'toSnake',  function () {return this.toKebab().replace(/-/g, '_')});
Function.safeStdLibAddition(String, 'toDot',  function () {return this.toKebab().replace(/-/g, '.')});
Function.safeStdLibAddition(String, 'toScreamingDot',  function () {return this.toKebab().replace(/-/g, '.')});
Function.safeStdLibAddition(String, 'toScreamingSnake',  function () {return this.toSnakeCase().toUpperCase()});
Function.safeStdLibAddition(String, 'toScreamingKebab',  function () {return this.toKebab().toUpperCase()});
Function.safeStdLibAddition(String, 'toSentance',  function () {
  const pascal = this.toPascal().replace(/_/g, ' ');
  return pascal[0].toUpperCase() + pascal.substring(1);
});

Function.safeStdLibAddition(Function, 'orVal',  function (funcOrVal, ...args) {
  return (typeof funcOrVal) === 'function' ? funcOrVal(...args) : funcOrVal;
}, true);

const classLookup = {};
const attrMap = {};
const identifierAttr = '_TYPE';
const immutableAttr = '_IMMUTABLE';
const temporaryAttr = '_TEMPORARY';
const doNotOverwriteAttr = '_DO_NOT_OVERWRITE';
const forceFromJsonAttr = '_FORCE_FROM_JSON';

const clazz = {};
const universalCloneFunction = (obj) => obj.constructor.fromJson(obj.constructor.toJson());
clazz.object = () => Object.merge({}, classLookup);
clazz.register = (clazz, ...attrs) => {
  const cxtrName = clazz.name;
  classLookup[cxtrName] = clazz;
  if (attrMap[cxtrName] === undefined) attrMap[cxtrName] = [];
  attrs.forEach((attr) => attrMap[cxtrName][attr] = true);
  const parentToJson = clazz.toJson;
  clazz.toJson = (obj) => {
    const json = parentToJson ? parentToJson(obj) : {};
    json._TYPE = cxtrName;
    Object.keys(attrMap[cxtrName]).forEach(k => json.pathValue(k, processValue(obj.pathValue(k))));
    return json;
  }
  const parentFromJson = clazz.fromJson;
  clazz.fromJson = (json, obj) => {
    if (!obj) obj = clazz.new();
    if (parentFromJson) parentFromJson(json, obj);
    Object.keys(attrMap[cxtrName]).forEach(k => obj.pathValue(k, Object.fromJson((json.pathValue(k)))));
    return obj;
  }
  clazz.new = (...args) => new clazz(...args);
  const parentClone = clazz.clone;
  clazz.clone = (obj, clone) => {
    if (!clone) clone = clazz.new();
    if (parentClone) parentClone(obj, clone);
    Object.keys(attrMap[cxtrName]).forEach(k => clone.pathValue(k, obj.pathValue(k)));
    return clone;
  }
}
clazz.get = (nameOobject) => (typeof nameOobject) === 'string' ? classLookup[nameOobject] : nameOobject.constructor;
clazz.new = (nameOobject, ...args) => (typeof nameOobject) === 'string' ? new classLookup[nameOobject](...args) : new nameOobject.constructor(...args);
clazz.filter = (filterFunc) => {
  const classes = clazz.object();
  if ((typeof filterFunc) !== 'function') return classes;
  const classIds = Object.keys(classes);
  const list = [];
  for (let index = 0; index < classIds.length; index += 1) {
    const id = classIds[index];
    if (filterFunc(classes[id])) list.push(classes[id]);
  }
  return list;
}

const filterOutUndefined = (obj) => (key) => obj[key] !== undefined;
function objEq(obj1, obj2) {
  const isObj1 = obj1 instanceof Object;
  const isObj2 = obj2 instanceof Object;
  if (!isObj1 && !isObj2)
    return obj1 === obj2;
  if (!isObj1)
    return false;
  if (!isObj2)
    return false;
  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
  const obj1Keys = Object.keys(obj1).filter(filterOutUndefined(obj1)).sort();
  const obj2Keys = Object.keys(obj2).filter(filterOutUndefined(obj2)).sort();
  if (obj1Keys.length !== obj2Keys.length) return false;
  for (let index = 0; index < obj1Keys.length; index += 1) {
    const obj1Key = obj1Keys[index];
    const obj2Key = obj2Keys[index];
    if (obj1Key !== obj2Key) return false;
    const obj1Val = obj1[obj1Key];
    const obj2Val = obj2[obj2Key];
    if (obj1Val instanceof Object) {
      if ((typeof obj1Val.equals) !== 'function') {
        if(!objEq(obj1Val, obj2Val)) {
          objEq(obj1Val, obj2Val)
          return false;
        }
      }
      else if (!obj1Val.equals(obj2Val))
        return false;
    } else if (obj1[obj1Key] !== obj2[obj2Key])
        return false;
  }
  return true;
}

Function.safeStdLibAddition(Object, 'merge', (target, object, soft) => {
  if (!(target instanceof Object)) return;
  if (!(object instanceof Object)) return;
  if (soft !== false) soft = true;
  const objKeys = Object.keys(object);
  if (!soft) target.deleteAll();
  for (let index = 0; index < objKeys.length; index++) {
    const key = objKeys[index];
    const value = object[key];
    if (value instanceof Object && target[key] instanceof Object) {
      Object.merge(target[key], value, soft);
    } else if (!soft || target[key] === undefined) {
      target[key] = value;
    }
  }
  return target;
}, true);

Function.safeStdLibAddition(Object, 'merge', function () {
  const lastArg = arguments[arguments.length - 1];
  let soft = true;
  let args = arguments;
  if (lastArg === false || lastArg === true) {
    soft = lastArg;
    args = Array.from(arguments).slice(0, arguments.length - 1);
  }
  for (let index = 0; index < args.length; index++) {
    const object = args[index];
    if (object instanceof Object) {
      Object.merge(this, object, soft);
    } else {
      console.error('Attempting to merge a non-object');
    }
  }
  return this;
});

Function.safeStdLibAddition(Array, 'removeAll', function (arr) {
  for (let index = 0; index < arr.length; index += 1) {
    this.remove(arr[index]);
  }
});

Function.safeStdLibAddition(Array, 'removeWhere', function (func) {
  for (let index = 0; index < this.length; index += 1) {
    if (func(this[index])) {
      this.splice(index--, 1)
    }
  }
});

Function.safeStdLibAddition(Array, 'findIndicies', function (func) {
  const indicies = [];
  for (let index = 0; index < this.length; index += 1) {
    if (func(this[index])) indicies.push(index);
  }
  return indicies;
});


Function.safeStdLibAddition(Array, 'deleteAll', function () {
  this.forEach((v, i) => delete this[i]);
  this.length = 0;
});

Function.safeStdLibAddition(Object, 'deleteAll', function () {
  Object.keys(this).forEach(key => delete this[key]);
});

Function.safeStdLibAddition(Object, 'forAllRecursive', (object, func) => {
  if (!(object instanceof Object)) return;
  if ((typeof func) !== 'function') return;
  const target = Array.isArray(object) ? [] :{};
  const objKeys = Object.keys(object);
  for (let index = 0; index < objKeys.length; index++) {
    const key = objKeys[index];
    if (object[key] instanceof Object) {
      target[key] = Object.forAllRecursive(object[key], func);
    } else target[key] = func(object[key], key, object);
  }
  return target;
}, true);

Function.safeStdLibAddition(Object, 'class', clazz, true);
Function.safeStdLibAddition(Object, 'equals', objEq, true);


Function.safeStdLibAddition(Math, 'toDegrees', function (rads) {
  return Math.round(1000 * Math.mod(rads * 180/Math.PI, 360)) / 1000;
}, true);

Function.safeStdLibAddition(Math, 'difference', function (val1, val2) {
  if (val1 > val2) return Math.abs(val1 - val2);
  return Math.abs(val2 - val1);
}, true);

Function.safeStdLibAddition(Math, 'roundTo', function (val, percision) {
  if (percision === undefined) percision = .001;
  const rounded = Math.round(val*1/percision) / (1/percision);
  return rounded;
}, true);


Function.safeStdLibAddition(Object, 'forEachConditional', function (obj, func, conditionFunc, modifyObject) {
  if (!modifyObject) obj = JSON.clone(obj);
  conditionFunc = (typeof conditionFunc) === 'function' ? conditionFunc : () => true;
  const keys = Object.keys(obj);
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const value = obj[key];
    if (conditionFunc(value)) func(value, key, obj);
    if (value instanceof Object) Object.forEachConditional(value, func, conditionFunc, true);
  }
  return obj;
}, true);

Function.safeStdLibAddition(Math, 'toRadians', function (angle, accuracy) {
  return (angle*Math.PI/180)%(2*Math.PI);
}, true);

Function.safeStdLibAddition(Math, 'midpoint', function (s, e) {
  if (e < s) {
    let t = s;
    s = e;
    e = t;
  }
  return s + (e - s)/2;
}, true);

// Ripped off of: https://stackoverflow.com/a/2450976
Function.safeStdLibAddition(Array, 'shuffle', function() {
  let currentIndex = this.length,  randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [this[currentIndex], this[randomIndex]] = [
      this[randomIndex], this[currentIndex]];
  }

  return this;
});

Function.safeStdLibAddition(Array, 'count', function(funcOrVal, max) {
  let count = 0;
  const call = (typeof funcOrVal) === 'function';
  for (let index = 0; index < this.length; index++) {
    const retVal = call ? funcOrVal(this[index]) : funcOrVal === this[index];
    count += (typeof retVal) === 'number' ? retVal : (retVal ? 1 : 0);
    if (count >= max) return max;
  }
  return count;
});

Function.safeStdLibAddition(Array, 'contains', function(value, max) {
  const funcOrVal = value && (typeof value.equals) === 'function' ? value.equals : value;
  return this.count(funcOrVal, 1) === 1;
});

const primes = [3,5,7,11,17,19,23,29];
const firstNotInList = (targetList, ignoreList) => {
  for (let index = 0; index < targetList.length; index++) {
    if (ignoreList.indexOf(targetList[index]) === -1) return {item: targetList[index], index};
  }
  return null;
}
Function.safeStdLibAddition(Array, 'systematicSuffle', function (numberOfSuffles, doNotShufflePrimes) {
  const ps = [];
  ps.copy(primes);
  const map = {};
  let primeCount = 0;
  let loops = 0;
  const lastSeven = [];
  for (let index = 0; index < numberOfSuffles; index++) {
    let prime = ps[primeCount % ps.length];
    if (lastSeven.indexOf(prime) !== -1) {
      const info = firstNotInList(ps, lastSeven);
      prime = info.item;
      primeCount = info.index;
    }
    lastSeven[index % 7] = prime;
    primeCount += prime + (prime * (ps[(primeCount + loops++) % ps.length])) % ps.length;
    let shuffleIndex = 0;
    while (shuffleIndex < this.length) {
      const firstPart = this.slice(0, shuffleIndex)
      const secondPart = this.slice(shuffleIndex, (shuffleIndex = shuffleIndex + prime));
      const thirdPart = this.slice(shuffleIndex)
      this.copy(secondPart.concat(firstPart.concat(thirdPart)));
    }
    map[this.join().hash()] = true;
  }
  return Object.keys(map).length;
});

Function.safeStdLibAddition(Array, 'uniqueStringValue', function (value) {
  const matchingIndexes = [true];
  const valReg = new RegExp(`(${RegExp.escape(value)})([0-9]*)`);
  for (let index = 0; index < this.length; index++) {
    const curr = new String(this[index]);
    const match = curr.match(valReg);
    if (match) {
      matchingIndexes[match[2] || -1] = value;
    }
  }
  if (matchingIndexes[-1] === undefined) return value;
  const emptyIndex = matchingIndexes.findIndex(str => str === undefined);
  return value + (emptyIndex === -1 ? matchingIndexes.length : emptyIndex);
});

Function.safeStdLibAddition(Array, 'reorder', function () {
  let count = 2;
  let currentIndex = this.length,  randomIndex;
  while (currentIndex != 0) {
    randomIndex = (currentIndex * count++) % currentIndex;
    currentIndex--;
    [this[currentIndex], this[randomIndex]] = [
      this[randomIndex], this[currentIndex]];
  }
});

Function.safeStdLibAddition(Array, 'toJson', function (arr) {
    const json = [];
    arr.forEach((elem) => json.push(processValue(elem)));
    return json;
}, true);

Function.safeStdLibAddition(Object, 'toJson', function (obj) {
    if (!(obj instanceof Object)) throw new Error('Not an Object');
    const json = Array.isArray(obj) ? [] : {};
    const keys = Object.keys(obj);
    keys.forEach((key) => json[key] = processValue(obj[key]));
    return json;
}, true);

Function.safeStdLibAddition(Array, 'equalIndexOf', function (elem, startIndex, endIndex) {
    startIndex =  startIndex > -1 ? startIndex : 0;
    endIndex = endIndex < this.length ? endIndex : this.length;
    for (let index = startIndex; index < endIndex; index += 1) {
      if (elem && (typeof elem.equals) === 'function' && elem.equals(this[index])) {
        return index;
      } else if (elem === this[index]) {
        return index;
      }
    }
    return -1;
});

Function.safeStdLibAddition(Array, 'condition', function (conditionFunc, initialValue) {
  // console.warn('Function has been modified make sure results are as expected');
  let value = initialValue;
  const valueFuncDefined = (typeof valueFunc) === 'function';
  for (let index = 0; index < this.length; index += 1) {
    const elem = this[index];
    value = conditionFunc(elem, value, index);
  }
  return value;
});

function arrayMaxObj(func, max) {
  const funcDefined = (typeof func) === 'function';
  const initialValue = max || max === 0 ?
        {elem: max, value: funcDefined ? func(max) : max, index: -1} : undefined;
  return this.condition((elem, max, index) => {
    let value = funcDefined ? func(elem, index) : elem;
    if (!(max instanceof Object) || value > max.value) return {value, elem, index};
    return max;
  }, initialValue);
}

Function.safeStdLibAddition(Array, 'max', function (func, max) {
  const obj = arrayMaxObj.apply(this, [func, max]);
  return obj ? obj.elem : undefined;
});
Function.safeStdLibAddition(Array, 'maxIndex', function (func, max) {
  const obj = arrayMaxObj.apply(this, [func, max]);
  return obj ? obj.index : -1;
});

function arrayMinObj(func, min) {
  const funcDefined = (typeof func) === 'function';
  const initialValue = min || min === 0 ? {elem: min, value: funcDefined ? func(min) : min} : undefined;
  return this.condition((elem, min, index) => {
    let value = funcDefined ? func(elem, index) : elem;
    if (!(min instanceof Object) || value < min.value) return {value, elem, index};
    return min
  }, initialValue);
}

Function.safeStdLibAddition(Array, 'min', function (func, min) {
  const obj = arrayMinObj.apply(this, [func, min]);
  return obj ? obj.elem : -1;
});
Function.safeStdLibAddition(Array, 'minIndex', function (func, min) {
  const obj = arrayMinObj.apply(this, [func, min]);
  return obj ? obj.index : -1;
});

Function.safeStdLibAddition(Array, 'print', function (min, func) {
  const maxLength = new String(this.length).length;
  for (let index = 0; index < this.length; index++) {
    const elem = this[index];
    const length = new String(index).length;
    const position = new Array(maxLength - length).fill(' ').join('') + index + ':';
  }
});

Function.safeStdLibAddition(Array, 'exists', function (array, obj) {
  if (!Array.isArray(array)) return false;
  for (let index = 0; index < array.length; index += 1) {
    if (array[index] === obj) return true;
  }
  return false;
}, true);

Function.safeStdLibAddition(Array, 'remove', function (elem) {
  const isFunction = elem && (typeof elem.equals) === 'function';
  let removed = isFunction ? [] : undefined;
  for (let index = 0; index < this.length; index += 1) {
    if (isFunction && elem.equals(this[index])) {
      removed.push(this.splice(index--, 1)[0]);
    } else if (elem === this[index]) {
      removed = this.splice(index--, 1)[0];
    }
  }
  return removed;
});

Function.safeStdLibAddition(Array, 'diff', function (original, neww, modify) {
    const comparison = {both: [], removed: [], added: []};
    const arr = original.concat(neww);
    const visited = {new: {}, original: {}};
    arr.forEach((elem) => {
      const origIndex = original.equalIndexOf(elem);
      const newIndex = neww.equalIndexOf(elem);
      if (!visited.new[newIndex] && !visited.original[origIndex]) {
        if (newIndex !== -1) visited.new[newIndex] = true;
        if (origIndex !== -1) visited.original[origIndex] = true;
        if (origIndex !== -1 && newIndex !== -1) comparison.both.push(elem);
        else if (newIndex !== -1) comparison.added.push(elem);
        else comparison.removed.push({elem, index: origIndex});
      }
    });

    if (modify === true) {
      if (comparison.removed.length > 0) {
        let removed = 0;
        comparison.removed.forEach((info) => original.splice(info.index - removed++, 1));
        comparison.removed = comparison.removed.map((info) => info.elem);
      }
      if (comparison.added.length > 0) {
        original.concatInPlace(neww);
      }
    }
    return comparison.removed.length > 0 || comparison.added.length > 0 ? comparison : false;
}, true);

Function.safeStdLibAddition(Array, 'concatInPlace', function (arr, checkForDuplicats) {
  if (arr === this) return;
  if (!Array.isArray(arr)) return;
  for (let index = 0; index < arr.length; index += 1) {
    if (checkForDuplicats && this.indexOf(arr[index]) !== -1) {
      console.warn('duplicate');
    } else {
      this[this.length] = arr[index];
    }
  }
});

function sortByAttrs(attrs, reverse) {
  function sort(obj1, obj2) {
    for (let index = 0; index < attrs.length; index++) {
      const attr = attrs[index];
      const val1 = Object.pathValue(obj1, attr);
      const val2 = Object.pathValue(obj2, attr);
      if (index === attrs.length && val2 === val1) {
        continue;
      }
      if (val2 !== val1) {
        if (reverse) {
          return val1 > val2 ? -1 : 1;
        }
        return val1 > val2 ? 1 : -1;
      }
    }
    return 0;
  }
  return sort;
}

const nativeSort = Array.sort;
Function.safeStdLibAddition(Array, 'sortByAttr', function(stringOfunc, reverse) {
  if ((typeof stringOfunc) === 'string')
    return this.sort.apply(this, [sortByAttrs([stringOfunc], reverse)]);
  return this.sort.apply(this, arguments);
});

Function.safeStdLibAddition(Array, 'sortByAttrs', function(list, reverse) {
  return this.sort.apply(this, [sortByAttrs(list, reverse)]);
});

Function.safeStdLibAddition(Object, 'fromJson', function (rootJson) {
  function interpretValue(value) {
    if (value instanceof Object) {
      const classname = value[identifierAttr];
      const attrs = attrMap[classname] ? Object.keys(attrMap[classname]) :
                    Object.keys(value).filter((attr) => !attr.match(/^_[A-Z]*[A-Z_]*$/));
      if (Array.isArray(value)) {
        const realArray = [];
        for (let index = 0; index < value.length; index += 1) {
          realArray[index] = Object.fromJson(value[index]);
        }
        return realArray;
      } else if (classname && classLookup[classname]) {
        if (classLookup[classname].fromJson) {
          return classLookup[classname].fromJson(value);
        } else {
          const classObj = new (classLookup[classname])(value);
          for (let index = 0; index < attrs.length; index += 1) {
            const attr = attrs[index];
            classObj.pathValue(attr, interpretValue(value[attr]));
          };
          return classObj;
        }
      } else {
        if (classname) {
          console.warn(`fromJson for class ${classname} not registered`)
        }
        const realObj = {}
        for (let index = 0; index < attrs.length; index += 1) {
          const attr = attrs[index];
          realObj[attr] = interpretValue(value[attr]);
        };
        return realObj
      }
    }
    return value;
  }

  if (!(rootJson instanceof Object)) return rootJson;
  return interpretValue(rootJson);
}, true);

function setToJson(obj, options) {
  if (!options.temporary) {
    const origToJson = obj.toJson;
    obj.toJson = (members, exclusive) => {
      try {
        const restrictions = Array.isArray(members) && members.length;
        const json = (typeof origToJson === 'function') ? origToJson() : {};
        if (!options.isObject) json[identifierAttr] = obj.constructor.name;
        for (let index = 0; index < options.attrs.length; index += 1) {
          const attr = options.attrs[index];
          const inclusiveAndValid = restrictions && !exclusive && members.indexOf(attr) !== -1;
          const exclusiveAndValid = restrictions && exclusive && members.indexOf(attr) === -1;
          if (attr !== immutableAttr && (!restrictions || inclusiveAndValid || exclusiveAndValid)) {
            const value = obj.pathValue(attr);
            json.pathValue(attr, processValue(value));
          }
        }
        return json;
      } catch(e) {
        console.warn(e.message);
        throw e;
        return e.message;
      }
    }
  }
}

function staticFromJson(cxtr) {
  const fromJson = (json) => {
    const obj = new cxtr();
    obj.fromJson(json);
    return obj;
  };
  return fromJson;
}

Object.class.staticFromJson = staticFromJson;

function setFromJson(obj, options) {
  const cxtr = obj.constructor;
  if (cxtr.fromJson === undefined || options.forceFromJson)
    cxtr.fromJson = staticFromJson(cxtr);
  const parentFromJson = obj.fromJson;
  obj.fromJson = (json) => {
    for (let index = 0; index < options.attrs.length; index += 1) {
      const attr = options.attrs[index];
      if (attr !== immutableAttr) {
        if ((typeof obj[attr]) === 'function') {
          if(Array.isArray(obj[attr]())){
            obj[attr]().copy(Object.fromJson(json[attr]));
          } else {
            obj[attr](Object.fromJson(json[attr]));
          }
        }
        else {
          obj[attr] = Object.fromJson(json[attr]);
        }
      }
    };
    if ((typeof parentFromJson) === 'function') parentFromJson(json);
    return obj;
  }
}

function setClone(obj, options) {
  const cxtrFromJson = obj.constructor.fromJson;
  if (obj.constructor.DO_NOT_CLONE) {
    obj.clone = () => obj;
  } else if (cxtrFromJson && cxtrFromJson !== Object.fromJson) {
    obj.clone = () => cxtrFromJson(obj.toJson());
  } else if (options.isObject) {
    obj.clone = () => {
      const clone = Object.fromJson(obj.toJson());
      Object.getSet(clone, clone);
      return clone;
    }
  } else {
    obj.clone = () => {
      const clone = new obj.constructor(obj.toJson());
      clone.fromJson(obj.toJson());
      return clone;
    }
  }
}

function getOptions(obj, initialVals, attrs) {
  const options = {};
  options.temporary = false;
  options.immutable = false;
  options.doNotOverwrite = false;
  if ((typeof initialVals) === 'object') {
    options.values = initialVals;
    options.immutable = options.values[immutableAttr] === true;
    options.temporary = options.values[temporaryAttr] === true;
    options.doNotOverwrite = options.values[doNotOverwriteAttr] === true;
    options.forceFromJson = options.values[forceFromJsonAttr] === true;
    if (options.immutable) {
      options.attrs = Object.keys(options.values);
    } else {
      options.attrs = Object.keys(options.values).concat(attrs);
    }
  } else {
    options.values = {};
    options.attrs = [initialVals].concat(attrs);
  }
  return options;
}

function setGettersAndSetters(obj, options) {
  for (let index = 0; !options.doNotOverwrite && index < options.attrs.length; index += 1) {
    const attr = options.attrs[index];
    if (attr !== immutableAttr) {
      const initVal = options.values[attr];
      if(initVal instanceof Function)
        obj[attr] = initVal;
      else if (options.immutable) obj[attr] = () => initVal;
      else if (!(obj[attr] instanceof Function)) {
        obj.pathValue(attr, (value) => {
          if (value === undefined) {
            const noDefaults = (typeof obj.defaultGetterValue) !== 'function';
            if (options.values[attr] !== undefined || noDefaults)
              return options.values[attr];
            return obj.defaultGetterValue(attr);
          }
          return options.values[attr] = value;
        });
      }
    }
  }
}

Function.safeStdLibAddition(Object, 'getSet',   function (obj, initialVals, ...attrs) {
  const cxtrName = obj.constructor.name;
  const isObject = cxtrName === 'Object'
  if (!isObject) {
    if (classLookup[cxtrName] === undefined) {
      classLookup[cxtrName] = obj.constructor;
    } else if (classLookup[cxtrName] !== obj.constructor) {
      console.warn(`Object.fromJson will not work for the following class due to name conflict\n\taffected class: ${obj.constructor}\n\taready registered: ${classLookup[cxtrName]}`);
    }
  }
  if (initialVals === undefined) return;
  if (!(obj instanceof Object)) throw new Error('arg0 must be an instace of an Object');
  const options = getOptions(obj, initialVals, attrs);
  options.isObject = isObject;
  if (!isObject) {
    if (attrMap[cxtrName] === undefined) attrMap[cxtrName] = [];
    options.attrs.forEach((attr) => {
      if (!attr.match(/^_[A-Z]*[A-Z_]*$/))
        attrMap[cxtrName][attr] = true;
    });
  }

  setGettersAndSetters(obj, options);
  setToJson(obj, options);
  setClone(obj, options);
  setFromJson(obj, options);
  return options.attrs;
}, true);
Object.getSet.format = 'Object.getSet(obj, {initialValues:optional}, attributes...)'

Function.safeStdLibAddition(Object, 'set',   function (obj, otherObj) {
  if (otherObj === undefined) return;
  if ((typeof otherObj) !== 'object') {
    throw new Error('Requires one argument of type object or undefined for meaningless call');
  }
  const keys = Object.keys(otherObj);
  keys.forEach((key) => obj[key] = otherObj[key]);
}, true);

const checked = {};

// Swiped from https://stackoverflow.com/a/43197340
function isClass(obj) {
  const isCtorClass = obj.constructor
      && obj.constructor.toString().substring(0, 5) === 'class'
  if(obj.prototype === undefined) {
    return isCtorClass
  }
  const isPrototypeCtorClass = obj.prototype.constructor
    && obj.prototype.constructor.toString
    && obj.prototype.constructor.toString().substring(0, 5) === 'class'
  return isCtorClass || isPrototypeCtorClass
}

Function.safeStdLibAddition(JSON, 'clone',   function  (obj) {
  if ((typeof obj) != 'object') return obj;
  const keys = Object.keys(obj);
  if (!checked[obj.constructor.name]) {
    checked[obj.constructor.name] = true;
  }

  const clone = ((typeof obj.clone) === 'function') ? obj.clone() :
                  Array.isArray(obj) ? [] : {};
  for(let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const member = obj[key];
    if (member && (member.DO_NOT_CLONE || member.constructor.DO_NOT_CLONE)) {
      clone[key] = member;
    } else if ((typeof member) !== 'function') {
      if ((typeof member) === 'object') {
        if ((typeof member.clone) === 'function') {
          clone[key] = member.clone();
        } else {
          clone[key] = JSON.clone(member);
        }
      } else {
        clone[key] = member;
      }
    }
    else if (isClass(member)) {
      clone[key] = member;
    }
  }
  return clone;
}, true);

Function.safeStdLibAddition(Array, 'idObject',   function  (idAttr) {
  const obj = {};
  for (let index = 0; index < this.length; index++) {
    const elem = this[index];
    const id = (typeof elem[idAttr] === 'function') ? elem[idAttr]() : elem[idAttr];
    obj[id] = elem;
  }
  return obj;
});

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
  const call = () => (!terminationTest() && this(...args)) &
                      (setTimeout(call, callEveryMilSec));
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
    const hash = object.pathValue(p);
    if (hash !== lastHash) object.pathValue(CacheLocation, {});
    if (!hashChangeEvent) {
      const hash = object.pathValue(hashAttr);
      if (hash !== lastHash) object.pathValue(CacheLocation, {});
    }
    if (object.pathValue(p) === undefined)
      object.pathValue(p, this(...args));
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

Function.safeStdLibAddition(String, 'foreach', function (func) {
  const arr = [];
  for (let index = 0; index < this.length; index++) {
    func(this[index], index);
  }
});

Function.safeStdLibAddition(String, 'map', function (func) {
  const arr = [];
  for (let index = 0; index < this.length; index++) {
    arr[index] = func(this[index]);
  }
  return arr;
});

Function.safeStdLibAddition(String, 'filter', function (func) {
  const arr = [];
  for (let index = 0; index < this.length; index++) {
    if (func(this[index])) arr[index] = this[index];
  }
  return arr;
});


Function.safeStdLibAddition(String, 'parseSeperator',   function (seperator, isRegex) {
  if (isRegex !== true) {
    seperator = seperator.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, '\\$&');
  }
  var keyValues = this.match(new RegExp('.*?=.*?(' + seperator + '|$)', 'g'));
  var json = {};
  for (let index = 0; keyValues && index < keyValues.length; index += 1) {
    var split = keyValues[index].match(new RegExp('\\s*(.*?)\\s*=\\s*(.*?)\\s*(' + seperator + '|$)'));
    if (split) {
      json[split[1]] = split[2];
    }
  }
  return json;
});

const colors = [
  'blue', 'red', 'yellow', 'lime', 'gray', 'indianred', 'fuchsia', 'black', 'lightsalmon',
  'maroon', 'olive', 'lightcoral', 'green', 'aqua', 'white',
  'teal', 'darksalmon', 'navy', 'salmon', 'silver', 'purple'
];
const colorRGBs = {indianred: [205, 92, 92],gray: [128, 128, 128],fuchsia: [255, 0, 255],
  lime: [0, 255, 0],black: [0, 0, 0],lightsalmon: [255, 160, 122],red: [255, 0, 0],
  maroon: [128, 0, 0],yellow: [255, 255, 0],olive: [128, 128, 0],lightcoral: [240, 128, 128],
  green: [0, 128, 0],aqua: [0, 255, 255],white: [255, 255, 255],teal: [0, 128, 128],
  darksalmon: [233, 150, 122],blue: [0, 0, 255],navy: [0, 0, 128],salmon: [250, 128, 114],
  silver: [192, 192, 192],purple: [128, 0, 128]
}

const colorsCodeMap = {}
colors.forEach(k => colorsCodeMap[colorRGBs[k].join(',')] = k);

Function.safeStdLibAddition(String, 'color', () => colors[colorIndex % colors.length], true);
String.color.RGB = colorRGBs;
Function.safeStdLibAddition(String, 'colorName', function (color) {
  if (!Array.isArray(color)) return '';
  const strKey = color.map(v => Math.round(v * 255)).join(',');
  return colorsCodeMap[strKey] || strKey;
}, true);

let colorIndex = 0;
Function.safeStdLibAddition(String.color, 'next', (...exclude) => {
  if (!exclude) exclude = [];
  exclude.push('black');
  const filteredColors = colors.filter(c => exclude.indexOf(c) === -1)
  return filteredColors[colorIndex++ % filteredColors.length];
}, true);
let distinctColorIndex = -1;
const distinct = ['red', 'yellow', 'blue', 'green', 'purple', 'black']
Function.safeStdLibAddition(String.color, 'distinct', () => {
  distinctColorIndex++;
  colorIndex = colors.findIndex((c) => c === distinct[distinctColorIndex % distinct.length]);
  return colors[colorIndex];
}, true);

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return [r, g, b];
}

function rgbToHex(rgb) {
  return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
}

function rgbToHSL(rgb) {
  const r = rgb[0];
  const g = rgb[1];
  const b = rgb[2];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return rgb;
}

function getRgb(color, deFault) {
  if (deFault === undefined) deFault = [0,0,0];
  if (Array.isArray(color)) {
    if (color[0] < 1) return color.map(v => Math.floor(v*255));
    return color;
  }
  if (color instanceof Object) return String.color.hslToRgb(color) || deFault;
  if ((typeof color) === 'string')
    if (String.color.RGB[color]) return String.color.RGB[color] || deFault;
    else return hexToRgb(color) || deFault;
  return deFault;
}

const getHex = (color) => rgbToHex(getRgb(color));
const getHexShortHand = (color) => rgbToHex(getRgb(color)).replace(/(#.).(.).(.)./, '$1$2$3');
const rgbPercent = (color) => getRgb(color).map(v => v/255);


Function.safeStdLibAddition(String.color, 'hexToRgb', hexToRgb, true);
Function.safeStdLibAddition(String.color, 'rgbToHex', rgbToHex, true);
Function.safeStdLibAddition(String.color, 'rgbToHSL', rgbToHSL, true);
Function.safeStdLibAddition(String.color, 'hslToRgb', hslToRgb, true);
Function.safeStdLibAddition(String.color, 'rgb', getRgb, true);
Function.safeStdLibAddition(String.color, 'hex', getHex, true);
Function.safeStdLibAddition(String.color.hex, 'short', getHexShortHand, true);
Function.safeStdLibAddition(String.color.rgb, 'percent', rgbPercent, true);



{
  const a = 'a'.charCodeAt(0);
  const z = 'z'.charCodeAt(0);
  const A = 'A'.charCodeAt(0);
  const Z = 'Z'.charCodeAt(0);
  const zero = '0'.charCodeAt(0);
  const nine = '9'.charCodeAt(0);
  const range = {
    upper: [A,Z],
    lower: [a,z],
    alpha: [A,z],
    numeric: [zero, nine]
  }
  range.alpha.exclude = [Z+1, a-1];

  Function.safeStdLibAddition(String, 'range', range, true);
}

const rangeLength = range => !range ? 0 : range[1] - range[0] - rangeLength(range.exclude) + 1;

const integerToChar = (int, range) => {
  if (range.exclude) {
    if (int + range[0] >= range.exclude[0]) int += rangeLength(range.exclude);
    // if (int + range[0] - 1 <= range.exclude[1]) int += 1;
  }
  return String.fromCharCode(int + range[0]);
}
function integerToStr(int, range) {
  if (!range) range = String.range.alpha;
  const rangeLen = rangeLength(range);
  let mod = rangeLen;
  let str = '';
  do {
    const value = int % mod;
    str += integerToChar(value, range);
    int = (int - value - 1) / rangeLen;
  } while (int > 0);
  return Array.from(str).reverse().join('');
}
Function.safeStdLibAddition(String, 'fromInt', integerToStr, true);

const charInteger = (char, range) => {
  const rangeLen = rangeLength(range);
  const code = char.charCodeAt(0);
  if (code >= range[0]) {
    if (range.exclude) {
      if (code < range.exclude[0]) return code - range[0];
      if (code > range.exclude[1] && code <= range[1]) return code - range[0] - rangeLength(range.exclude);
      throw new Error ('This shouldnt happen but char is not within range');
    }
    if (code <= range[1])  return code - range[0];
  }
  throw new Error ('This shouldnt happen but char is not within range');
}

const strInteger = function (range) {
  if (!range) range = String.range.alpha;
  const rangeLen = rangeLength(range);
  let int = 0;
  this.foreach((char, i) => {
    const placeValue = Math.pow(rangeLen, this.length -1 - i);
    const charInt = charInteger(char, range) + (i !== this.length - 1 ? 1 : 0);
    int += placeValue * charInt;
  });
  return int;
}
Function.safeStdLibAddition(String, 'toInt', strInteger);

Function.safeStdLibAddition(String, 'plus', function (intOstring, range) {
  return String.fromInt(this.toInt(range) + (Number.isInteger(intOstring) ? intOstring : intOstring.toInt(range)));
});


const numberReg = /^[0-9]{1,}$/;
const funcReg = /^(.*?)(\(\)|)$/;
Function.safeStdLibAddition(Object, 'pathInfo', function (path, create) {
  const attrs = (path + '').split('.');
  let value = this;
  let parent, attr, target;
  let created = false;
  for (let index = 0; index < attrs.length; index += 1) {
    const match = attrs[index].match(funcReg);
    attr = match[1];
    parent = value;
    const isFunc = value && value[attr] instanceof Function && match[2] === '()';

    const nextIsIndex = new String(attrs[index + 1]).match(numberReg);
    if (value[attr] === undefined) {
      if (create) {
        created = true;
        value[attr] = nextIsIndex ? [] : {};
      } else {
        return;
      }
    }
    target = value[attr];
    value = isFunc ? target() : target;
    if (value === undefined) return value;
    if (value === null) break;
  }
  return {parent, value, target, attr, created}
});

Function.safeStdLibAddition(Object, 'pathValue', function (obj, path, value) {
  const valueDefined = value !== undefined;
  const pathInfo = obj.pathInfo(path, valueDefined);
  if (!valueDefined && !pathInfo) return pathInfo;
  if (!pathInfo)
    obj.pathInfo(path, valueDefined);
  const parent = pathInfo.parent;
  const attr = pathInfo.attr;
  if ((typeof parent[attr]) === 'function') {
    return parent[attr](value);
  }
  return valueDefined ? (parent[attr] = value) : parent[attr];
}, true);

Function.safeStdLibAddition(Object, 'pathValue', function (path, value) {
  return Object.pathValue(this, path, value);
});


function setProperty(path, value, enumerable, writable, configurable, get, set) {
  const pathInfo = this.pathInfo(path, true);
  writable = Boolean.first(writable, true);
  enumerable = Boolean.first(enumerable, true);
  configurable = Boolean.first(configurable, true);
  if (get && set) Object.defineProperty(pathInfo.parent, pathInfo.attr,
    {enumerable, configurable, get, set});
  else Object.defineProperty(pathInfo.parent, pathInfo.attr,
    {writable, enumerable, configurable, value});
}


Function.safeStdLibAddition(Object, 'property', setProperty);

Function.safeStdLibAddition(Object, 'undefinedKey', function (key, joinStr, requireIndex) {
  if (!requireIndex && this[key] === undefined) return key;
  if (joinStr === undefined) joinStr = '';
  let index = 1;
  while(this[`${key}${joinStr}${index}`] !== undefined) index++;
  return `${key}${joinStr}${index}`;
});


Function.safeStdLibAddition(Object, 'deletePath', function (path) {
  if ((typeof path) !== 'string' || path === '') throw new Error('path(arg1) must be defined as a non empty string');
  const pathInfo = this.pathInfo(path);
  if (pathInfo === undefined) return;
  const parent = pathInfo.parent;
  const attr = pathInfo.attr;
  delete parent[attr];
});

Function.safeStdLibAddition(Array, 'empty', function (func) {
  for (let index = 0; index < this.length; index += 1) {
    if (this[index] !== undefined) return false;
  }
  return true;
});

Function.safeStdLibAddition(Array, 'relitiveIndex', function (funcOval, index) {
  if (!Number.isFinite(index)) index = 0;
  const isFunc = funcOval instanceof Function;
  for (let i = 0; i < this.length; i += 1) {
    const isTarget = isFunc ? funcOval(this[i], i) : funcOval === this[i];
    if (isTarget) {
      const negitive = i <= index ? i - index : -index + (i - this.length);
      const positive = i >= index ? i - index : this.length - index + i;
      if (-negitive < positive) return negitive;
      else return positive;
    }
  }
});

Function.safeStdLibAddition(Array, 'concatElements', function () {
  const elements = this.map(o => o);
  this.deleteAll();
  elements.forEach(e => Array.isArray(e) && this.concatInPlace(e));
  return this;
});

Function.safeStdLibAddition(Array, 'fill', function (length, funcOval) {
  const arr = new Array().fill(length);
  const isFunc = funcOval instanceof Function;
  for (let index = 0; index < length; index += 1) {
    const value = isFunc ? funcOval(index, arr) : funcOval;
    if (value !== undefined) arr[index] = value;
  }
  return arr;
}, true);


/////////////////////////////////// Matrix Equations //////////////////////////

Function.safeStdLibAddition(Array, 'translate', function (vector, doNotModify, quiet) {
  let point = this;
  let single = false;
  if (doNotModify === true) point = Array.from(point);
  const vecLen = vector.length;
  if (point.length !== vecLen && !quiet) console.warn('vector.length !== point.length but we\' do it anyway (arg3(quiet) = true to silence)');
  for (let i = 0; i < vecLen; i += 1) {
    if (point[i] === undefined) point[i] = 0;
    point[i] += vector[i];
  }
  return point;
});

Function.safeStdLibAddition(Array, 'inverse', function (doNotModify) {
  const arr = doNotModify === true ? Array.from(this) : this;
  for (let index = 0; index < arr.length; index += 1) {
    arr[index] *= -1;
  }
  return arr;
});

Function.safeStdLibAddition(Array, 'remap', function (func) {
  for (let index = 0; index < this.length; index += 1) {
    this[index] = func(this[index], index);
  }
});

Function.safeStdLibAddition(Object, 'swap', function (i, j, doNotModify) {
  const arr = doNotModify === true ?
              (Array.isArray(this) ? Array.from(this) : this.copy())
              : this;
  const temp = arr[i];
  arr[i] = arr[j];
  arr[j] = temp;
  return arr;
});

Function.safeStdLibAddition(Array, 'scale', function (valueOfuncOarray, doNotModify) {
  const arr = doNotModify === true ? Array.from(this) : this;
  let func;
  switch (typeof valueOfuncOarray) {
    case 'function': func = (val, index) => val * valueOfuncOarray(val, index); break;
    case 'object': func = (val, index) => val * valueOfuncOarray[index]; break;
    default: func = (val, index) => val * valueOfuncOarray;
  }
  arr.remap(func);
  return arr;
});

Function.safeStdLibAddition(Array, 'add', function (valueOfuncOarray, doNotModify) {
  const arr = doNotModify === true ? Array.from(this) : this;
  let func;
  switch (typeof valueOfuncOarray) {
    case 'function': func = (val, index) => val + valueOfuncOarray(val, index); break;
    case 'object': func = (val, index) => val + valueOfuncOarray[index]; break;
    default: func = (val, index) => val + valueOfuncOarray;
  }
  arr.remap(func);
  return arr;
});

Function.safeStdLibAddition(Array, 'sum', function (valueOfuncOarray) {
  let func;
  let sum = 0;
  switch (typeof valueOfuncOarray) {
    case 'function': func = (val, index) => sum += valueOfuncOarray(val, index); break;
    case 'object': func = (val, index) => sum += valueOfuncOarray[index]; break;
    default: func = (val, index) => sum += val;
  }
  this.forEach(func);
  return sum;
});

Function.safeStdLibAddition(Array, 'group', function (...groupSizes) {
  if (groupSizes.length === 0) return;
  const elements = this.map(o => o);
  const groupSize = groupSizes.splice(0,1)[0];
  this.deleteAll();
  let i = 0;
  let j = 0;
  elements.forEach(e => {
    if (i === groupSize) (i = 0) & j++;
    if (i === 0) this[j] = [];
    this[j][i++] = e;
  });
  this.forEach(elem => elem.group(...groupSizes));
  return this;
});

Function.safeStdLibAddition(Array, 'inSetOf', function (setSize) {
  this.length = Math.ceil(this.length/setSize) * setSize;
});

const MSI = Number.MAX_SAFE_INTEGER;
const msi = Number.MIN_SAFE_INTEGER;
Function.safeStdLibAddition(Math, 'minMax', function (items, targetAttrs) {
  let min,max, total;
  if (!targetAttrs) {
    max = msi;
    min = MSI;
    total = 0;
  }
  const maxMinObject = {};
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    if (max !== undefined) {
      if (max < item) max = item;
      if (min > item) min = item;
      total += item;
    } else {
      const attrs = Array.isArray(targetAttrs) ? targetAttrs : Object.keys(targetAttrs);
      for (let tIndex = 0; tIndex < attrs.length; tIndex++) {
        const attr = attrs[tIndex];
        const value = Object.pathValue(item, attr);
        const key = targetAttrs[attr] === undefined ? attr : targetAttrs[attr];
        if (!maxMinObject[key]) maxMinObject[key] = {max: msi, min: MSI, total: 0};
        if (maxMinObject[key].max < value) maxMinObject[key].max = value;
        if (maxMinObject[key].min > value) maxMinObject[key].min = value;
        maxMinObject[key].total += value;
      }
    }
  }
  if (max !== undefined) return {max, min, total};
  return maxMinObject;
}, true);

Function.safeStdLibAddition(Math, 'midrange', function (items, targetAttrs) {
  const maxMin = Math.minMax(items, targetAttrs);
  if (!targetAttrs) {
    return (maxMin.max + maxMin.min)/2;
  }
  const midRangeObject = {};
  const attrs = Array.isArray(targetAttrs) ? targetAttrs : Object.keys(targetAttrs);
  for (let tIndex = 0; tIndex < attrs.length; tIndex++) {
    const attr = attrs[tIndex];
    const key = targetAttrs[attr] === undefined ? attr : targetAttrs[attr];
    midRangeObject[key] = (maxMin[key].max + maxMin[key].min)/2;
  }
  return midRangeObject;
}, true);

Function.safeStdLibAddition(Math, 'mean', function (items, targetAttrs) {
  const maxMin = Math.minMax(items, targetAttrs);
  if (!targetAttrs) {
    return maxMin.total / items.length;
  }
  const meanObject = {};
  const attrs = Array.isArray(targetAttrs) ? targetAttrs : Object.keys(targetAttrs);
  for (let tIndex = 0; tIndex < attrs.length; tIndex++) {
    const attr = attrs[tIndex];
    const key = targetAttrs[attr] === undefined ? attr : targetAttrs[attr];
    meanObject.pathValue(key, maxMin[key].total/items.length);
  }
  return meanObject;
}, true);

Function.safeStdLibAddition(Math, 'median', function (items, targetAttrs) {
  const medianObject = {};
  if (targetAttrs === undefined) {
    items.sort();
    const middleIndex = items.length/2
    return Number.isInteger(middleIndex) ? items[middleIndex] :
        (items[middleIndex - .5] + items[middleIndex+.5])/2;
  }
  const attrs = Array.isArray(targetAttrs) ? targetAttrs : Object.keys(targetAttrs);
  for (let tIndex = 0; tIndex < attrs.length; tIndex++) {
    const attr = attrs[tIndex];
    const key = targetAttrs[attr] === undefined ? attr : targetAttrs[attr];
    const values = items.map(i => i.pathValue(key));
    medianObject.pathValue(key, Math.median(values));
  }
  return medianObject;
}, true);


Function.safeStdLibAddition(Object, 'filter', function(complement, func, modify, key) {
  if (!modify) complement = JSON.copy(complement);
  if (func(complement, key)) return {filtered: complement};

  if (!(complement instanceof Object)) return {complement};
  let filtered = Array.isArray(complement) ? [] : {};
  const keys = Object.keys(complement);
  let setOne = false;
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const seperated = Object.filter(complement[key], func, true, key);
    if (seperated.filtered !== undefined) filtered[key] = seperated.filtered;
    setOne = true;
    if (seperated.complement === undefined) delete complement[key];
    else complement[key] = seperated.complement;
  }
  if (Object.keys(filtered).length === 0) filtered = undefined;
  return {complement, filtered};
}, true);

Function.safeStdLibAddition(Object, 'filter', function(func) {
  return Object.filter(this, func, true).filtered;
});

Function.safeStdLibAddition(Array, 'elements', function(func) {
  const elements = [];
  this.forEach(e => Array.isArray(e) ?
              elements.concatInPlace(e.elements()) : elements.push(e));
  return elements;
});

Function.safeStdLibAddition(Object, 'copy', function(arr) {
  if (Array.isArray(arr)) throw new Error('point to merge...');
  const root = Array.isArray(arr) ? [] : {};
  const keys = Object.keys(arr);
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const value = arr[key];
    if (!(value instanceof Object)) root[key] = value;
    else root[key] = value.copy();
  }
  return root;
}, true);

Function.safeStdLibAddition(Object, 'copy', function(arr) {
  return Object.copy(this);
});

Function.safeStdLibAddition(Object, 'foreach', function(obj, func, filter, pathPrefix) {
  if (!pathPrefix) pathPrefix = '';
  if((typeof filter) !== 'function' || filter(obj, pathPrefix)) func(obj, pathPrefix);
  const keys = Object.keys(obj);
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const path = pathPrefix === '' ? key : `${pathPrefix}.${key}`;
    const value = obj[key];
    if (value instanceof Object) {
      Object.foreach(value, func, filter, path);
    }
  }
}, true);

Function.safeStdLibAddition(Object, 'foreach', function(func, filter) {
  Object.foreach(this, func, filter);
});
Function.safeStdLibAddition(Object, 'map',   function (obj, func) {
  if ((typeof func) !== 'function') return console.warn('Object.map requires a function argument');
  const keys = Object.keys(obj);
  const map = {};
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const value = obj[key];
    map[key] = func(value, key);
  }
  return map;
}, true);

Function.safeStdLibAddition(Object, 'hash',
  (obj) => JSON.stringify(obj === undefined ? 'undefined' : obj).hash(), true);

Gauge = {
  chart: [{mm:0,inch:0}, {inch: .289, mm: 7.348},{inch: .258, mm: 6.543},{inch: .229, mm: 5.827},{inch: .204, mm: 5.189},{inch: .182, mm: 4.621},{inch: .162, mm: 4.115},{inch: .144, mm: 3.664},{inch: .128, mm: 3.263},{inch: .114, mm: 2.906},{inch: .102, mm: 2.588},{inch: .091, mm: 2.304},{inch: .081, mm: 2.052},{inch: .072, mm: 1.828},{inch: .064, mm: 1.628},{inch: .057, mm: 1.449},{inch: .051, mm: 1.291},{inch: .045, mm: 1.149},{inch: .040, mm: 1.024},{inch: .036, mm: .912},{inch: .032, mm: .812},{inch: .028, mm: .723},{inch: .025, mm: .644},{inch: .023, mm: .573},{inch: .020, mm: .511},{inch: .018, mm: .455},{inch: .016, mm: .405},{inch: .014, mm: .360},{inch: .013, mm: .321},{inch: .011, mm: .286},{inch: .010, mm: .255},{inch: .0089, mm: .226},{inch: .0080, mm: .200},{inch: .0071, mm: .180},{inch: .0063, mm: .160},{inch: .0056, mm: .142},{inch: .0050, mm: .130},{inch: .0045, mm: .114},{inch: .0040, mm: .100}],
  to: {
    mm: (guage) => Gauge.chart[guage || 0].mm,
    inch: (guage) => Gauge.chart[gauge || 0].inch
  },
  from: {
    mm: (mm) => Gauge.chart.findLastIndex(obj => obj.mm >= mm),
    inch: (inch) => Gauge.chart.findLastIndex(obj => obj.inch >= inch)
  }
}
