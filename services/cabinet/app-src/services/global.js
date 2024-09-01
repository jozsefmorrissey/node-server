const Order = require('../objects/order.js');
const Room = require('../objects/room.js');
const Cabinet = require('../objects/assembly/assemblies/cabinet.js');
const CustomEvent = require('../../../../public/js/utils/custom-event.js');
const Request = require('../../../../public/js/utils/request.js');

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


    CustomEvent.all(this, 'load.order','change.order','change.room','change.cabinet',
                    'change.group','change.target');

    let ORDER, ROOM, GROUP, CABINET, TARGET;
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
        this.trigger.change.order(details);
        ROOM = undefined; GROUP = undefined; CABINET = undefined;
        this.room();
      }
      return ORDER;
    }

    this.order.static = (name) => {
      Request.get(`/cabinet/json/orders/${name}.json`,
      (json) =>
        this.order(Order.fromJson(json)) && this.trigger.load.order(this.order()),
      (error) => console.error(error));
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
        this.trigger.change.room(details);
      }
      return ROOM;
    }
    this.room.DEFAULT = new Room('FOR_TESTING_PURPOSES_ONLY');

    this.group = (group) => {
      if (group && group instanceof Cabinet) {
        const details = {from: GROUP, to: group};
        GROUP = group;
        CABINET = undefined;
        this.trigger.change.group(details);
      }
      return CABINET;
    }
    this.cabinet = (cabinet) => {
      if (cabinet && cabinet !== CABINET && cabinet instanceof Cabinet) {
        const details = {from: CABINET, to: cabinet};
        CABINET = cabinet;
        this.trigger.change.cabinet(details);
        this.target(cabinet);
      }
      return CABINET;
    }
    this.target = (object) => {
      if (object && object !== TARGET) {
        if (object instanceof Cabinet) this.cabinet(object);
        const details = {from: TARGET, to: object};
        TARGET = object;
        this.trigger.change.target(details);
      }
      return TARGET;
    }
  }
}

module.exports = new Global();
