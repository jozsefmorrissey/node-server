class CabinetConfig {
  constructor() {
    let cabinetList = {};
    let cabinetKeys, configKeys;
    const updateEvent = new CustomEvent('update');
    function setList(cabinets) {
      cabinetList = cabinets;
      configKeys = Object.keys(cabinetBuildConfig);
      cabinetKeys = Object.keys(cabinetList);
      updateEvent.trigger();
    }

    this.onUpdate = (func) => updateEvent.on(func);
    this.list = () => configKeys.concat(cabinetKeys);
    this.inputTree = () => {
      const typeInput = new Select({
        placeholder: 'Type',
        name: 'type',
        class: 'center',
        list: this.list()
      });
      return new DecisionInputTree('Cabinet', [Input.id(), typeInput], console.log);
    }
    this.get = (name) => {
      if (configKeys.indexOf(name) !== -1) return Cabinet.build(name);
      return Cabinet.fromJson(cabinetList[name]);
    };
    setTimeout(() =>
      Request.get(EPNTS.cabinet.list(), setList), 200);
  }
}

CabinetConfig = new CabinetConfig();
