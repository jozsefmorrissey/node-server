
const Input = require('../../../../public/js/utils/input/input.js');
const Select = require('../../../../public/js/utils/input/styles/select.js');
const Radio = require('../../../../public/js/utils/input/styles/radio.js');
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const CabinetLayouts = require('../config/cabinet-layouts');
const Objects = require('../../public/json/cabinets/construction.json');
const SimpleModel = require('../objects/simple/simple.js');

const TYPE_DEF_REG = /([A-Z_0-9]{1,}?)-(.*$)/;
const typeKeys = Object.keys(Objects).filter(k => k.match(TYPE_DEF_REG));
const OBJS = {Cabinet: {}};
Object.keys(Objects).forEach(k => {
  const match = k.match(TYPE_DEF_REG);
  const typeKey = (match ? match[1].toLowerCase().toSentance() : 'Cabinet');
  if (match) k = match[2];
  if (!OBJS[typeKey]) OBJS[typeKey] = {};
  OBJS[typeKey][k] = Objects[k];
});

function typeTree(types, tree, node) {
  types.sort((k1, k2) => k1.count('-') - k2.count('-'))
  for(let index = 0; index < types.length; index++) {
    const type = types[index];
    const splitPath = type.split('-').reverse();
    let branch = node;
    let prevPath = '';
    for (let pIndex = 0; pIndex < splitPath.length; pIndex++) {
      const name = splitPath[pIndex];
      const path = prevPath ? `${prevPath}-${name}` : name;
      let nextBranch = tree.getByName(path);
      const defaultOfType = name === type;
      if (nextBranch === undefined) {
        const branchType = path.replace(/^.*?-(.*)$/, '$1').split('-').reverse().join('-');
        const select = typeSelect('type', 'type', types[branchType]);
        const cond = DecisionInputTree.getCondition('type', name);
        nextBranch = branch.then(path, {inputArray: [select]});
        branch.conditions.add(cond, path);
      }
      const inputArray = branch.payload ? branch.payload().inputArray : branch.inputArray;
      const selectList = inputArray[0].list();
      if(defaultOfType) nextBranch.inputArray()[0].list().push('');
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


function addOBJ(key, tree) {
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
    value: '',
    hidden: key !== 'Cabinet',
    clearOnDblClick: true,
    optional: true,
    list: [''].concat(CabinetLayouts.list())
  });

  const cond = DecisionInputTree.getCondition('objectType', key);
  const nodeId = `${key}Node`;
  const inputs = key !== 'Cabinet' ? [typeInput, nameInput] :
                  [typeInput, layoutInput, nameInput];
  const node = tree.root().then(nodeId, {inputArray: inputs});
  tree.root().conditions.add(cond, nodeId);

  const configKeys = Object.keys(OBJS[key]);
  typeTree(configKeys, tree, node);
}

module.exports = () => {
  const objectRadio = new Radio({
    name: 'objectType',
    inline: true,
    class: 'center',
    list: Object.keys(OBJS).concat(['Other'])
  });

  const simpleSelect = new Select({
    name: 'simpleType',
    inline: true,
    class: 'center',
    list: SimpleModel.list(),
    optional: true
  })


  const inputTree = new DecisionInputTree('Object', {inputArray: [objectRadio]});
  Object.keys(OBJS).forEach(key => addOBJ(key, inputTree));

  const otherCond = DecisionInputTree.getCondition('objectType', 'Other');
  inputTree.root().then('OtherNode', {inputArray: [simpleSelect]});
  inputTree.root().conditions.add(otherCond, 'OtherNode');

  // inputTree.block(true);
  inputTree.on.submit((values) => {
    const objType = values.objectType;
    const nodeName = `${objType}Node`;
    let type = objConcat(values[nodeName], 'type')[0];
    if (objType !== 'Cabinet') type = `${type}-${objType.toUpperCase()}`;
    values[nodeName].type = type.split('-').reverse().join('-');
  });

  // inputTree.root().children()[0].children()[0].inputArray()[0].setValue('corner')

  return inputTree;
};
