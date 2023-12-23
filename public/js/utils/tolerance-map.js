
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
  constructor(attributeMap, toleranceMap, absoluteValue) {
    const map = toleranceMap || {};
    const tolerance = new Tolerance(attributeMap, null, absoluteValue);
    const instance = this;

    this.clone = (newElems) => {
      const tMap = new ToleranceMap(attributeMap);
      this.forEach(value => tMap.add(value));
      tMap.addAll(newElems);
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
        const matchList = list.filter((other) => true || tolerance.within(elem, other));
        matchList.sortByAttrs(tolerance.attributes());

        // TODO: I feel like the algorithum could prevent duplications if written correctly.... maybe not
        return matchList.unique();
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
      maxSet.sortByAttrs(tolerance.attributes());
      maxSet.reverse();
      return maxSet;
    }
    this.minSet = () => {
      const minSet = [];
      forEachSet((set) => minSet.push(set[set.length - 1]));
      minSet.sortByAttrs(tolerance.attributes());
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
      matchArr.sortByAttrs(tolerance.attributes());
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

    function averageObject(list) {
      const obj = {};
      const attrs = Object.keys(attributeMap);
      for (let index = 0; index < attrs.length; index++) {
        Object.pathValue(obj, attrs[index], 0);
      }
      let total = 0;
      for (let index = 0; index < list.length; index++) {
        for (let aIndex = 0; aIndex < attrs.length; aIndex++) {
          const path = attrs[aIndex];
          const currTotal = Object.pathValue(obj, path);
          const value = Object.pathValue(list[index], path);
          const addValue = value === 0 ? 0 : value / list.length;
          if (addValue != 0) Object.pathValue(obj, path, currTotal + addValue);
          total += addValue;
        }
      }
      // if (!Number.isFinite(total)) throw new Error('Object containes attribue that returns a non-finite value. This is unacceptable');
      return obj;
    }

    function bestGroup(list) {
      const avgObj = averageObject(list);
      return instance.matches(avgObj);
    }

    this.distance = (elem1, elem2) => {
      const maxDist = 0;
      const attrs = Object.keys(attributeMap);
      for (let aIndex = 0; aIndex < attrs.length; aIndex++) {
        const path = attrs[aIndex];
        const val1 = Object.pathValue(elem1, path);
        const val2 = Object.pathValue(elem2, path);
        const tol = tolerance.bounds[path].within.tolerance;
        const dist = Math.abs(val1 - val2) / tol;
        if (dist > maxDist) maxDist = dist;
      }
      return maxDist;
    }

    const filterAlreadyFound = (spokenFor, onDeck) => (e) => {
      const hash = tolerance.elemHash(e);
      return !spokenFor[hash] && !onDeck[hash];
    }

    this.group = () => {
      const values = this.values();
      const spokenFor = {};
      const groups = [];
      const matches = [];
      while (values.length > 0) {
        const elem = values[0];
        const onDeck = {};
        let newMatches = this.matches(elem)
                          .filter(filterAlreadyFound(spokenFor, onDeck));
        newMatches.forEach(e => onDeck[tolerance.elemHash(e)] = true);
        let moreMatchesFound = true;
        while(moreMatchesFound) {
          const startMatches = this.matches(newMatches[0])
                                .filter(filterAlreadyFound(spokenFor, onDeck));
          const endMatches = this.matches(newMatches[newMatches.length - 1])
                                .filter(filterAlreadyFound(spokenFor, onDeck));
          if (startMatches.length > 0 && endMatches.length > 0) {
            if (this.distance(startMatches[0], endMatches[endMatches.length - 1]) < 3) {
              newMatches = startMatches.concat(newMatches.concat(endMatches));
              newMatches.forEach(e => onDeck[tolerance.elemHash(e)] = true);
              moreMatchesFound = true;
            } else moreMatchesFound = false;
          }
          else moreMatchesFound = false;
        }
        const group = bestGroup(newMatches);
        for (let index = 0; index < group.length; index++) {
          spokenFor[tolerance.elemHash(group[index])] = true;
          values.splice(values.indexOf(group[index]), 1);
        }
        groups.push(group);
      }
      // TODO: I should sort this... but too lazy;
      return groups;
    }

    this.addAll = (list) => {
      if (!Array.isArray(list)) return;
      for (let index = 0; index < list.length; index++) {
        const elem = list[index];
        let matchArr = getSet(elem);
        matchArr.push(elem);
        matchArr.sortByAttrs(tolerance.attributes());
      }
    }

    this.map = () => map;
  }
}

module.exports = ToleranceMap;
