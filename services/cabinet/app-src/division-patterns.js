afterLoad.push(() => matchRun('change', '.feature-radio', (target) => {
  const allRadios = document.querySelectorAll(`[name="${target.name}"]`);
  allRadios.forEach((radio) => radio.nextElementSibling.hidden = true);
  target.nextElementSibling.hidden = !target.checked;
})
)

class Pattern {
  constructor(str) {
    this.str = str;
    let unique = {};
    for (let index = 0; index < str.length; index += 1) {
      unique[str[index]] = true;
    }
    unique = Object.keys(unique).join('');
    this.unique = unique;
    console.log('uniq', unique);
    class Element {
      constructor(id, index, count) {
        this.id = id;
        this.count = count || 1;
        this.indexes = [index];
      }
    }

    if ((typeof str) !== 'string' || str.length === 0)
      throw new Error('Must define str (arg0) as string of length > 1');

    const elements = {};
    for (let index = 0; index < str.length; index += 1) {
      const char = str[index];
      if (elements[char]) {
        elements[char].count++;
        elements[char].indexes.push(index);
      } else {
        elements[char] = new Element(char, index);
      }
    }

    const values = {};
    const updateOrder = [];
    this.ids = Object.keys(elements);
    this.size = str.length;
    let lastElem;
    this.satisfied = () => updateOrder.length === unique.length - 1;

    const calc = (dist) => {
      const values = {};
      updateOrder.forEach((id) => {
        const elem = elements[id];
        dist -= elem.count * elem.value;
        values[elem.id] = elem.value;
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
        lastElem.value = dist / lastElem.count;
        values[lastElem.id] = lastElem.value;
      }
      const list = [];
      const fill = [];
      if (lastElem)
        for (let index = 0; index < unique.length; index += 1)
          fill[index] = values[unique[index]];
      for (let index = 0; index < str.length; index += 1)
        list[index] = values[str[index]];
      const retObj = {values, list, fill};
      return retObj;
    }

    this.value = (id, value) => {
      if ((typeof id) === 'number') id = unique[id];
      if ((typeof value) === 'number') {
        const index = updateOrder.indexOf(id);
        if (index !== -1) updateOrder.splice(index, 1);
        updateOrder.push(id);
        if (updateOrder.length === this.ids.length) {
          lastElem = elements[updateOrder[0]];
          updateOrder.splice(0, 1);
        }
        elements[id].value = value;
      } else {
        return elements[id].value;
      }
    }

    this.elements = elements;
    this.calc = calc;
  }
}

const p1 = new Pattern('babcdaf');
p1.value('b', 2);
p1.value('a', 2);
p1.value('c', 3);
p1.value('d', 4);
p1.value('b', 2);
p1.value('f', 5);
p1.calc(20);
const p2 = new Pattern(' // ^^%');
