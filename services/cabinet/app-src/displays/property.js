class PropertyDisplay {
  constructor(containerSelector) {
    let currProps;

    this.update = (properties) => {
      currProps = properties;
      const contianer = document.querySelector(containerSelector);
      contianer.innerHTML = PropertyDisplay.template.render({properties});
    };

    function updateProperties(name, value) {
      currProps[name] = value;
    }
    bindField(containerSelector, updateProperties);
  }
}

PropertyDisplay.template = new $t('properties/properties');
