


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
const TwoDLayout = require('../displays/two-d-layout');
const ThreeDModel = require('../three-d/three-d-model.js');
const LoadingDisplay = require('../../../../public/js/utils/display/loading.js');
const Global = require('../services/global');

class RoomDisplay extends Lookup {
  constructor(parentSelector) {
    super();

    const groupDisplays = {};
    const getHeader = (room, $index) =>
        RoomDisplay.headTemplate.render({room, $index});

    const getBody = (room, $index) => {
      TwoDLayout.set(room.layout());
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

    function getExpandList() {
      const order = Global.order();
      const expandParentSelector = `${parentSelector}[order-id="${order.id()}"]`;
      const expandList = ExpandableObject.bySelector(expandParentSelector);
      if (expandList) return expandList;

      const expListProps = {
        getHeader, getBody, getObject,
        list: order.rooms,
        parentSelector: expandParentSelector,
        inputValidation: (values) => values.name !== '' ? true : 'name must be defined',
        listElemLable: 'Room', type: 'pill',
        inputTree: RoomDisplay.configInputTree()
      };
      return new ExpandableObject(expListProps);
    }

    this.setHtml =() => {

      du.find(parentSelector).setAttribute('order-id', Global.order().id());
      getExpandList();
    }
    this.setHtml();
    Global.onChange.room(this.setHtml);


    this.refresh = () => expandList.refresh();
  }
}

du.on.match('click', '.group-add-btn', (target) => {
  const id = target.getAttribute('room-id');
  const room = Room.get(id);
  const orderId = du.find.up('[order-id]', target).getAttribute('order-id');
  const roomDisplay = RoomDisplay.get(orderId);
  room.addGroup();
  roomDisplay.refresh();
});

RoomDisplay.configInputTree = () => {
  const dit = new DecisionInputTree('Room', {inputArray: [Inputs('name')]});
  return dit;
}
RoomDisplay.bodyTemplate = new $t('room/body');
RoomDisplay.headTemplate = new $t('room/head');
module.exports = RoomDisplay
