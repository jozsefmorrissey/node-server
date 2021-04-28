class CabinetDisplay {
  constructor(room) {
    const parentSelector = `[room-id="${room.id}"].cabinet-cnt`;
    let propId = 'Half Overlay';
    this.propId = (id) => {
      if (id ===  undefined) return propId;
      propId = id;
    }
    const getHeader = (cabinet, $index) =>
        CabinetDisplay.headTemplate.render({cabinet, $index});
    const showTypes = Show.listTypes();
    const getBody = (cabinet, $index) => {
      ThreeDModel.render(cabinet);
      return CabinetDisplay.bodyTemplate.render({$index, cabinet, showTypes, OpenSectionDisplay});
    }
    const getObject = () => new Cabinet('c', 'Cabinet', propId);
    this.active = () => expandList.active();
    const expListProps = {
      list: room.cabinets,
      parentSelector, getHeader, getBody, getObject,
      listElemLable: 'Cabinet'
    };
    const expandList = new ExpandableList(expListProps);
    this.refresh = () => expandList.refresh();
    const valueUpdate = (path, value) => {
      const split = path.split('.');
      const index = split[0];
      const key = split[1];
      const cabinet = expListProps.list[index];
      cabinet.value(key, new Measurment(value).decimal());
      ThreeDModel.render(cabinet);
    }

    bindField('.cabinet-input', valueUpdate, Measurment.validation('(0,)'));
  }
}
CabinetDisplay.bodyTemplate = new $t('cabinet/body');
CabinetDisplay.headTemplate = new $t('cabinet/head');
