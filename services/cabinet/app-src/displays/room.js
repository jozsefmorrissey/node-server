


const Room = require('../objects/room.js');
const CabinetDisplay = require('./cabinet.js');
const GroupDisplay = require('./group.js');
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const Input = require('../../../../public/js/utils/input/input.js');
const ExpandableObject = require('../../../../public/js/utils/lists/expandable-object.js');
const $t = require('../../../../public/js/utils/$t.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const Inputs = require('../input/inputs.js');
const Lookup = require('../../../../public/js/utils/object/lookup.js');

class RoomDisplay extends Lookup {
  constructor(parentSelector, order) {
    super(order.id());
    const groupDisplays = {};
    const getHeader = (room, $index) =>
        RoomDisplay.headTemplate.render({room, $index});

    const getBody = (room, $index) => {
      return RoomDisplay.bodyTemplate.render({$index, room, groupHtml});
    }

    const groupHtml = (group) => {
      if (groupDisplays[group.id()] === undefined) {
        groupDisplays[group.id()] = new GroupDisplay(group);
      }
      return groupDisplays[group.id()].html();
    }

    const getObject = (values) => {
      const room = new Room(values.name);
      return room;
    }
    this.active = () => expandList.active();

    const expListProps = {
      list: order.rooms,
      parentSelector, getHeader, getBody, getObject,
      inputValidation: (values) => values.name !== '' ? true : 'name must be defined',
      listElemLable: 'Room', type: 'pill',
      inputTree: RoomDisplay.configInputTree()
    };
    const expandList = new ExpandableObject(expListProps);
    this.refresh = () => expandList.refresh();
  }
}

du.on.match('click', '.group-add-btn', (target) => {
  const id = target.getAttribute('room-id');
  const room = Room.get(id);
  const orderId = du.find.up('[order-id]', target).getAttribute('order-id');
  const roomDisplay = RoomDisplay.get(orderId);
  roomDisplay.refresh();
  room.addGroup();
});

RoomDisplay.configInputTree = () => {
  const dit = new DecisionInputTree(console.log);
  dit.leaf('Room', [Inputs('name')]);
  return dit;
}
RoomDisplay.bodyTemplate = new $t('room/body');
RoomDisplay.headTemplate = new $t('room/head');
module.exports = RoomDisplay
