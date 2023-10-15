


const CustomEvent = require('../../../../public/js/utils/custom-event.js');
const Select = require('../../../../public/js/utils/input/styles/select.js');
const Input = require('../../../../public/js/utils/input/input.js');
const Inputs = require('../input/inputs.js');
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const Cabinet = require('../objects/assembly/assemblies/cabinet.js');
const Request = require('../../../../public/js/utils/request.js');
const EPNTS = require('../../generated/EPNTS.js');
const CabinetTemplate = require('./cabinet-template');
const Cabinets = require('../../public/json/cabinets.json');
const CabinetLayouts = require('./cabinet-layouts');

const configs = {};
class CabinetConfig {
  constructor(cabinets, id) {
    let cabinetList = {};
    let cabinetKeys = {};
    let configKeys;

    this.valid = (type, id) => (!id ?
                  cabinets[type] : cabinetKeys[type][id]) !== undefined;

    let typeCount = 0;
    const typeSelect = (name, label, allowEmpty) => {
      return new Select({
        name, label,
        inline: true,
        list: allowEmpty ? [''] : [],
        validation: () => true,
      });
    }

    function typeTree(types, tree) {
      for(let index = 0; index < types.length; index++) {
        const type = types[index];
        const splitPath = type.split('-').reverse();
        let branch = tree.root();
        let prevPath = '';
        for (let pIndex = 0; pIndex < splitPath.length; pIndex++) {
          const name = splitPath[pIndex];
          const path = prevPath ? `${prevPath}-${name}` : name;
          let nextBranch = tree.getByName(path);
          if (pIndex !== splitPath.length - 1) {
            if (nextBranch === undefined) {
              const branchType = path.replace(/^.*?-(.*)$/, '$1').split('-').reverse().join('-');
              const select = typeSelect('type', 'type', cabinets[branchType]);
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

    this.inputTree = () => {
      const typeInput = typeSelect('type', 'Type');
      typeInput.list().deleteAll();
      const nameInput = new Input({
        name: 'name',
        inline: true,
        label: 'Name (optional)',
        class: 'center',
        optional: true
      });
      const layoutInput = new Input({
        label: 'Layout (Optional)',
        name: 'layout',
        inline: true,
        class: 'center',
        // value: 'test',
        clearOnDblClick: true,
        optional: true,
        list: CabinetLayouts.list()
      });

      const inputs = [typeInput, layoutInput, nameInput];

      const inputTree = new DecisionInputTree('Cabinet', {inputArray: inputs});

      // inputTree.block(true);
      inputTree.onSubmit((values) => {
        const type = objConcat(values, 'type')[0];
        values.type = type.split('-').reverse().join('-');

        // inputTree.payload().inputArray[1].setValue('', true)
        // inputTree.children()[0].payload().inputArray[0].setValue('', true)
        return 'poop';
      });
      typeTree(configKeys, inputTree);

      return inputTree;
    };
    this.get = (group, type, layout, name) => {
      let cabinet = Cabinet.build(type, group);
      if (layout && CabinetLayouts.map[layout]) CabinetLayouts.map[layout].build(cabinet);
      cabinet.name(name);
      return cabinet;
    };

    const allCabinetKeys = Object.keys(cabinets);
    allCabinetKeys.forEach((key) => {
      const type = cabinets[key].partName;
      if (cabinetKeys[type] === undefined)  cabinetKeys[type] = {};
      if (cabinetKeys[type][key] === undefined)  cabinetKeys[type][key] = {};
      cabinetKeys[type][key] = cabinets[key];
    });

    cabinetList = cabinets;
    configKeys = Object.keys(cabinets);
    configs[id] = this;
  }
}



let currConfig = new CabinetConfig(Cabinets, 'default');
const updateEvent = new CustomEvent('update');

module.exports = {
  switch: (configId) => {
    if (configs[configId] !== undefined) {
      currConfig = configs[configId];
      updateEvent.trigger();
    }
  },
  configList: () => Object.keys(configs),
  valid: (...args) => currConfig.valid(...args),
  onUpdate: (func) => updateEvent.on(func),
  inputTree: (...args) => currConfig.inputTree(...args),
  get: (...args) => currConfig.get(...args),
  new: (json, id) => new CabinetConfig(json, id)
}
