
const DEFAULT_TOLERANCE = .0001;

function round(val) {
  return Math.round(1000000000000 * val)/1000000000000
}

function decimalLimit(value, limit) {
  return (new String(value)).replace(/([0-9]{1,})(.[0-9]{1,}|)/, '$2').length > limit;
}

function rangeStr(lower, upper) {
  return `${round(lower)} => ${round(upper)}`;
}

function boundsFunc(attr, attributeMap, tolerance) {
  const singleValue = attr === undefined;
  return (elem) => {
    const tol = singleValue ? tolerance : attributeMap[attr];
    const value = singleValue ? elem : Object.pathValue(elem, attr);
    let lower, upper, center;
    if (Number.NaNfinity(value)) return {lower: value, upper: value, id: rangeStr(value, value)};
    else {
      const mod = value % tol;
      const center = mod > tol/2 ? value + (tol - mod) : value - mod;
      lower = round(center - tol);
      upper = round(center + tol);
      if (lower>upper) {const temp = lower; lower = upper; upper = temp;}
      const prevId = rangeStr(lower - tol, center);
      const id = rangeStr(lower, upper);
      const nextId = rangeStr(center, upper + tol);
      if (decimalLimit(lower, 10) || decimalLimit(upper, 10))
        console.warn.subtle(`Bounding limits may be incorrect: ${id}`);
      return {lower, upper, prevId, id, nextId};
    }
  }
}

function withinBounds(attr, attributeMap, tolerance) {
  const singleValue = attr === undefined;
  return (value1, value2) => {
    if (value1 === value2) return true;
    const tol = singleValue ? tolerance : attributeMap[attr];
    return Math.abs(value1 - value2) < tol;
  }
}

class Tolerance {
  constructor(attributeMap, tolerance) {
    attributeMap ||= {};
    let within, bounds;
    const attrs = Object.keys(attributeMap);
    const singleValue = attrs.length === 0;
    this.bounds = {};
    if (!singleValue)
      this.attributes = () => attrs;
    else {
      tolerance ||= DEFAULT_TOLERANCE;
      bounds = boundsFunc();
      within = withinBounds(undefined, undefined, tolerance);
    }

    this.finalAttr = () => attrs[attrs.length - 1];


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

    this.within = (elem1, elem2) => {
      if (singleValue) return within(elem1, elem2);
      let isWithin = true;
      for (let index = 0; index < attrs.length; index++) {
        const attr = attrs[index];
        const value1 = Object.pathValue(elem1, attr);
        const value2 = Object.pathValue(elem2, attr);
        isWithin &&= this.bounds[attr].within(value1, value2);
        if (!isWithin) return false;
      }
      return isWithin;
    }
  }
}

module.exports = Tolerance;
