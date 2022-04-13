
const Measurement = require('../../../public/js/utils/measurement.js')

class Pattern {
  constructor(str) {
    this.str = str;
    let unique = {};
    for (let index = 0; index < str.length; index += 1) {
      unique[str[index]] = true;
    }
    unique = Object.keys(unique).join('');
    this.unique = unique;
    this.equal = this.unique.length === 1;
    class Element {
      constructor(id, index, count) {
        let value;
        this.id = id;
        this.count = count || 1;
        this.indexes = [index];
        this.value = (val) => {
          if (val !== undefined) {
            Pattern.mostResent[id] = val;
            value = new Measurement(val);
          }
          return value;
        }
      }
    }

    if ((typeof str) !== 'string' || str.length === 0)
      throw new Error('Must define str (arg0) as string of length > 1');

    const elements = {};
    const values = {};
    const updateOrder = [];
    for (let index = str.length - 1; index > -1; index -= 1) {
      const char = str[index];
      if (elements[char]) {
        elements[char].count++;
        elements[char].indexes.push(index);
      } else {
        elements[char] = new Element(char, index);
        if (Pattern.mostResent[char] !== undefined) {
          elements[char].value(Pattern.mostResent[char]);
          updateOrder.push(char);
        }
      }
    }

    this.ids = Object.keys(elements);
    this.size = str.length;
    let lastElem;
    this.satisfied = () => updateOrder.length === unique.length - 1;

    const calc = (dist) => {
      const values = {};
      updateOrder.forEach((id) => {
        const elem = elements[id];
        dist -= elem.count * elem.value().decimal();
        values[elem.id] = elem.value().value();
      });
      if (lastElem === undefined) {
        for (let index = 0; index < unique.length; index += 1) {
          const char = unique[index];
          if (!values[char]) {
            if (lastElem === undefined) lastElem = elements[char];
            else {lastElem = undefined; break;}
          }
        }
      }
      if (lastElem !== undefined) {
        lastElem.value(new Measurement(dist / lastElem.count).value());
        values[lastElem.id] = lastElem.value().value();
      }
      const list = [];
      const fill = [];
      if (lastElem)
        for (let index = 0; index < unique.length; index += 1)
          fill[index] = elements[unique[index]].value().display();
      for (let index = 0; index < str.length; index += 1)
        list[index] = values[str[index]];
      const retObj = {values, list, fill, str};
      return retObj;
    }

    this.value = (id, value) => {
      if ((typeof id) === 'number') id = unique[id];
      if (value !== undefined) {
        const index = updateOrder.indexOf(id);
        if (index !== -1) updateOrder.splice(index, 1);
        updateOrder.push(id);
        if (updateOrder.length === this.ids.length) {
          lastElem = elements[updateOrder[0]];
          updateOrder.splice(0, 1);
        }
        elements[id].value(value);
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
Pattern.mostResent = {};

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
