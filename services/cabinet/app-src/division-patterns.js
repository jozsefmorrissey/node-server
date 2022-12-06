
const Measurement = require('../../../public/js/utils/measurement.js');
const CustomEvent = require('../../../public/js/utils/custom-event.js');

const mostResent = {};
const defaullt = {'a': 6, 'b': 10, 'c': 12};
function bestGuess(char) {
  return mostResent[char] || defaullt[char] || 4;
}

class Element {
  constructor(id, index, count) {
    let value;
    this.id = id;
    this.count = count || 1;
    this.indexes = [index];
    this.value = (val) => {
      if (val !== undefined) {
        value = new Measurement(val);
      }
      return value;
    }
    this.value(bestGuess(id));
  }
}

class Pattern {
  constructor(str, updateOrder, changeEvent) {
    changeEvent ||= new CustomEvent('change');
    this.onChange = changeEvent.on;
    this.str = str;
    let unique = {};
    for (let index = 0; index < str.length; index += 1) {
      const char = str[index];
      if (unique[char] === undefined) {
        unique[char] = {char, count: 1};
      } else {
        unique[char].count++;
      }
    }
    const uniqueStr = Object.keys(unique).join('');
    this.unique = () => uniqueStr;
    this.equal = this.unique.length === 1;

    this.clone = (str) => {
      const clone = new Pattern(str, updateOrder, changeEvent);
      clone.elements = elements;
      setTimeout(() => changeEvent.trigger(null, clone), 10);
      return clone;
    }

    if ((typeof str) !== 'string' || str.length === 0)
      throw new Error('Must define str (arg0) as string of length > 1');

    const elements = {};
    const values = {};
    updateOrder ||= [];
    for (let index = 0; index < str.length; index += 1) {
      const char = str[index];
      if (elements[char]) {
        elements[char].count++;
        elements[char].indexes.push(index);
      } else {
        elements[char] = new Element(char, index);
      }
    }

    this.ids = Object.keys(elements);
    this.size = str.length;
    let lastElem;
    this.satisfied = () => updateOrder.length === uniqueStr.length - 1;

    function onlyOneUnique(uniqueVals, dist) {
      const count = uniqueVals[0].count;
      const value = dist / count;
      const values = new Array(count).fill(value);
      const list = new Array(count).fill(value);
      const fill = [new Measurement(value).display()];
      return {values, list, fill, str};
    }

    function numbersOnly(uniqueVals, dist) {
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
        if (retObj.values[char] === undefined) {
          retObj.values[char] = value;
          retObj.fill[retObj.list.fill.length] = value;
        }
      }
      return retObj;
    }

    function ensureValidUpdateOrder(uniqueVals) {
      for (let index = 0; index < updateOrder.length; index++) {
        if (uniqueVals[updateOrder[index]] === undefined) updateOrder.splice(index, 1);
      }
      for (let index = 0; index < uniqueVals.length; index++) {
        const char = uniqueVals[index].char;
        const orderTooShort = updateOrder.length < uniqueVals.length - 1;
        const includedInOrder = updateOrder.indexOf(char) !== -1;
        if (orderTooShort && !includedInOrder) updateOrder.push(char);
        else if (!orderTooShort && !includedInOrder) {
          lastElem = elements[uniqueVals[index].char];
        }
      }
      while (updateOrder.length > uniqueVals.length - 1) {
        lastElem = elements[updateOrder.splice(0, 1)[0]];
      }
    }

    const numbersOnlyReg = /^[0-9]{1,}$/;
    const calc = (dist) => {
      // map of unitValues
      const values = {};

      const uniqueVals = Object.values(unique);
      if (uniqueVals.length === 1) return onlyOneUnique(uniqueVals, dist);

      if (str.trim().match(numbersOnlyReg)) return numbersOnly(uniqueVals, dist);

      ensureValidUpdateOrder(uniqueVals);
      updateOrder.forEach((id) => {
        const elem = elements[id];
        dist -= elem.count * elem.value().decimal();
        values[elem.id] = elem.value().value();
      });
      if (lastElem === undefined) throw new Error('This should not happen');

      lastElem.value(new Measurement(dist / lastElem.count).value());
      values[lastElem.id] = lastElem.value().value();

      const list = [];
      let fill = [];
      for (let index = 0; index < str.length; index += 1)
        list[index] = values[str[index]];
      for (let index = 0; index < uniqueVals.length; index += 1) {
        fill[index] = elements[uniqueVals[index].char].value().display();
      }
      const retObj = {values, list, fill, str};
      return retObj;
    }

    this.value = (id, value) => {
      if (value !== undefined) {
        const index = updateOrder.indexOf(id);
        if (index !== -1) updateOrder.splice(index, 1);
        updateOrder.push(id);
        if (updateOrder.length === this.ids.length) {
          lastElem = elements[updateOrder[0]];
          updateOrder.splice(0, 1);
        }
        value = elements[id].value(value);
        changeEvent.trigger(null, this);
        mostResent[id] = value.decimal();
        return value;
      } else {
        return elements[id].value().decimal();
      }
    }

    this.display = (id) => elements[id].value().display();

    this.toJson = () => {
      const json = this.calc();
      delete json.list;
      delete json.fill;
      Object.keys(json.values).forEach((key) => {
        if (Number.isNaN(json.values[key])) {
          delete json.values[key];
        }
      })
      return json;
    }

    this.elements = elements;
    this.calc = calc;
  }
}

Pattern.fromJson = (json) => {
  const pattern = new Pattern(json.str);
  const keys = Object.keys(pattern.values);
  keys.foEach((key) => pattern.value(key, pattern.values[key]));
  return pattern;
};

const p1 = new Pattern('babcdaf');
p1.value('b', 2);
p1.value('a', 2);
p1.value('c', 3);
p1.value('d', 4);
p1.value('b', 2);
p1.value('f', 5);
p1.calc(20);
const p2 = new Pattern(' // ^^%');
module.exports = Pattern
