
const Tolerance = require('tolerance');

class ToleranceMap {
  constructor(attributeMap) {
    const map = [];
    const tolerance = new Tolerance(attributeMap);

    function matches(elem, create) {
      let curr = map;
      let attrs = tolerance.attributes();
      for (let index = 0; index < attrs.length; index += 1) {
        const attr = attrs[index];
        const bounds = tolerance.bounds[attr](elem);
        const id = bounds.id;
        if (curr[id] === undefined) {
          if (create) {
            if (index < attrs.length -1) curr[id] = {};
            else curr[id] = [];
          } else return null;
        }
        curr = curr[id];
      }

      if (create) return curr;
      return curr.filter((elem2) => tolerance.within(elem, elem2));
    }

    this.tolerance = () => tolerance;

    this.matches = (elem) => matches(elem);

    this.add = (elem) => {
      let matchArr = matches(elem, true);
      matchArr.push(elem);
    }

    this.remove = (elem) => {
      const matchArr = matches(elem);
      if (matchArr) {
        const index = matchArr.indexOf(elem);
        if (index !== -1) matchArr.splice(index, 1);
      }
    }

    this.addAll = (list) => {
      for (let index = 0; index < list.length; index++) {
        const elem = list[index];
        let matchArr = matches(elem, true);
        matchArr.push(elem);
      }
    }

    this.map = () => map;
  }
}

module.exports = ToleranceMap;
