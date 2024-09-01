
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

const DEFAULT = {
    'a': new Measurement(6, true),
    'b': new Measurement(10, true),
    'c': new Measurement(12, true)
}

function bestGuess(char, getter) {
  if (getter) {
    const val = getter(char);
    if (val) return new Measurement(val);
  }
  return DEFAULT[char] || new Measurement(4, true);
}

class Element {
  constructor(id, index, getter) {
    let value;
    this.id = id;
    this.count = () => this.indexes.length;
    this.indexes = [index];
    this.disconnected = () => value !== undefined;
    this.reset = () => value = undefined;
    this.value = (val) => {
      if (val) {
        value = val;
      }
      return value || bestGuess(id, getter);
    }
  }
}

class Pattern {
  constructor(str, props) {
    props ||= {};
    let changeEvent = props.changeEvent;
    changeEvent ||= new CustomEvent('change');
    const instance = this;
    let uniqueStr, elements;
    if (props.elements && !Object.values(props.elements).find(e => !(e instanceof Element)))
      elements = props.elements;
    else
      elements = {};

    this.on = {};
    this.on.change = changeEvent.on;
    this.unique = () => uniqueStr;
    this.getter = (func) => func instanceof Function ? (props.getter = func) : props.getter;

    this.clone = (str) => {
      props.elements = elements;
      const clone = new Pattern(str, props);
      setTimeout(() => changeEvent.trigger(null, clone), 10);
      return clone;
    }

    this.values = () => {
      const valueObj = {};
      const elems = Object.values(elements);
      elems.forEach((elem) => {
        if (elem.disconnected()) {
          const value = elem.value().decimal();
          if (uniqueStr.indexOf(elem.id) !== uniqueStr.length -1 && Number.isFinite(value))
            valueObj[elem.id] = value;
        }
      });
      return valueObj;
    }

    this.values.reset = () => Object.values(elements).forEach(e => e.reset());
    const element = (char, index) => new Element(char, index, (char) => props.getter && props.getter(char));

    function setStr(string) {
      instance.str = string;
      uniqueStr = Array.from(string).unique().sort().join('');

      if ((typeof string) !== 'string' || string.length === 0)
      throw new Error('Must define str (arg0) as string of length > 1');

      const values = {};
      Object.values(elements).forEach(e => e.indexes = []);
      for (let index = 0; index < string.length; index += 1) {
        const char = string[index];
        if (elements[char]) {
          elements[char].indexes.push(index);
        } else {
          elements[char] = element(char, index);
        }
      }
      instance.ids = Object.keys(elements);
      instance.size = string.length;
    }
    this.setStr = setStr;

    this.satisfied = () => {throw new Error('dont know where this is used');}

    function onlyOneUnique(dist) {
      const count = elements[uniqueStr[0]].count();
      const value = dist / count;
      const values = new Array(count).fill(value);
      const list = new Array(count).fill(value);
      const fill = [new Measurement(value).display()];
      return {values, list, fill, str: instance.str};
    }

    function numbersOnly(dist) {
      const str = instance.str;
      let count = 0;
      for (let index = 0; index < str.length; index += 1) {
        count += Number.parseInt(str.charAt(index));
      }
      const unitDist = dist / count;
      let retObj = {list: [], fill: {}, str, values: {}};
      for (let index = 0; index < str.length; index += 1) {
        const char = str.charAt(index);
        const units = Number.parseInt(char);
        const value = units * unitDist;
        retObj.list[index] = value;
        if (retObj.values[index] === undefined) {
          retObj.values[index] = value;
          retObj.fill[char] = new Measurement(value).display();
        }
      }
      return retObj;
    }

    function alpaPattern(dist) {
      // map of unitValues
      const values = {};
      let lastElem;
      uniqueStr.foreach((id, index) => {
        if (index < uniqueStr.length - 1) {
          const elem = elements[id];
          dist -= elem.count() * elem.value().decimal();
          values[elem.id] = elem.value().value();
        } else {
          lastElem = elements[id];
        }
      });
      if (lastElem === undefined) throw new Error('This should not happen');

      const lastVal = dist / lastElem.count();
      if (lastVal < 0) {
        // throw new Error('Invalid size/pattern');
        console.warn('Invalid size/pattern');
      }
      let lastMeas = new Measurement(lastVal);
      values[lastElem.id] = lastMeas.value();

      const list = [];
      let fill = {};
      for (let index = 0; index < instance.str.length; index += 1)
        list[index] = values[instance.str[index]];
      for (let index = 0; index < uniqueStr.length; index += 1) {
        const elem = elements[uniqueStr[index]];
        if (elem.id === lastElem.id) {
          fill[elem.id] = lastMeas.display();
        } else {
          fill[elem.id] = elem.value().display();
        }
      }
      const retObj = {values, list, fill, str: instance.str};
      return retObj;
    }

    let lastDist;
    const calc = (dist) => {
      if (dist < 0) throw new Error(`Im not dividing that negitive '${dist}'`);
      if (dist === undefined) dist = lastDist;
      lastDist = dist;
      if (uniqueStr.length === 1) return onlyOneUnique(dist);

      if (this.isRatio()) return numbersOnly(dist);
      return alpaPattern(dist);
    }

    const numbersOnlyReg = /^[0-9]{1,}$/;
    this.isRatio = () => this.str.trim().match(numbersOnlyReg) !== null;

    this.value = (id, value) => {
      if (value < 0) value = 0;
      if (value !== undefined && uniqueStr.indexOf(id) !== -1) {
        value = elements[id].value(new Measurement(value));
        changeEvent.trigger(null, this);
        return value;
      } else {
        const elem = elements[id];
        return elem ? elem.value().decimal() : bestGuess(id, props.getter);
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
