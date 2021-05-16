class RoomDisplay {
  constructor(parentSelector, order) {
    const cabinetDisplays = {};
    const getHeader = (room, $index) =>
        RoomDisplay.headTemplate.render({room, $index});

    const getBody = (room, $index) => {
      let propertyTypes = Object.keys(properties.list);
      return RoomDisplay.bodyTemplate.render({$index, room, propertyTypes});
    }

    const getObject = () => {
      const room = new Room();
      return room;
    }
    this.active = () => expandList.active();
    this.cabinetDisplay = () => {
      const room = this.active();
      const id = room.id;
      if (cabinetDisplays[id] === undefined) {
        cabinetDisplays[id] = new CabinetDisplay(room);
      }
      return cabinetDisplays[id];
    }
    this.cabinet = () => this.cabinetDisplay().active();
    const expListProps = {
      list: order.rooms,
      parentSelector, getHeader, getBody, getObject,
      listElemLable: 'Room', type: 'pill'
    };
    const expandList = new ExpandableList(expListProps);
    expandList.afterRender(() => this.cabinetDisplay().refresh());
    this.refresh = () => expandList.refresh();
  }
}
RoomDisplay.bodyTemplate = new $t('room/body');
RoomDisplay.headTemplate = new $t('room/head');
