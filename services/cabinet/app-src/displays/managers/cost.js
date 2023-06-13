


const CostTree = require('../../cost/cost-tree.js');
const Assembly = require('../../objects/assembly/assembly.js');
const du = require('../../../../../public/js/utils/dom-utils.js');
const $t = require('../../../../../public/js/utils/$t.js');
const DecisionInputTree = require('../../../../../public/js/utils/input/decision/decision.js');
const Select = require('../../../../../public/js/utils/input/styles/select');
const Input = require('../../../../../public/js/utils/input/input');
const RelationInput = require('../../../../../public/js/utils/input/styles/select/relation');
const Inputs = require('../../input/inputs.js');
const RadioDisplay = require('../../display-utils/radio-display.js');

class CostManager {
  constructor(id, name) {
    const costTree = new CostTree();
    this.root = () => costTree.root();
    this.update = () => {
      const html = CostManager.mainTemplate.render(this);
      du.find(`#${id}`).innerHTML = html;
    }
    this.nodeInputHtml = () => CostManager.nodeInput().payload().html();
    this.headHtml = (node) =>
        CostManager.headTemplate.render({node, CostManager: this});
    this.bodyHtml = (node) =>
        CostManager.bodyTemplate.render({node, CostManager: this});
    this.loadPoint = () => console.log('load');
    this.savePoint = () => console.log('save');
    this.fromJson = () => {};
    this.update();
  }
}

CostManager.mainTemplate = new $t('managers/cost/main');
CostManager.headTemplate = new $t('managers/cost/head');
CostManager.bodyTemplate = new $t('managers/cost/body');
CostManager.propertySelectTemplate = new $t('managers/cost/property-select');
CostManager.costInputTree = (costTypes, objId, onUpdate) => {
  const logicTree = new LogicMap();
  return logicTree;
}
CostManager.nodeInput = () => {
  const dit = new DecisionInputTree();
  const typeSelect = new Select({
    name: 'type',
    list: CostTree.types,
    value: CostTree.types[0]
  });
  const selectorType = new Select({
    name: 'selectorType',
    list: ['Manual', 'Auto'],
    value: 'Manual'
  });
  const propertySelector = new Select({
    name: 'propertySelector',
    list: CostTree.propertyList,
  });

  const accVals = ['select', 'multiselect', 'conditional'];
  const condtionalPayload = new DecisionInputTree.ValueCondition('type', accVals, [selectorType]);
  const type = dit.branch('Node', [Inputs('name'), typeSelect]);
  const selectType = type.conditional('selectorType', condtionalPayload);
  const payload = [Inputs('formula'), propertySelector, RelationInput.selector];
  const condtionalPayload2 = new DecisionInputTree.ValueCondition('selectorType', 'Auto', payload);
  selectType.conditional('formula', condtionalPayload2);
  return dit;
}
new RadioDisplay('cost-tree', 'radio-id');

new CostManager('cost-manager', 'cost');

function abbriviation(group) {
  return Assembly.classes[group] ? Assembly.classes[group].abbriviation : 'nope';
}
const scope = {groups: CostTree.propertyList, abbriviation};
// du.id('property-select-cnt').innerHTML =
//       CostManager.propertySelectTemplate.render(scope);
module.exports = CostManager
