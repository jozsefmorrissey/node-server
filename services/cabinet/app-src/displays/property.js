


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
      let radioId = group.radioId || PropertyDisplay.counter++;
      const properties = [];
      const groups = [];
      const scope = {key, properties, groups, recurse, radioId,
                      noChildren: noChildren(properties, groups)};
      const keys = Object.keys(group.values);
      radioId = PropertyDisplay.counter++;
      for( let index = 0; index < keys.length; index += 1) {
        const value = group.values[keys[index]];
        if (value instanceof Property) {
          scope.properties.push(value);
        } else {
          scope.groups[keys[index]] = {key: keys[index], values: value, radioId};
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
        const propObj = {global: props.global, instance: {}};
        propertyObjs[key] = propObj;
        // const assems = Cost.group().objectMap[key] || [];
        // for (let aIndex = 0; aIndex < assems.length; aIndex += 1) {
        //   const aProps = JSON.clone(props.instance);
        //   propObj.instance[assems[aIndex].id()] = aProps;
        // }
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
    bind(containerSelector, updateProperties);
    // new RadioDisplay('property-container', 'radio-id');
  }
}

PropertyDisplay.counter = 0;
PropertyDisplay.template = new $t('properties/properties');
PropertyDisplay.propTemplate = new $t('properties/property');
module.exports = PropertyDisplay
