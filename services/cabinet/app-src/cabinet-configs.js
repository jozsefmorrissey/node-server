class CabinetConfig {
  constructor() {
    let cabinetList = {};
    const updateEvent = new CustomEvent('update');
    function setList(cabinets) {
      cabinetList = cabinets;
      updateEvent.trigger();
    }

    this.onUpdate = (func) => updateEvent.on(func);
    this.list = () => Object.keys(cabinetList);
    this.get = (name) => JSON.parse(JSON.stringify(cabinetList[name]));
    setTimeout(() =>
      Request.get(EPNTS.cabinet.list(), setList), 200);
  }
}

CabinetConfig = new CabinetConfig();
