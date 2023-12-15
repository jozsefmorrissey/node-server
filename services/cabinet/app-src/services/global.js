const Order = require('../objects/order.js');
const Room = require('../objects/room.js');
const Cabinet = require('../objects/assembly/assemblies/cabinet.js');
const CustomEvent = require('../../../../public/js/utils/custom-event.js');

class Displays {
  constructor() {
    Object.getSet(this, 'order', 'room', 'cabinet', 'template', 'property', 'main')
  }
}

class Global {
  constructor() {
    Object.getSet(this, 'order', 'room', 'cabinet', 'displayManager');
    Object.defineProperty(this, 'displays', {
        value: new Displays(),
        writable: false
    });

    const orderChangeEvent = new CustomEvent('orderChanged');
    const roomChangeEvent = new CustomEvent('roomChanged');
    const cabinetChangeEvent = new CustomEvent('cabinetChanged');
    const groupChangeEvent = new CustomEvent('cabinetChanged');

    Object.defineProperty(this, 'onChange', {
        value: {
          order: orderChangeEvent.on,
          room: roomChangeEvent.on,
          cabinet: cabinetChangeEvent.on,
          group: groupChangeEvent.on
        },
        writable: false
    });

    let ORDER, ROOM, GROUP, CABINET;
    this.order = (order) => {
      if (!order && ORDER === undefined) {
        var options = {  year: 'numeric', day: 'numeric' };
        var today  = new Date();
        const dateStr = new Date().toLocaleDateString("en-US", options).replace(/\//g, '-');
        order = new Order(`Order ${dateStr}`);
      }
      if (order && order instanceof Order && order !== ORDER) {
        const details = {from: ORDER, to: order};
        ORDER = order;
        orderChangeEvent.trigger(details);
        ROOM = undefined; GROUP = undefined; CABINET = undefined;
        this.room();
      }
      return ORDER;
    }
    this.room = (room) => {
      if (!room && ROOM === undefined) {
        const rooms = this.order().rooms;
        const keys = Object.keys(rooms);
        room = rooms[keys[0]];
      }
      if (room && room instanceof Room) {
        const details = {from: ROOM, to: room};
        ROOM = room;
        GROUP = undefined; CABINET = undefined;
        roomChangeEvent.trigger(details);
      }
      return ROOM;
    }
    this.room.DEFAULT = new Room('FOR_TESTING_PURPOSES_ONLY');

    this.group = (group) => {
      if (group && group instanceof Cabinet) {
        const details = {from: GROUP, to: group};
        GROUP = group;
        CABINET = undefined;
        groupChangeEvent.trigger(details);
      }
      return CABINET;
    }
    this.cabinet = (cabinet) => {
      if (cabinet && cabinet instanceof Cabinet) {
        const details = {from: CABINET, to: cabinet};
        CABINET = cabinet;
        cabinetChangeEvent.trigger(details);
      }
      return CABINET;
    }
  }
}

module.exports = new Global();
