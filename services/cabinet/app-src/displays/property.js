


const Properties = require('../config/properties.js');
const Property = require('../config/property.js');
const Cost = require('../cost/cost.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const bind = require('../../../../public/js/utils/input/bind.js');
const RadioDisplay = require('../display-utils/radioDisplay.js');
const EPNTS = require('../../generated/EPNTS');
const $t = require('../../../../public/js/utils/$t.js');
const Inputs = require('../input/inputs.js');
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const ExpandableObject = require('../../../../public/js/utils/lists/expandable-object.js');
const Measurement = require('../../../../public/js/utils/measurment.js');

// TODO: Rewrite program started to have nested properties no longer making display convoluted(SP).
const changed = (id) => Properties.changes.changed(id);
const shouldHide = (prop) => prop.value() === null;
const hideAll = (properties) => {
  for (let index = 0; index < properties.length; index += 1) {
    if (properties[index].value() !== null) return false;
  }
  return true;
}
function save() {
  Request.post(EPNTS.config.save(), Properties.config(), console.log, console.error);
}

function get() {
  Request.get(EPNTS.config.get(), console.log);
}

class PropertyDisplay {
  constructor(containerSelector) {
    let currProps;

    const noChildren = (properties, groups) => () =>
          properties.length === 0 && Object.keys(groups).length === 0;

    function childScope (key) {
      const uniqueId = String.random();
      const getObject = (values) => {
        let properties = Properties.new(key,  values.name);
        return {name: values.name, uniqueId, changed, properties};
      }

      const inputTree = PropertyDisplay.configInputTree();
      const expListProps = {
        list: Properties.groupList(key),
        parentSelector: `#config-expand-list-${uniqueId}`,
        getHeader: (scope) =>
                    PropertyDisplay.configHeadTemplate.render(scope),
        getBody: (scope) =>
                    PropertyDisplay.configBodyTemplate.render({
                      name: scope.name,
                      properties: scope.properties,
                      changed
                    }),
        inputValidation: inputTree.validate,
        listElemLable: 'Config',
        getObject, inputTree
      };
      setTimeout(() =>
        new ExpandableObject(expListProps), 500);
      return uniqueId;
    }

    function getScope(key, group) {
      key = key || '';
      const uniqueId = String.random();
      let radioId = group.radioId || PropertyDisplay.counter++;
      const properties = [];
      const groups = {};
      const label = key.replace(PropertyDisplay.camelReg, '$1 $2');
      const scope = {key, label, properties, groups, recurse, radioId, uniqueId,
                      noChildren: noChildren(properties, groups),
                      branch: key.match(PropertyDisplay.branchReg)};
      PropertyDisplay.uniqueMap[uniqueId] = scope;
      const keys = Object.keys(group.values);
      radioId = PropertyDisplay.counter++;
      for( let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        const value = group.values[key];
        childScope(key, uniqueId);
      }
      return scope;
    }

    this.update = () => {
      const propKeys = Properties.list();
      const propertyObjs = {};
      const childIdMap = [];
      for (let index = 0; index < propKeys.length; index += 1) {
        const key = propKeys[index];
        const props = Properties(key);
        const propObj = props;
        propertyObjs[key] = propObj;
        childIdMap[key] = childScope(key);
      }
      const uniqueId = String.random();
      const values = {values: propertyObjs, uniqueId, childIdMap, hideAll, Properties};
      const contianer = document.querySelector(containerSelector);
      contianer.innerHTML =
          PropertyDisplay.template.render(values);
    };

    function updateProperties(name, value) {
    }
    bind('property-cnt', updateProperties);
    new RadioDisplay('property-container', 'radio-id');
  }
}

// bind('property-branch-selector', '');

du.on.match('change', 'select[name="property-branch-selector"]', (target) => {
  const childTargets = target.parentElement.children[1].children;
  const childElem = childTargets[target.value];
  // TODO: set config property: childElem.innerText;
  du.hide(childTargets);
  du.show(childElem);
});

function setPropertyElemValue(elem, idAttr, value) {
  const id = elem.getAttribute(idAttr);
  const group = elem.getAttribute('name');
  const property = Property.get(id);
  property.value(value, true);
  if (group === 'UNIT' && value) {
    Measurement.unit(property.name());
  }
}

function updateMeasurements () {
  measureElems = du.find.all('[measurement-id]:not([measurement-id=""])');
  measureElems.forEach((elem) => {
    const id = elem.getAttribute('measurement-id');
    const measurement = Measurement.get(id);
    elem.value = measurement.display();
  });
}

function updateRadio(elem) {
  const name = elem.getAttribute('name');
  Properties.config()
  const elems = du.find.all(`input[type="radio"][name='${name}']`);
  elems.forEach((elem) => setPropertyElemValue(elem, 'prop-radio-update', false));
  setPropertyElemValue(elem, 'prop-radio-update', true);
  if (name === 'UNIT') updateMeasurements();
}

function updateValue(elem) {
  setPropertyElemValue(elem, 'prop-value-update', elem.value);
  const saveBtn = du.find.closest('.save-change', elem);
  saveBtn.hidden = !changed(saveBtn.getAttribute('properties-id'));
  const saveAllBtn = du.find('#property-manager-save-all');
  saveAllBtn.hidden = !Properties.changes.changesExist();
}

function saveChange(elem) {
  const id = elem.getAttribute('properties-id');
  Properties.changes.save(id);
  elem.hidden = true;
  const saveAllBtn = du.find('#property-manager-save-all');
  saveAllBtn.hidden = !Properties.changes.changesExist();
  save();
}


du.on.match('keyup', '[prop-value-update]', updateValue);
du.on.match('change', '[prop-radio-update]', updateRadio);
du.on.match('click', '#property-manager-save-all', Properties.changes.saveAll);
du.on.match('click', '[properties-id]:not([properties-id=""])', saveChange);

PropertyDisplay.attrReg = /^_[A-Z_]{1,}/;
PropertyDisplay.branchReg = /^OR_(.{1,})/;
PropertyDisplay.camelReg = /([a-z])([A-Z])/g;
PropertyDisplay.counter = 0;
PropertyDisplay.template = new $t('properties/properties');
PropertyDisplay.configBodyTemplate = new $t('properties/config-body');
PropertyDisplay.configHeadTemplate = new $t('properties/config-head');
PropertyDisplay.radioTemplate = new $t('properties/radio');
PropertyDisplay.uniqueMap = {};
PropertyDisplay.configMap = {};

PropertyDisplay.configInputTree = () =>
  new DecisionInputTree('Config', [Inputs('name')], console.log);

module.exports = PropertyDisplay
