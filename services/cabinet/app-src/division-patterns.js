
const Measurement = require('../../../public/js/utils/measurement.js');
const CustomEvent = require('../../../public/js/utils/custom-event.js');

function alphaSorter(a, b) {
  al = a.toLowerCase();
  bl = b.toLowerCase();
  if (al !== bl) {
    let sum = 0;
    for (let j = 0; j < a.length; j++) {
      const multiplier = a.length - j;
      sum += al.charCodeAt(j) * multiplier;
      sum -= bl.charCodeAt(j) * multiplier;
    }
    return sum;
  }
  if (a === b) return 0;
  return al === a ? 1 : -1;
}

const valueMap = {
  default: {
    'a': new Measurement(6, true),
    'b': new Measurement(10, true),
    'c': new Measurement(12, true)
  },
  set: (id, value, key, force) => {
    key || 'default';
    if (valueMap[key] === undefined) valueMap[key] = {};
    if (force || valueMap[key][id] === undefined) valueMap[key][id] = value;
    return valueMap[key][id];
  }
};
function bestGuess(char, group) {
  group ||= 'default';
  if (valueMap[group] === undefined) {
    valueMap[group] = JSON.clone(valueMap.default);
  }
  return valueMap[group][char] || new Measurement(4, true);
}

class Element {
  constructor(id, index, group) {
    let value;
    this.id = id;
    this.count = 1;
    this.indexes = [index];
    this.fixed = false;
    this.value = (val) => {
      if (val) {
        value = val;
      }
      return value || bestGuess(id, group);
    }
  }
}

class Pattern {
  constructor(str, props) {
    props ||= {};
    let changeEvent = props.changeEvent;
    changeEvent ||= new CustomEvent('change');
    const instance = this;
    let unique, uniqueStr, elements, values;

    this.onChange = changeEvent.on;
    this.unique = () => uniqueStr;
    this.equals = this.unique.length === 1;

    this.clone = (str) => {
      const clone = new Pattern(str, props);
      clone.elements = elements;
      setTimeout(() => changeEvent.trigger(null, clone), 10);
      return clone;
    }

    this.values = () => {
      const valueObj = {};
      const elems = Object.values(elements);
      const uniqueVals = Object.values(unique);
      const updateOrder = uniqueVals.map(uv => uv.char).sort(alphaSorter).slice(0, -1);
      elems.forEach((elem) => {
        const value = elem.value().decimal();
        if (updateOrder.indexOf(elem.id) !== -1 && Number.isFinite(value))
          valueObj[elem.id] = value;
      });
      return valueObj;
    }

    function setStr(string) {
      instance.str = string;
      unique = {};
      for (let index = 0; index < string.length; index += 1) {
        const char = string[index];
        if (unique[char] === undefined) {
          unique[char] = {char, count: 1};
        } else {
          unique[char].count++;
        }
      }
      uniqueStr = Object.keys(unique).join('');

      if ((typeof string) !== 'string' || string.length === 0)
      throw new Error('Must define str (arg0) as string of length > 1');

      elements = {};
      values = {};
      for (let index = 0; index < string.length; index += 1) {
        const char = string[index];
        if (elements[char]) {
          elements[char].count++;
          elements[char].indexes.push(index);
        } else {
          elements[char] = new Element(char, index, props.group);
        }
      }
      instance.ids = Object.keys(elements);
      instance.size = string.length;
    }
    this.setStr = setStr;

    this.satisfied = () => {throw new Error('dont know where this is used');}

    function onlyOneUnique(uniqueVals, dist) {
      const count = uniqueVals[0].count;
      const value = dist / count;
      const values = new Array(count).fill(value);
      const list = new Array(count).fill(value);
      const fill = [new Measurement(value).display()];
      return {values, list, fill, str: instance.str};
    }

    function numbersOnly(uniqueVals, dist) {
      const str = instance.str;
      let count = 0;
      for (let index = 0; index < str.length; index += 1) {
        count += Number.parseInt(str.charAt(index));
      }
      const unitDist = dist / count;
      let retObj = {list: [], fill: [], str, values: {}};
      for (let index = 0; index < str.length; index += 1) {
        const char = str.charAt(index);
        const units = Number.parseInt(char);
        const value = units * unitDist;
        retObj.list[index] = value;
        if (retObj.values[index] === undefined) {
          retObj.values[index] = value;
          retObj.fill[index] = new Measurement(value).display();
        }
      }
      return retObj;
    }

    const numbersOnlyReg = /^[0-9]{1,}$/;
    let lastDist;
    const calc = (dist) => {
      if (dist < 0) throw new Error(`Im not dividing that negitive '${dist}'`);
      if (dist === undefined) dist = lastDist;
      lastDist = dist;
      // map of unitValues
      const values = {};

      const uniqueVals = Object.values(unique);
      if (uniqueVals.length === 1) return onlyOneUnique(uniqueVals, dist);

      if (this.str.trim().match(numbersOnlyReg)) return numbersOnly(uniqueVals, dist);

      const updateOrder = uniqueVals.map(uv => uv.char).sort(alphaSorter).slice(0);
      let lastElem;
      updateOrder.forEach((id, index) => {
        if (index < updateOrder.length - 1) {
          const elem = elements[id];
          dist -= elem.count * elem.value().decimal();
          values[elem.id] = elem.value().value();
        } else {
          lastElem = elements[id];
        }
      });
      if (lastElem === undefined) throw new Error('This should not happen');

      const lastVal = dist / lastElem.count;
      if (lastVal < 0) {
        // throw new Error('Invalid size/pattern');
        console.warn('Invalid size/pattern');
      }
      let lastMeas = new Measurement(lastVal);
      values[lastElem.id] = lastMeas.value();

      const list = [];
      let fill = [];
      for (let index = 0; index < this.str.length; index += 1)
        list[index] = values[this.str[index]];
      for (let index = 0; index < uniqueVals.length; index += 1) {
        const elem = elements[uniqueVals[index].char];
        if (elem.id === lastElem.id) {
          fill[index] = lastMeas.display();
        } else {
          fill[index] = elem.value().display();
        }
      }
      const retObj = {values, list, fill, str: this.str};
      return retObj;
    }

    this.value = (id, value) => {
      if (value < 0) value = 0;
      if (value !== undefined) {
        value = elements[id].value(new Measurement(value));
        valueMap.set(id, elements[id].value(), props.group);
        changeEvent.trigger(null, this);
        return value;
      } else {
        const elem = elements[id];
        return elem ? elem.value().decimal() : bestGuess(id, props.group);
      }
    }

    this.display = (id) => elements[id].value().display();

    this.toJson = () => {
      return {str: this.str, values: this.values(), props: Object.toJson(props)};
    }
    this.toString = () => `${this.str}@(${Array.from(this.str).map(c => instance.value(c)).join(',')})`;

    this.hash = () => this.toString().hash();

    this.elements = elements;
    this.calc = calc;

    setStr(str);
  }
}

Pattern.fromJson = (json) => {
  const pattern = new Pattern(json.str, Object.fromJson(json.props));
  const keys = Object.keys(json.values);
  keys.forEach((key) => pattern.value(key, json.values[key]));
  return pattern;
};

module.exports = Pattern
