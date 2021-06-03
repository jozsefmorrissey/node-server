class DivisionPattern {
  constructor() {
    this.patterns = {};
    const instance = this;
    this.filter = (dividerCount, config) => {
      const sectionCount = dividerCount + 1;
      if (sectionCount < 2) return '';
      let filtered = '';
      let patternArr = Object.values(this.patterns);
      patternArr.forEach((pattern) => {
        if (pattern.restrictions === undefined || pattern.restrictions.indexOf(sectionCount) !== -1) {
          const name = pattern.name;
          filtered += `<option value='${name}' ${config.name === name ? 'selected' : ''}>${name}</option>`;
        }
      });
      this.inputStr
      return filtered;
    }
    this.add = (name, resolution, inputArr, restrictions) => {
      inputArr = inputArr || [];
      let inputHtml =  (fill) => {
        let html = '';
        inputArr.forEach((label, index) => {
          const value = fill ? fill[index] : '';
          const labelTag = ``;
          const inputTag = ``;
          html += labelTag + inputTag;
        });
        return html;
      }
      this.patterns[name] = {name, resolution, restrictions, inputHtml, inputArr};
    }

    afterLoad.push(() => {
      matchRun('change', '.open-pattern-select', (target) => {
        const openingId = up('.opening-cnt', target).getAttribute('opening-id');
        const opening = OpenSectionDisplay.sections[openingId];
        OpenSectionDisplay.refresh(opening);
      });

      matchRun('keyup', '.division-pattern-input', updateDivisions);
    });
  }
}

DivisionPattern = new DivisionPattern();

DivisionPattern.add('Unique',() => {

});

DivisionPattern.add('Equal', (length, index, value, sectionCount) => {
  const newVal = length / sectionCount;
  const list = new Array(sectionCount).fill(newVal);
  return {list};
});

DivisionPattern.add('1 to 2', (length, index, value, sectionCount) => {
  if (index === 0) {
    const twoValue = (length - value) / 2;
    const list = [value, twoValue, twoValue];
    const fill = [value, twoValue];
    return {list, fill};
  } else {
    const oneValue = (length - (value * 2));
    const list = [oneValue, value, value];
    const fill = [oneValue, value];
    return {list, fill};
  }
}, ['first(1):', 'next(2)'], [3], [5.5]);

DivisionPattern.add('2 to 2', (length, index, value, sectionCount) => {
  const newValue = (length - (value * 2)) / 2;
  if (index === 0) {
    const list = [value, value, newValue, newValue];
    const fill = [value, newValue];
    return {list, fill};
  } else {
    const list = [newValue, newValue, value, value];
    const fill = [newValue, value];
    return {list, fill};
  }
}, ['first(2):', 'next(2)'], [4]);

DivisionPattern.add('1 to 3', (length, index, value, sectionCount) => {
  if (index === 0) {
    const threeValue = (length - value) / 3;
    const list = [value, threeValue, threeValue, threeValue];
    const fill = [value, threeValue];
    return {list, fill};
  } else {
    const oneValue = (length - (value * 3));
    const list = [oneValue, value, value, value];
    const fill = [oneValue, value];
    return {list, fill};
  }
}, ['first(1):', 'next(3)'], [4], 5.5);

afterLoad.push(() => matchRun('change', '.feature-radio', (target) => {
  const allRadios = document.querySelectorAll(`[name="${target.name}"]`);
  allRadios.forEach((radio) => radio.nextElementSibling.hidden = true);
  target.nextElementSibling.hidden = !target.checked;
})
)

class Pattern {
  constructor(str) {
    this.str = str;
    class Element {
      constructor(id, index) {
        this.id = id;
        this.count = 1;
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

    const calc = (dist) => {
      const values = {};
      updateOrder.forEach((id) => {
        const elem = elements[id];
        dist -= elem.count * elem.value;
        values[elem.id] = elem.value;
      });
      if (lastElem !== undefined) {
        lastElem.value = dist / lastElem.count;
        values[lastElem.id] = lastElem.value;
      }
      console.log('vals:', values);
      return values;
    }

    this.value = (id, value) => {
      if ((typeof value) === 'number') {
        const index = updateOrder.indexOf(id);
        if (index !== -1) updateOrder.splice(index, 1);
        updateOrder.push(id);
        if (updateOrder.length === this.ids.length) {
          lastElem = elements[updateOrder[0]];
          updateOrder.splice(0, 1);
        } else if (updateOrder.length === this.ids.length - 1) {
          updateOrder.forEach((id) => {
            if (elements[id].value === undefined) {
              lastElem = elements[id];
            }
          })
        }
        elements[id].value = value;
      } else {
        return elements[id].value;
      }
    }

    this.calc = calc;
    this.elements = elements;
    console.log('breakdown:', this);
  }
}

const p1 = new Pattern('aabcdf');
p1.value('b', 2);
p1.value('a', 2);
p1.value('c', 3);
p1.value('d', 4);
p1.value('b', 2);
p1.value('f', 5);
p1.calc(20);
const p2 = new Pattern(' // ^^%');
