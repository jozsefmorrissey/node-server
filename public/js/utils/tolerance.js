
const DEFAULT_TOLERANCE = .0001;
const infinity = 1000000000;
const changeToInfinity = (value) =>
  value < infinity && value > -infinity ? value : value * Infinity;


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

function boundsFunc(attr, attributeMap, tolerance, absoluteValue, modulus) {
  const props = parseTolAbs(attr, attributeMap, tolerance, absoluteValue, modulus);
  return (elem) => {
    const tol = props.tolerance;
    let value = props.singleValue ? elem : Object.pathValue(elem, attr);
    value = changeToInfinity(value);
    if (props.absoluteValue && value < 0) value *= -1;
    let lower, upper, center;
    if (Number.NaNfinity(value)) return {lower: value, upper: value, id: rangeStr(Infinity * value, Infinity * value)};
    else {
      const mod = Math.mod(value, tol);
      let center = mod > tol/2 ? value + (tol - mod) : value - mod;
      if (center > props.modulus - tol) center = 0;
      if (absoluteValue) center = Math.abs(center);
      lower = center - tol;
      upper = center + tol;
      if (props.modulus) {
        lower = Math.mod(lower, props.modulus);
        upper = Math.mod(upper, props.modulus);
      }
      lower = round(lower);
      upper = round(upper);
      // if (lower>upper) {const temp = lower; lower = upper; upper = temp;}
      const prevId = rangeStr(lower - tol, center);
      const id = rangeStr(lower, upper);
      const nextId = rangeStr(center, upper + tol);
      if (!props.modulus && lower > upper)
        console.warn.subtle(`Bounding limits may be incorrect: ${id}`);
      return {lower, upper, prevId, id, nextId};
    }
  }
}

const stringTolReg = /\+(([0-9]{1,}|)(\.[0-9]{1,}|))/;
const stringModulusReg = /^(([0-9]{1,}|)(\.[0-9]{1,}|))%(([0-9]{1,}|)(\.[0-9]{1,}))/;
function withinBounds(attr, attributeMap, tolerance, absoluteValue, modulus) {
  const props = parseTolAbs(attr, attributeMap, tolerance, absoluteValue, modulus);
  const func = (value1, value2) => {
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
    if (props.modulus) {

    }
    return Math.abs(value1 - value2) < props.tolerance;
  }
  func.tolerance = props.tolerance;
  func.absoluteValue = props.absoluteValue;
  func.singleValue = props.singleValue;
  return func;
}

class Tolerance {
  constructor(attributeMap, tolerance, absoluteValue, modulus) {
    attributeMap ||= {};
    let within, bounds;
    const attrs = Object.keys(attributeMap);
    const singleValue = attrs.length === 0;
    this.bounds = {};
    if (singleValue) {
      tolerance ||= DEFAULT_TOLERANCE;
      bounds = boundsFunc(undefined, undefined, tolerance, absoluteValue, modulus);
      within = withinBounds(undefined, undefined, tolerance, absoluteValue, modulus);
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
