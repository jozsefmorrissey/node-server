
const Tolerance = require('tolerance');

function sortByAttr(attr) {
  function sort(obj1, obj2) {
    if (obj2[attr] === obj1[attr]) {
      return 0;
    }
    return obj2[attr]() < obj1[attr]() ? 1 : -1;
  }
  return sort;
}

class ToleranceMap {
  constructor(attributeMap, toleranceMap) {
    const map = toleranceMap || {};
    const tolerance = new Tolerance(attributeMap);
    const finalAttrSort = sortByAttr(tolerance.finalAttr());

    this.clone = () => {
      const tMap = new ToleranceMap(attributeMap);
      this.forEach(value => tMap.add(value));
      return tMap;
    }
    function forEachSet(func, node, attrs, attrIndex) {
      if ((typeof func) !== 'function') throw new Error('Arg1 must be of type function');
      if (Array.isArray(node)) {
        func(node);
        return;
      }
      if (attrs && !node) return;
      attrs ||= tolerance.attributes();
      node ||= map;
      attrIndex ||= 0;
      const keys = Object.keys(node);
      for (let index = 0; index < keys.length; index++) {
        forEachSet(func, node[keys[index]], attrs, attrIndex + 1);
      }
    }

    function matches(elem, node, attrs, list, attrIndex) {
      if (Array.isArray(node)) {
        list.concatInPlace(node);
        return;
      }
      if (attrs && !node) return;
      list ||= [];
      attrs ||= tolerance.attributes();
      node ||= map;
      attrIndex ||= 0;
      const attr = attrs[attrIndex];
      const bounds = tolerance.bounds[attr](elem);
      const id = bounds.id;
      matches(elem, node[bounds.nextId], attrs, list, attrIndex + 1);
      matches(elem, node[bounds.id], attrs, list, attrIndex + 1);
      matches(elem, node[bounds.prevId], attrs, list, attrIndex + 1);

      if (attrIndex === 0) {
        const matchList = list.filter((other) => tolerance.within(elem, other));
        matchList.sort(finalAttrSort);
        return matchList;
      }
    }

    function getSet(elem) {
      let curr = map;
      let attrs = tolerance.attributes();
      for (let index = 0; index < attrs.length; index += 1) {
        const attr = attrs[index];
        const bounds = tolerance.bounds[attr](elem);
        const id = bounds.id;
        if (curr[id] === undefined) {
          if (index < attrs.length -1) curr[id] = {};
          else curr[id] = [];
        }
        curr = curr[id];
      }

      return curr;
    }

    this.forEachSet = forEachSet;
    this.maxSet = () => {
      const maxSet = [];
      forEachSet((set) => maxSet.push(set[0]));
      maxSet.sort(finalAttrSort);
      maxSet.reverse();
      return maxSet;
    }
    this.minSet = () => {
      const minSet = [];
      forEachSet((set) => minSet.push(set[set.length - 1]));
      minSet.sort(finalAttrSort);
      return minSet;
    }
    this.forEach = (func, detailed) => {
      if (!(typeof func) === 'function') return;
      forEachSet(set => set.forEach((value) => {
        const details = detailed ? undefined : tolerance.details(value);
        func(value, details);
      }));
    };

    this.values = () => {
      const values = [];
      forEachSet(set => values.concatInPlace(set));
      return values;
    }
    this.tolerance = () => tolerance;

    this.matches = (elem) => matches(elem);

    this.add = (elem) => {
      let matchArr = getSet(elem);
      matchArr.push(elem);
      matchArr.sort(finalAttrSort);
    }

    this.remove = (elem) => {
      const matchArr = getSet(elem);
      if (matchArr) {
        const index = matchArr.indexOf(elem);
        if (index !== -1) matchArr.splice(index, 1);
      }
    }

    this.filter = (elem, filter) => {
      const matchArr = matches(elem);
      const filtered = filter(Array.from(matchArr), elem);
      const returnedArr = new Array(matchArr.length);
      for (let index = 0; index < filtered.length; index++) {
        const filElem = filtered[index];
        const origIndex = matchArr.indexOf(filElem);
        if (origIndex !== -1) returnedArr[origIndex] = filElem;
        else this.add(filElem);
      }
      let rmElemIndex = 0;
      while(-1 !== (rmElemIndex = returnedArr.indexOf(undefined, rmElemIndex))) {
        this.remove(matchArr[rmElemIndex]);
      }
    }

    this.addAll = (list) => {
      for (let index = 0; index < list.length; index++) {
        const elem = list[index];
        let matchArr = getSet(elem);
        matchArr.push(elem);
      }
      matchArr.sort(finalAttrSort);
    }

    this.map = () => map;
  }
}

module.exports = ToleranceMap;
