class PropertyDisplay {
  constructor(containerSelector) {
    let currProps;

    function getScope(key, group) {
      let radioId = group.radioId || PropertyDisplay.counter++;
      const scope = {key, properties: [], groups: [], recurse, radioId};
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
      const propKeys = Object.keys(assemProps);
      const propertyObjs = {};
      for (let index = 0; index < propKeys.length; index += 1) {
        const key = propKeys[index];
        const props = assemProps[key];
        const propObj = {global: props.global, instance: {}};
        propertyObjs[key] = propObj;
        const assems = Cost.objMap[key] || [];
        for (let aIndex = 0; aIndex < assems.length; aIndex += 1) {
          const aProps = JSON.clone(props.instance);
          propObj.instance[assems[aIndex].id()] = aProps;
        }
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
    bindField(containerSelector, updateProperties);
    new RadioDisplay('property-container', 'radio-id');
  }
}

PropertyDisplay.counter = 0;
PropertyDisplay.template = new $t('properties/properties');
PropertyDisplay.propTemplate = new $t('properties/property');
