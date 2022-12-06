


const CustomEvent = require('../../../../public/js/utils/custom-event.js');
const Select = require('../../../../public/js/utils/input/styles/select.js');
const Input = require('../../../../public/js/utils/input/input.js');
const Inputs = require('../input/inputs.js');
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const Cabinet = require('../objects/assembly/assemblies/cabinet.js');
const Request = require('../../../../public/js/utils/request.js');
const EPNTS = require('../../generated/EPNTS.js');
const CabinetTemplate = require('./cabinet-template');
const ValueCondition = require('../../../../public/js/utils/input/decision/decision.js').ValueCondition;
const Cabinets = require('./cabinets.json');
const CabinetLayouts = require('./cabinet-layouts');

const configs = {};
class CabinetConfig {
  constructor(cabinets, id) {
    let cabinetList = {};
    let cabinetKeys = {};
    let configKeys;

    this.valid = (type, id) => (!id ?
                  cabinets[type] : cabinetKeys[type][id]) !== undefined;

    this.inputTree = () => {
      const types = JSON.parse(JSON.stringify(configKeys));
      const typeInput = new Select({
        name: 'type',
        label: 'Type',
        inline: false,
        class: 'center',
        list: types
      });
      const nameInput = new Input({
        name: 'name',
        inline: true,
        label: 'Name (optional)',
        class: 'center',
      });
      const layoutInput = new Input({
        label: 'Layout (Optional)',
        name: 'layout',
        inline: true,
        class: 'center',
        clearOnDblClick: true,
        list: CabinetLayouts.list()
      });

      const inputs = [layoutInput, nameInput, typeInput];
      const inputTree = new DecisionInputTree();
      // inputTree.onSubmit((t) => {
      //   inputTree.payload().inputArray[1].setValue('', true)
      //   inputTree.children()[0].payload().inputArray[0].setValue('', true)
      // });
      inputTree.leaf('Cabinet', inputs);

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

// Request.get(EPNTS.cabinet.list(), (cabinets) => {
//   new CabinetConfig(cabinets, 'user');
//   module.exports.switch('user');
// }, console.error);






// ---------------------- Layout Specific Input Tree -----------------------//
// this.inputTree = () => {
//   const types = JSON.parse(JSON.stringify(configKeys));
//   const typeInput = new Select({
//     name: 'type',
//     label: 'Type',
//     inline: false,
//     class: 'center',
//     list: types
//   });
//   const nameInput = new Input({
//     name: 'name',
//     inline: false,
//     label: 'Name (optional)',
//     class: 'center',
//   });
//   const inputs = [typeInput, nameInput];
//   const inputTree = new DecisionInputTree();
//   inputTree.onSubmit((t) => {
//     inputTree.payload().inputArray[1].setValue('', true)
//     inputTree.children()[0].payload().inputArray[0].setValue('', true)
//   });
//   const cabinet = inputTree.branch('Cabinet', inputs);
//   const cabinetTypes = Object.keys(cabinetKeys);
//   types.forEach((type) => {
//
//     const cabinetInput = new Input({
//       label: 'Layout (Optional)',
//       name: 'id',
//       inline: false,
//       class: 'center',
//       clearOnDblClick: true,
//       list: [''].concat(cabinetKeys[type] ? Object.keys(cabinetKeys[type]) : [])
//     });
//     cabinet.conditional(type, new ValueCondition('type', type, [cabinetInput]));
//   });
//   return inputTree;
// };
