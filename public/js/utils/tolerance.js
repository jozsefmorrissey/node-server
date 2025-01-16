
const DEFAULT_TOLERANCE = .0001;
// TODO: make tolerance comparisons based off of percent difference
// const infinity = 1000000;
// const changeToInfinity = (value) =>
//   value < infinity && value > -infinity ? value : value * Infinity;


function round(val) {
  return Math.round(1000000000000 * val)/1000000000000
}

function decimalLimit(value, limit) {
  return (new String(value)).replace(/([0-9]{1,})(.[0-9]{1,}|)/, '$2').length > limit;
}

function rangeStr(lower, upper) {
  return `${round(lower)} => ${round(upper)}`;
}

function parseTolAbs(attr, attributeMap, tolerance, absoluteValue, modulus) {
  const singleValue = attr === undefined;
  if (!singleValue) {
    if ((typeof attributeMap[attr]) === 'string') {
      const absMatch = attributeMap[attr].match(stringTolReg);
      const modMatch = attributeMap[attr].match(stringModulusReg);
      if (absMatch) {
        absoluteValue = true;
        tolerance = Number.parseFloat(absMatch[1] || DEFAULT_TOLERANCE);
      } else if (modMatch) {
        modulus = Number.parseFloat(modMatch[4]);
        tolerance = Number.parseFloat(modMatch[1] || DEFAULT_TOLERANCE);
      } else {
        tolerance = attributeMap[attr] || DEFAULT_TOLERANCE;
      }

    } else if ((typeof attributeMap[attr]) === 'number') {
      tolerance = attributeMap[attr];
    } else {
      tolerance ||= DEFAULT_TOLERANCE;
    }
  }
  return {tolerance, absoluteValue, singleValue, modulus};
}

const relitiveTolerance = (value, tol) => {
  if (value < 1) return tol;
  const log10Floored = Math.floor(Math.log10(value) + 1);
  return log10Floored ? Math.roundTo(Math.pow(10, log10Floored)*tol, tol) : tol;
}
// TODO: modulus would be useful but I dont think it works yet
function boundsFunc(attr, attributeMap, tolerance, absoluteValue, modulus) {
  const props = parseTolAbs(attr, attributeMap, tolerance, absoluteValue, modulus);
  return (elem) => {
    const tol = props.tolerance;
    let value = props.singleValue ? elem : Object.pathValue(elem, attr);
    if (props.absoluteValue && value < 0) value *= -1;
    let lower, upper, center;
    if (Number.NaNfinity(value)) return {value, lower: value, upper: value, id: rangeStr(Infinity * value, Infinity * value)};
    else {
      value = Math.roundTo(value, tol);
      const relitiveTol = relitiveTolerance(value, tol);
      const target = Math.roundTo(Math.floor(Math.roundTo(value / relitiveTol, tol)) * relitiveTol);
      const bounds = {
        value, target,
        upper: Math.roundTo(target + relitiveTol, tol),
        lower: Math.roundTo(target - relitiveTol, tol),
      }
      let lowerTol = relitiveTol;
      let upperTol = relitiveTol;
      if (bounds.target > tol) {
        if (bounds.lower === 0) {
          bounds.lower = Math.roundTo(bounds.target - bounds.target/10, tol);
          lowerTol = relitiveTolerance(bounds.target - bounds.target/10, tol);
        }
        if (bounds.upper % 10 === 0) {
          upperTol = relitiveTolerance(bounds.upper, tol);
        }
      }
      //
      // const mod = Math.mod(value, tol);
      // let center = mod > tol/2 ? value + (tol - mod) : value - mod;
      // if (center > props.modulus - tol) center = 0;
      // if (absoluteValue) center = Math.abs(center);
      // lower = center - tol;
      // upper = center + tol;
      // if (props.modulus) {
      //   lower = Math.mod(lower, props.modulus);
      //   upper = Math.mod(upper, props.modulus);
      // }
      // lower = round(lower);
      // upper = round(upper);
      // // if (lower>upper) {const temp = lower; lower = upper; upper = temp;}
      bounds.prevId = rangeStr(bounds.lower, bounds.target);
      bounds.id = rangeStr(bounds.target, bounds.upper);
      bounds.nextId = rangeStr(bounds.upper, bounds.upper + upperTol);
      if (!props.modulus && lower > upper)
        console.warn.subtle(`Bounding limits may be incorrect: ${id}`);
      return bounds;
    }
  }
}

const isZero = (v, ZERO) => v <= ZERO && v >= -ZERO;
const stringTolReg = /\+(([0-9]{1,}|)(\.[0-9]{1,}|))/;
const stringModulusReg = /^(([0-9]{1,}|)(\.[0-9]{1,}|))%(([0-9]{1,}|)(\.[0-9]{1,}))/;
function withinBounds(attr, attributeMap, tolerance, absoluteValue, modulus) {
  const props = parseTolAbs(attr, attributeMap, tolerance, absoluteValue, modulus);
  const func = (value1, value2) => {
    if (Number.isNaN(value1) && Number.isNaN(value2)) return true;
    if (value1 === Infinity && value2 === Infinity) return true;
    if (value1 === -Infinity && value2 === -Infinity) return true;
    if (isZero(value1, props.tolerance) && isZero(value2, props.tolerance))
      return Math.difference(value1, value2) < props.tolerance;
    if (props.absoluteValue) {
      value1 = Math.abs(value1);
      value2 = Math.abs(value2);
    }
    if (props.modulus) {
      const lower = Math.mod(value1 < value2 ? value1 : value2, props.modulus);
      const upper = Math.mod(value1 > value2 ? value1 : value2, props.modulus);
      if (lower>upper) {
        const modDiff = ((upper + props.modulus) + (props.modulus - lower));
        return modDiff < props.tolerance;
      }
    }
    if (value1 === value2) return true;
   return Math.difference(1, (value1 / value2)) < props.tolerance;  }
  func.tolerance = props.tolerance;
  func.absoluteValue = props.absoluteValue;
  func.singleValue = props.singleValue;
  return func;
}

const compoundReg = /^(.*)\(([^)]{1,}?)\)(.*)$/
function resolveAttrs(map) {
  const finalMap = {};
  const attrs = Object.keys(map);
  const compoundAttrs = attrs.filter(attr => attr.match(compoundReg))
  if (compoundAttrs.length === 0) return map;
  while(compoundAttrs.length > 0) {
    const ca = compoundAttrs[compoundAttrs.length - 1];
    let match = ca.match(compoundReg);
    if (match === null) {
      finalMap[ca] = map[ca];
      compoundAttrs.pop();
    } else {
      compoundAttrs.pop();
      const split = match[2].split(',');
      split.forEach(v => {
        const attr = match[1] + v + match[3];
        map[attr] = map[ca];
        compoundAttrs.push(attr);
      });
    }
  }
  return finalMap;
}

class Tolerance {
  constructor(attributeMap, absoluteValue, modulus) {
    let tolerance = (typeof attributeMap) === 'number' ? attributeMap : DEFAULT_TOLERANCE;
    attributeMap ||= {};
    attributeMap = resolveAttrs(attributeMap);
    let within, bounds;
    const attrs = Object.keys(attributeMap);
    const singleValue = attrs.length === 0;
    this.bounds = {};
    if (singleValue) {
      tolerance ||= DEFAULT_TOLERANCE;
      bounds = boundsFunc(undefined, undefined, tolerance, absoluteValue, modulus);
      within = withinBounds(undefined, undefined, tolerance, absoluteValue, modulus);
      this.bounds = bounds;
    }

    this.attributes = () => attrs.map(a => a);

    this.elemHash = (elem) => {
      if (singleValue) return elem.toString().hash();
      if (!elem._TOLERANCE_ID) elem._TOLERANCE_ID = String.random();
      let str = elem._TOLERANCE_ID;
      for (let index = 0; index < attrs.length; index++) {
        const attr = attrs[index];
        str += ':' + Object.pathValue(elem, attr);
      }
      return str.hash()  + Object.hash(elem);
    }

    this.details = (elem) => {
      if (singleValue) return bounds(elem);
      let details = {};
      for (let index = 0; index < attrs.length; index++) {
        details[attrs[index]] = this.bounds[attrs[index]](elem);
      }
      return details;
    }

    this.boundries = (elem) => {
      if (singleValue) return bounds(elem).id;
      let boundries = '';
      for (let index = 0; index < attrs.length; index++) {
        boundries += this.bounds[attrs[index]](elem).id + '\n';
      }
      return boundries.substr(0,boundries.length - 1);
    }

    for (let index = 0; index < attrs.length; index++) {
      const attr = attrs[index];
      this.bounds[attr] = boundsFunc(attr, attributeMap);
      this.bounds[attr].within = withinBounds(attr, attributeMap);
    }

    this.within = (elem1, elem2, modulus) => {
      if (singleValue) return within(elem1, elem2);
      let isWithin = true;
      for (let index = 0; index < attrs.length; index++) {
        const attr = attrs[index];
        const value1 = Object.pathValue(elem1, attr);
        const value2 = Object.pathValue(elem2, attr);
        if (modulus) isWithin &&= this.bounds[attr].within(value1, value2);
        else isWithin &&= this.bounds[attr].within(value1, value2);
        if (!isWithin) return false;
      }
      return isWithin;
    }
  }
}

Tolerance.within = (tol) => new Tolerance({'value': tol}).bounds.value.within;

module.exports = Tolerance;
