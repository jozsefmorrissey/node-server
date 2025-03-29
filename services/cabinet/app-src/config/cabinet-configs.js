


const CustomEvent = require('../../../../public/js/utils/custom-event.js');
const Select = require('../../../../public/js/utils/input/styles/select.js');
const Input = require('../../../../public/js/utils/input/input.js');
const Inputs = require('../input/inputs.js');
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const Assembly = require('../objects/assembly/assembly.js');
const Cabinet = require('../objects/assembly/assemblies/cabinet.js');
const Request = require('../../../../public/js/utils/request.js');
const EPNTS = require('../../generated/EPNTS.js');
const CabinetTemplate = require('./cabinet-template');
const DisplayConfig = require('../../public/json/cabinets/construction.json');
const ConstructionConfig = require('../../public/json/cabinets/construction.json');
const CabinetLayouts = require('./cabinet-layouts');
const CabinetOpeningCorrdinates = require('../services/cabinet-opening-coordinates.js');

const configs = {};
class CabinetConfig {
  constructor(cabinets, id) {
    let cabinetList = {};
    let cabinetKeys = {};
    let configKeys;
    this.configKeys = () => configKeys.map(k => k);

    this.valid = (type, id) => (!id ?
                  cabinets[type] : cabinetKeys[type][id]) !== undefined;

    this.equivalent = (cabinet) => {
      if (!(cabinet instanceof Cabinet)) return cabinet;
      const type = cabinet.partName();
      if (cabinetList[type] === undefined) return cabinet;
      const group = cabinet.group();
      const equivalent = this.get(group, type, null, cabinet.name());
      equivalent.openings = cabinet.sectionProperties()
                            .map(sp => new CabinetOpeningCorrdinates(equivalent, sp.clone()));
      return equivalent;
    }

    this.get = (group, type, layout, name) => {
      const assem = cabinets[type]._TYPE === 'CabinetTemplate' ?
                    Cabinet.build(type, group) : Assembly.build(type, group);
      assem.part(false);
      if (layout && CabinetLayouts.map[layout]) CabinetLayouts.map[layout].build(assem);
      const layout2d = group.room().layout();
      if (layout2d) {
        const layoutCenter = layout2d.center();
        assem.config.POSITION.center.x = layoutCenter.x;
        assem.config.POSITION.center.z = layoutCenter.y;
      }
      assem.name(name);
      return assem;
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



let displayConfig = new CabinetConfig(DisplayConfig, 'display');
let currConfig = new CabinetConfig(ConstructionConfig, 'construction');
const updateEvent = new CustomEvent('update');

module.exports = {
  switch: (configId) => {
    if (configs[configId] !== undefined) {
      currConfig = configs[configId];
      updateEvent.trigger();
    }
  },
  display: (assembly) => displayConfig.equivalent(assembly),
  configList: () => Object.keys(configs),
  valid: (...args) => currConfig.valid(...args),
  onUpdate: (func) => updateEvent.on(func),
  inputTree: (...args) => currConfig.inputTree(...args),
  get: (...args) => currConfig.get(...args),
  new: (json, id) => new CabinetConfig(json, id)
}
