class CabinetConfig {
  constructor() {
    let cabinetList = {};
    let cabinetKeys = {};
    let configKeys;
    const updateEvent = new CustomEvent('update');
    function setLists(cabinets) {
      const allCabinetKeys = Object.keys(cabinets);
      allCabinetKeys.forEach((key) => {
        const type = cabinets[key].partName;
        if (cabinetKeys[type] === undefined)  cabinetKeys[type] = {};
        if (cabinetKeys[type][key] === undefined)  cabinetKeys[type][key] = {};
        cabinetKeys[type][key] = cabinets[key];
      });

      cabinetList = cabinets;
      configKeys = Object.keys(cabinetBuildConfig);
      updateEvent.trigger();
    }

    this.valid = (type, id) => (id === undefined ?
    cabinetBuildConfig[type] : cabinetKeys[type][id]) !== undefined;

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
        list: Object.keys(properties.list)
      });
      const inputs = [Input.id(), typeInput, propertyInput];
      const inputTree = new DecisionInputTree('Cabinet', inputs, console.log);
      const cabinetTypes = Object.keys(cabinetKeys);
      cabinetTypes.forEach((type) => {
        const cabinetInput = new Select({
          label: 'Layout (Optional)',
          name: 'layout',
          class: 'center',
          list: Object.keys(cabinetKeys[type])
        });
        inputTree.addState(type, cabinetInput);
        inputTree.then(`type:${type}`).jump(type);
      });
      return inputTree;
    }
    this.get = (type, layout, propertyId) => {
      let cabinet;
      if (true || layout === undefined) cabinet = Cabinet.build(type);
      else cabinet = Cabinet.fromJson(cabinetList[layout]);
      if (propertyId !== undefined) cabinet.propertyId(propertyId);
      return cabinet;
    };
    setTimeout(() =>
      Request.get(EPNTS.cabinet.list(), setLists, () => setLists([])), 200);
  }
}

CabinetConfig = new CabinetConfig();
