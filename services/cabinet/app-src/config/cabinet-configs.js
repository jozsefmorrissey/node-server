


const CustomEvent = require('../../../../public/js/utils/custom-error.js');
const cabinetBuildConfig = require('../../public/json/cabinets.json');
const Select = require('../../../../public/js/utils/input/styles/select.js');
const Inputs = require('../input/inputs.js');
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const Cabinet = require('../objects/assembly/assemblies/cabinet.js');
const Request = require('../../../../public/js/utils/request.js');
const EPNTS = require('../../generated/EPNTS.js');
const CabinetTemplate = require('./cabinet-template');

class CabinetConfig {
  constructor() {
    let cabinetList = {};
    let cabinetKeys = {};
    let configKeys;
    const updateEvent = new CustomEvent('update');
    function setLists(cabinets) {
      const allCabinetKeys = Object.keys(cabinets);
      allCabinetKeys.forEach((key) => {
        const type = cabinets[key].partName();
        if (cabinetKeys[type] === undefined)  cabinetKeys[type] = {};
        if (cabinetKeys[type][key] === undefined)  cabinetKeys[type][key] = {};
        cabinetKeys[type][key] = cabinets[key];
      });

      cabinetList = cabinets;
      configKeys = Object.keys(cabinetBuildConfig);
      updateEvent.trigger();
    }

    this.valid = (type, id) => (!id ?
    cabinetBuildConfig[type] : cabinetKeys[type][id]) !== undefined;

    class ValueDependency {
      constructor(name, value, payload) {
        this.condition = (wrapper) => {
          console.log('true');
          return true;
        }
        Object.keys(payload).forEach((key) => this[key] = payload[key]);
      }
    }

    this.onUpdate = (func) => updateEvent.on(func);
    this.inputTree = () => {
      const typeInput = new Select({
        name: 'type',
        class: 'center',
        list: JSON.parse(JSON.stringify(configKeys))
      });
      const propertyInput = new Select({
        name: 'propertyId',
        class: 'center',
        list: ['pajango', 'skititors']
      });
      const inputs = [Inputs('name'), typeInput];
      const inputTree = new DecisionInputTree();
      const cabinet = inputTree.branch('Cabinet', inputs);
      const cabinetTypes = Object.keys(cabinetKeys);
      cabinetTypes.forEach((type) => {
        const cabinetInput = new Select({
          label: 'Layout (Optional)',
          name: 'id',
          class: 'center',
          list: [''].concat(Object.keys(cabinetKeys[type]))
        });
        cabinet.conditional(type, new ValueDependency('type', type, type));
      });
      return inputTree;
    };
    this.get = (group, name, type, propertyId, id) => {
      let cabinet;
      if (!id) cabinet = Cabinet.build(type, group);
      else cabinet = Cabinet.fromJson(cabinetList[id]);
      if (propertyId !== undefined) cabinet.propertyId(propertyId);
      cabinet.name(name);
      return cabinet;
    };

    Request.get(EPNTS.cabinet.list(), setLists, setLists);
  }
}

CabinetConfig = new CabinetConfig();
module.exports = CabinetConfig
