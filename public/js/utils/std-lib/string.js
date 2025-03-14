Function.safeStdLibAddition(String, 'random',  function (len) {
    len = len || 7;
    let str = '';
    while (str.length < len) str += Math.random().toString(36).substr(2);
    return str.substr(0, len);
}, true);


const compoundReg = /^(.*)\(([^)]{1,}?)\)(.*)$/
Function.safeStdLibAddition(String, 'paths',  function (len) {
    const paths = [];
    if (this.match(compoundReg) === null) return [this + ''];
    const compoundAttrs = [this];
    while(compoundAttrs.length > 0) {
      const ca = compoundAttrs[compoundAttrs.length - 1];
      let match = ca.match(compoundReg);
      if (match === null) {
        paths.push(ca + '');
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
Function.safeStdLibAddition(String, 'toCamelCap', function() {
  const camel = this.toCamel();
  return camel[0].toUpperCase() + camel.substring(1);;
});

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

Function.safeStdLibAddition(String, 'replaceIterativly',  function (exp, replace) {
  let str = this;
  let next;
  while ((next = str.replace(exp, replace)) !== str) str = next;
  return str;
});

const regStr = (regOstr) => regOstr instanceof RegExp ? regOstr : RegExp.escape(regOstr);
Function.safeStdLibAddition(String, 'count',  function (needles, length) {
  let regex;
  if (Array.isArray(needles)) {
    regex = new RegExp(needles.map(regStr).join('|'), 'g');
  } else {
    regex = new RegExp(regStr(needles), 'g');
  }
  const match = this.match(regex, '');
  return match ? match.length : 0;
});


const decimalRegString = "((-|)(([0-9]{1,}\\.[0-9]{1,})|[0-9]{1,}(\\.|)|(\\.)[0-9]{1,}))";
const decimalReg = new RegExp(`^${decimalRegString}$`);
Function.safeStdLibAddition(String, 'isNumber', function (len) {
  return this.trim().match(decimalReg) !== null;
});

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
