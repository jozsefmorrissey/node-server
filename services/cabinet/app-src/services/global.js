const Order = require('../objects/order.js');
const Room = require('../objects/room.js');
const Group = require('../objects/group.js');
const Cabinet = require('../objects/assembly/assemblies/cabinet.js');
const CustomEvent = require('../../../../public/js/utils/custom-event.js');
const Request = require('../../../../public/js/utils/request.js');

Global = {
  order: (order) => {
    if (!order && ORDER === undefined) {
      var options = {  year: 'numeric', day: 'numeric' };
      var today  = new Date();
      const dateStr = new Date().toLocaleDateString("en-US", options).replace(/\//g, '-');
      order = new Order(`Order ${dateStr}`);
    }
    if (order && order instanceof Order && order !== ORDER) {
      const details = {from: ORDER, to: order};
      ORDER = order;
      Global.trigger.change.order(details);
      ROOM = undefined; GROUP = undefined; CABINET = undefined;
      Global.room();
    }
    return ORDER;
  },
  room: (room) => {
    if (!room && ROOM === undefined) {
      const rooms = Global.order().rooms;
      const keys = Object.keys(rooms);
      room = rooms[keys[0]];
    }
    if (room && room instanceof Room) {
      const details = {from: ROOM, to: room};
      ROOM = room;
      GROUP = undefined; CABINET = undefined;
      Global.trigger.change.room(details);
    }
    return ROOM;
  },
  group: (group) => {
    if (!group && GROUP === undefined) {
      GROUP = Global.room().groups[0];
    }
    if (group && group instanceof Group) {
      const details = {from: GROUP, to: group};
      GROUP = group;
      CABINET = undefined;
      Global.trigger.change.group(details);
    }
    return GROUP;
  },
  cabinet: (cabinet) => {
    if (!cabinet && CABINET === undefined) {
      CABINET = Global.group().objects.find(o => o instanceof Cabinet);
    }
    if (cabinet && cabinet !== CABINET && cabinet instanceof Cabinet) {
      const details = {from: CABINET, to: cabinet};
      CABINET = cabinet;
      Global.trigger.change.cabinet(details);
      Global.target(cabinet);
    }
    return CABINET;
  },
  target: (object) => {
    if (!object && TARGET === undefined) {
      TARGET = Global.group().objects[0];
    }
    if (object && object !== TARGET) {
      if (object instanceof Cabinet) Global.cabinet(object);
      const details = {from: TARGET, to: object};
      TARGET = object;
      Global.trigger.change.target(details);
    }
    return TARGET;
  }
}

class Displays {
  constructor() {
    Object.getSet(this, 'order', 'room', 'cabinet', 'template', 'property', 'main')
  }
}

Object.getSet(Global, 'order', 'room', 'cabinet', 'displayManager');
Object.defineProperty(Global, 'displays', {
  value: new Displays(),
  writable: false
});
CustomEvent.all(Global, 'load.order','(processing,change).(order,room,cabinet,group,target)');
let ORDER, ROOM, GROUP, CABINET, TARGET;
Global.order.static = (name) => {
  Request.get(`/cabinet/json/orders/${name}.json`,
    (json) =>
    Global.order(Order.fromJson(json)) && Global.trigger.load.order(Global.order()),
    (error) => console.error(error));
  }
Global.room.DEFAULT = new Room('FOR_TESTING_PURPOSES_ONLY');


module.exports = Global;
