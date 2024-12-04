
const DecisionInputTree = require('../../../../../public/js/utils/input/decision/decision.js');
const Input = require('../../../../../public/js/utils/input/input.js');
const Select = require('../../../../../public/js/utils/input/styles/select.js');

class ColorManagerInputTree extends DecisionInputTree {
  constructor(color, colorManager) {
    const getSelect = (name, list) => new Select({
      name, list,
      inline: true,
      class: 'center',
      optional: true
    });

    const objects = () => colorManager.map()[color];
    const rootSelect = getSelect('root', Object.keys(objects()));
    super('', {inputArray: [rootSelect]}, {noSubmission: true});
    this.color = () => color;
    const instance = this;
    const colorInput = new Input({
      name: 'color',
      inline: true,
      label: '',
      value: color
    });

    function recursiveBuild(parentNode, objects, key, path) {
      const selectName = parentNode.inputArray()[0].name();
      const keys = Object.keys(objects);
      const select = getSelect(path, keys);

      const node = parentNode.then(path, {inputArray: [select]});
      const cond = DecisionInputTree.getCondition(selectName, key);
      node.conditions.add(cond, path);
      if (Array.isArray(objects)) {
        return;
      } else {
        keys.forEach(key => {
          recursiveBuild(node, objects[key], key, `${path}_${key}`);
        });
      }
      return node;
    }

    function build() {
      const objs = objects();
      Object.keys(objs).forEach(key  => {
        recursiveBuild(instance.root(), objs[key], key, key);
      });
    }

    build();
  }
}

module.exports = ColorManagerInputTree;
