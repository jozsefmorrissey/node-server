class CabinetDisplay {
  constructor(room) {
    const parentSelector = `[room-id="${room.id}"].cabinet-cnt`;
    let propId = 'Half Overlay';
    this.propId = (id) => {
      if (id ===  undefined) return propId;
      propId = id;
    }
    const getHeader = (cabinet, $index) =>
        CabinetDisplay.headTemplate.render({room, cabinet, $index});
    const showTypes = Show.listTypes();
    const getBody = (cabinet, $index) => {
      ThreeDModel.render(cabinet);
      return CabinetDisplay.bodyTemplate.render({room, $index, cabinet, showTypes, OpenSectionDisplay});
    }
    const getObject = () => Cabinet.build('standard');
    this.active = () => expandList.active();
    const expListProps = {
      list: room.cabinets,
      parentSelector, getHeader, getBody, getObject,
      listElemLable: 'Cabinet'
    };
    const expandList = new ExpandableList(expListProps);
    this.refresh = () => expandList.refresh();

    const cabinetKey = (path) => {
      const split = path.split('.');
      const index = split[0];
      const key = split[1];
      const cabinet = expListProps.list[index];
      return {cabinet, key};
    }

    const valueUpdate = (path, value) => {
      const cabKey = cabinetKey(path);
      cabKey.cabinet.value(cabKey.key, new Measurment(value).decimal());
      ThreeDModel.render(cabKey.cabinet);
    }

    const attrUpdate = (path, value) => {
      const cabKey = cabinetKey(path);
      cabKey.cabinet[cabKey.key] = value;
    }

    const saveSuccess = () => console.log('success');
    const saveFail = () => console.log('failure');
    const save = (target) => {
      const index = target.getAttribute('index');
      const cabinet = expListProps.list[index];
      Request.post(EPNTS.cabinet.add(cabinet.id), cabinet.toJson(), saveSuccess, saveFail);
      console.log('saving');
    }

    bindField(`[room-id="${room.id}"].cabinet-input`, valueUpdate, Measurment.validation('(0,)'));
    bindField(`[room-id="${room.id}"].cabinet-id-input`, attrUpdate);
    matchRun('click', '.save-cabinet-btn', save);
  }
}
CabinetDisplay.bodyTemplate = new $t('cabinet/body');
CabinetDisplay.headTemplate = new $t('cabinet/head');
