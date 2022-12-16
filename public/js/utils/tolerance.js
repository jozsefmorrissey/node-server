

class Tolerance {
  constructor(attributeMap) {
    const attrs = Object.keys(attributeMap);
    this.bounds = {};
    this.attributes = () => attrs;

    function round(val) {
      return Math.round(1000000000000 * val)/1000000000000
    }

    function decimalLimit(value, limit) {
      return (new String(value)).replace(/([0-9]{1,})(.[0-9]{1,}|)/, '$2').length > limit;
    }

    function bounds(attr) {
      return (elem) => {
        const tol = attributeMap[attr];
        const value = Object.pathValue(elem, attr);
        let lower, upper;
        if (Number.NaNfinity(value)) lower = upper = value;
        else {
          const mod = value % tol;
          const center = mod > tol/2 ? value + (tol - mod) : value - mod;
          lower = round(center - tol);
          upper = round(center + tol);
          if (lower>upper) {const temp = lower; lower = upper; upper = temp;}
        }
        const id = `${lower} => ${upper}`;
        if (decimalLimit(lower, 10) || decimalLimit(upper, 10))
          console.warn(`Bounding limits may be incorrect: ${id}`);
        return {lower, upper, id};
      }
    }

    this.boundries = (elem) => {
      let boundries = '';
      for (let index = 0; index < attrs.length; index++) {
        boundries += this.bounds[attrs[index]](elem).id + '\n';
      }
      return boundries.substr(0,boundries.length - 1);
    }

    function withinBounds(attr) {
      return (value1, value2) => {
        if (value1 === value2) return true;
        const tolerance = attributeMap[attr];
        return Math.abs(value1 - value2) < tolerance;
      }
    }

    for (let index = 0; index < attrs.length; index++) {
      const attr = attrs[index];
      this.bounds[attr] = bounds(attr);
      this.bounds[attr].within = withinBounds(attr);
    }

    this.within = (elem1, elem2) => {
      let within = true;
      for (let index = 0; index < attrs.length; index++) {
        const attr = attrs[index];
        const value1 = Object.pathValue(elem1, attr);
        const value2 = Object.pathValue(elem2, attr);
        within &&= this.bounds[attr].within(value1, value2);
        if (!within) return false;
      }
      return within;
    }
  }
}

module.exports = Tolerance;
