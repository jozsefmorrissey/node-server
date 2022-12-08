

class Tolerance {
  constructor(attributeMap) {
    const attrs = Object.keys(attributeMap);
    this.bounds = {};
    this.attributes = () => attrs;

    function bounds(attr) {
      return (elem) => {
        const tol = attributeMap[attr];
        const value = Object.pathValue(elem, attr);
        const mod = Math.mod(value, tol);
        const lowerLimit = value - mod;
        const upperLimit = value + (tol - mod);
        const id = `${lowerLimit} => ${upperLimit}`;
        return {lowerLimit, upperLimit, id};
      }
    }

    for (let index = 0; index < attrs.length; index++) {
      const attr = attrs[index];
      this.bounds[attr] = bounds(attr);
    }

    this.within = (elem1, elem2) => {
      let within = true;
      for (let index = 0; index < attrs.length; index++) {
        const attr = attrs[index];
        const value1 = Object.pathValue(elem1, attr);
        const value2 = Object.pathValue(elem2, attr);
        const tolerance = attributeMap[attr];
        within &&= Math.abs(value1 - value2) < tolerance;
        if (!within) return false;
      }
      return within;
    }
  }
}

module.exports = Tolerance;
