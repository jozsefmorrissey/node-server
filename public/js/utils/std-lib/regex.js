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

Function.safeStdLibAddition(RegExp, 'full',  function (str) {
  if (!this.FULL)
    this.property('FULL', new RegExp('^(?:' + this.source + ')$'), false, false, false);
  return this.FULL;
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

Function.safeStdLibAddition(RegExp, 'reverse', function() {
  return this.source.reverse();
});

const openReg = /(?<!(^|[^\\])\\(\\\\)*)\(/;
const closeReg = /(?<!(^|[^\\])\\(\\\\)*)\)/;
const ignoreReg = /\((?=\?)/;
Function.safeStdLibAddition(RegExp, 'matchless', function () {
  const matchlessSource = this.source.foreachSection((section, dets) =>
    dets.str.substring(dets.openIndex - 1, dets.openIndex + 2).match(ignoreReg) ?
      null : section.match(/^\(\(.*\)\)$/) ? section.substring(1,section.length - 1) :
      section.splice(1,0,'?:'), openReg, closeReg);
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
