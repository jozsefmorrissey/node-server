class RoomDisplay {
  constructor(parentSelector, rooms) {
    const cabinetDisplays = {};
    const getHeader = (room, $index) =>
        RoomDisplay.headTemplate.render({room, $index});

    const getBody = (room, $index) => {
      let propertyTypes = Object.keys(properties.list);
      setTimeout(this.cabinetDisplay().refresh, 100);
      return RoomDisplay.bodyTemplate.render({$index, room, propertyTypes});
    }
    const getObject = () => {
      const room = new Room();
      cabinetDisplays[room.id] = new CabinetDisplay(room);
      return room;
    }
    this.active = () => expandList.active();
    this.cabinetDisplay = () => cabinetDisplays[this.active().id];
    this.cabinet = () => this.cabinetDisplay().active();
    const expListProps = {
      list: rooms,
      parentSelector, getHeader, getBody, getObject,
      listElemLable: 'Room', type: 'pill'
    };
    const expandList = new ExpandableList(expListProps);
  }
}
RoomDisplay.bodyTemplate = new $t('room/body');
RoomDisplay.headTemplate = new $t('room/head');
