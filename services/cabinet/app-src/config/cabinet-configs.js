


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
    this.configKeys = () => configKeys.map(k => k);

    this.valid = (type, id) => (!id ?
                  cabinets[type] : cabinetKeys[type][id]) !== undefined;

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
