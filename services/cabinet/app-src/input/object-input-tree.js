
const Input = require('../../../../public/js/utils/input/input.js');
const Select = require('../../../../public/js/utils/input/styles/select.js');
const Radio = require('../../../../public/js/utils/input/styles/radio.js');
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const CabinetLayouts = require('../config/cabinet-layouts');
const Cabinets = require('../../public/json/cabinets.json');
const SimpleModel = require('../objects/simple/simple.js');

function typeTree(types, tree, node) {
  for(let index = 0; index < types.length; index++) {
    const type = types[index];
    const splitPath = type.split('-').reverse();
    let branch = node;
    let prevPath = '';
    for (let pIndex = 0; pIndex < splitPath.length; pIndex++) {
      const name = splitPath[pIndex];
      const path = prevPath ? `${prevPath}-${name}` : name;
      let nextBranch = tree.getByName(path);
      if (pIndex !== splitPath.length - 1) {
        if (nextBranch === undefined) {
          const branchType = path.replace(/^.*?-(.*)$/, '$1').split('-').reverse().join('-');
          const select = typeSelect('type', 'type', Cabinets[branchType]);
          const cond = DecisionInputTree.getCondition('type', name);
          nextBranch = branch.then(path, {inputArray: [select]});
          branch.conditions.add(cond, path);
        }
      }
      const inputArray = branch.payload ? branch.payload().inputArray : branch.inputArray;
      const selectList = inputArray[0].list();
      if (selectList.indexOf(name) === -1) selectList.push(name);
      branch = nextBranch;
      prevPath = path;
    }
  }
}

function objConcat(obj, nestedAttr, joinChar) {
  joinChar ||= '-';
  const value = obj[nestedAttr];
  if (!value) return;
  let values = [];
  let currObj = obj;
  const keys = Object.keys(currObj);
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    if (currObj[key] instanceof Object) {
      const childValues = objConcat(currObj[key], nestedAttr);
      if (childValues) {
        for (let cIndex = 0; cIndex < childValues.length; cIndex++) {
          values.push(`${value}${joinChar}${childValues[cIndex]}`);
        }
      }
    }
  }
  if (values.length > 0) return values;
  return [value]
}

const typeSelect = (name, label, allowEmpty) => {
  return new Select({
    name, label,
    inline: true,
    list: allowEmpty ? [''] : [],
    validation: () => true,
  });
}

module.exports = () => {
  const objectRadio = new Radio({
    name: 'objectType',
    inline: true,
    class: 'center',
    list: ['Cabinet', 'Other']
  });
  const typeInput = typeSelect('type', 'Type');
  typeInput.list().deleteAll();
  const nameInput = new Input({
    name: 'name',
    inline: true,
    label: 'Name',
    class: 'center',
    optional: true
  });
  const layoutInput = new Select({
    label: 'Layout',
    name: 'layout',
    inline: true,
    class: 'center',
    // value: 'test',
    clearOnDblClick: true,
    optional: true,
    list: [''].concat(CabinetLayouts.list())
  });

  const simpleSelect = new Select({
    name: 'simpleType',
    inline: true,
    class: 'center',
    list: SimpleModel.list(),
    optional: true
  })


  const inputTree = new DecisionInputTree('Object', {inputArray: [objectRadio]});

  const cond = DecisionInputTree.getCondition('objectType', 'Cabinet');
  const cabinetInputs = [typeInput, layoutInput, nameInput];
  const cabinetNode = inputTree.root().then('CabinetNode', {inputArray: cabinetInputs});
  inputTree.root().conditions.add(cond, 'CabinetNode');

  const otherCond = DecisionInputTree.getCondition('objectType', 'Other');
  inputTree.root().then('OtherNode', {inputArray: [simpleSelect]});
  inputTree.root().conditions.add(otherCond, 'OtherNode');

  // inputTree.block(true);
  inputTree.onSubmit((values) => {
    if (values.objectType === 'Cabinet') {
      const type = objConcat(values.CabinetNode, 'type')[0];
      values.CabinetNode.type = type.split('-').reverse().join('-');

      // inputTree.payload().inputArray[1].setValue('', true);
      // inputTree.children()[0].payload().inputArray[0].setValue('', true)
    }
  });
  const configKeys = Object.keys(Cabinets);
  typeTree(configKeys, inputTree, cabinetNode);

  return inputTree;
};
