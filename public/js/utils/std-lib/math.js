Math.PI12 = Math.PI/2;
Math.PI32 = 3*Math.PI/2;
Math.PI2 = 2*Math.PI;

Math.PI14 = Math.PI/4;
Math.PI34 = 3*Math.PI/4;
Math.PI54 = 5*Math.PI/4;
Math.PI74 = 7*Math.PI/4;

Function.safeStdLibAddition(Math, 'mod',  function (val, mod) {
  mox = Math.abs(mod);

  if(val < 0) {
    val -= Math.floor(val/-mod) * mod
    val += mod;
  }
  return val % mod;
}, true);

function adjustPolarity(value, positive) {
  if (positive === true && value < 0) value *= -1;
  if (positive === false && value > 0) value *= -1;
  return value;
}

function hash(digits, positive) {
  if (!digits) return 0;
  let hash = 0;
  for (let i = 0; i < digits.length; i += 1) {
    hash = ((hash << 5) - hash) + digits[i];
    hash &= hash; // Convert to 32bit integer
  }
  let mod = 1;
  for (let i = 0; i < digits.length; i++) mod *= 10;
  return adjustPolarity(mod ? hash % mod : hash, positive);
}

Function.safeStdLibAddition(Math, 'hash', (...digits) => hash(digits), true);
Function.safeStdLibAddition(Math.hash, 'positive', (...digits) => hash(digits, true), true);
Function.safeStdLibAddition(Math.hash, 'negitive', (...digits) => hash(digits, false), true);


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
