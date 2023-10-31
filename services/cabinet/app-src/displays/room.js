


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
  constructor(parentSelector, order) {
    super();

    const groupDisp = new GroupDisplay();
    const getHeader = (room, $index) =>
        RoomDisplay.headTemplate.render({room, $index});

    const getBody = (room, $index) => {
      Global.room(room);
      TwoDLayout.panZoom.once();
      groupDisp.active(room.groups[0]);
      return RoomDisplay.bodyTemplate.render({$index, room, groupHtml});
    }

    this.order = (ord) => {
      if (ord) {
        order = ord;
      }
      return order || Global.order();
    }

    const groupHtml = (group) => {
      return groupDisp.html(group);
    }

    const getObject = (values) => {
      const room = new Room(values.name);
      return room;
    }
    this.active = () => expandList.active();

    const expListProps = {
      getHeader, getBody, getObject, parentSelector,
      inputValidation: (values) => values.name !== '' ? true : 'name must be defined',
      listElemLable: 'Room', type: 'pill',
      inputTree: RoomDisplay.configInputTree()
    };
    const expandList = new ExpandableObject(expListProps);


    function getExpandList() {
      const order = Global.order();
      expListProps.list = order.rooms;
      return expandList;
    }

    this.setHtml =() => {
      du.find(parentSelector).setAttribute('order-id', this.order().id());
      getExpandList();
    }
    this.setHtml();
    Global.onChange.room(this.setHtml);

    this.html = () => getExpandList().html();


    this.refresh = () => getExpandList().refresh();

    du.on.match('click', '.group-add-btn', (target) => {
      const room = Global.room();
      room.addGroup();
      this.refresh();
    });

  }
}

RoomDisplay.configInputTree = () => {
  const dit = new DecisionInputTree('Room', {inputArray: [Inputs('name')]});
  return dit;
}
RoomDisplay.bodyTemplate = new $t('room/body');
RoomDisplay.headTemplate = new $t('room/head');
module.exports = RoomDisplay
