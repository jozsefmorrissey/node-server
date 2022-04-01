


const Room = require('../objects/room.js');
const CabinetDisplay = require('./cabinet.js');
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const Input = require('../../../../public/js/utils/input/input.js');
const ExpandableObject = require('../../../../public/js/utils/lists/expandable-object.js');
const $t = require('../../../../public/js/utils/$t.js');
const Inputs = require('../input/inputs.js');

class RoomDisplay {
  constructor(parentSelector, order) {
    const cabinetDisplays = {};
    const getHeader = (room, $index) =>
        RoomDisplay.headTemplate.render({room, $index});

    const getBody = (room, $index) => {
      let propertyTypes = Object.keys(['alabaster','pickles']);
      return RoomDisplay.bodyTemplate.render({$index, room, propertyTypes});
    }

    const getObject = (values) => {
      const room = new Room(values.name);
      return room;
    }
    this.active = () => expandList.active();
    this.cabinetDisplay = () => {
      const room = this.active();
      const id = room.id();
      if (cabinetDisplays[id] === undefined) {
        cabinetDisplays[id] = new CabinetDisplay(room);
      }
      return cabinetDisplays[id];
    }
    this.cabinet = () => this.cabinetDisplay().active();
    const expListProps = {
      list: order.rooms,
      parentSelector, getHeader, getBody, getObject,
      inputValidation: (values) => values.name !== '' ? true : 'name must be defined',
      listElemLable: 'Room', type: 'pill',
      inputTree: RoomDisplay.configInputTree()
    };
    const expandList = new ExpandableObject(expListProps);
    expandList.afterRender(() => this.cabinetDisplay().refresh());
    this.refresh = () => expandList.refresh();
  }
}
RoomDisplay.configInputTree = () => {
  const dit = new DecisionInputTree(console.log);
  dit.leaf('Room', [Inputs('name')]);
  return dit;
}
RoomDisplay.bodyTemplate = new $t('room/body');
RoomDisplay.headTemplate = new $t('room/head');
module.exports = RoomDisplay
