


const Properties = require('../config/properties.js');
const Property = require('../config/property.js');
const Cost = require('../cost/cost.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const bind = require('../../../../public/js/utils/input/bind.js');
const RadioDisplay = require('../display-utils/radioDisplay.js');
const $t = require('../../../../public/js/utils/$t.js');

class PropertyDisplay {
  constructor(containerSelector) {
    let currProps;

    const noChildren = (properties, groups) => () =>
          properties.length === 0 && Object.keys(groups).length === 0;

    function getScope(key, group) {
      key = key || '';
      let radioId = group.radioId || PropertyDisplay.counter++;
      const properties = [];
      const groups = {};
      const label = key.replace(PropertyDisplay.branchReg, '$1');
      const scope = {key, label, properties, groups, recurse, radioId,
                      noChildren: noChildren(properties, groups),
                      branch: key.match(PropertyDisplay.branchReg)};
      const keys = Object.keys(group.values);
      radioId = PropertyDisplay.counter++;
      for( let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        const value = group.values[key];
        if (value instanceof Property) {
          scope.properties.push(value);
        } else if (!key.match(PropertyDisplay.attrReg)){
          scope.groups[key] = {key, values: value, radioId};
        } else {
          scope[key] = value;
        }
      }
      return scope;
    }

    this.update = () => {
      const propKeys = Properties.list();
      const propertyObjs = {};
      for (let index = 0; index < propKeys.length; index += 1) {
        const key = propKeys[index];
        const props = Properties(key);
        const propObj = props;
        propertyObjs[key] = propObj;
      }
      const values = {values: propertyObjs};
      const contianer = document.querySelector(containerSelector);
      contianer.innerHTML =
          PropertyDisplay.template.render(getScope(undefined, values));
    };

    const recurse = (key, group) => {
      return PropertyDisplay.template.render(getScope(key, group));
    }

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
  console.log('hello');
});

PropertyDisplay.attrReg = /^_[A-Z_]{1,}/;
PropertyDisplay.branchReg = /^OR_(.{1,})/;
PropertyDisplay.counter = 0;
PropertyDisplay.template = new $t('properties/properties');
module.exports = PropertyDisplay
