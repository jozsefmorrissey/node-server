


const Room = require('./room.js');

class Order {
  constructor(name, id) {
    if (id === null) this.loaded = false;
    else this.loaded = true;
    const initialVals = {
      name: name || ++Order.count,
      id: id || String.random(32),
    }
    Object.getSet(this, initialVals, 'rooms');
    this.rooms = {};
    this.addRoom = (name) => this.rooms[name] = new Room(name);
  }
}

Order.count = 0;
module.exports = Order
