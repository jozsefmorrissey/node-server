


const Room = require('./room.js');

class Order {
  constructor(name, id) {
    const initialVals = {
      name: name || ++Order.count,
      id: id || String.random(32),
    }
    this.rooms = [];
    Object.getSet(this, initialVals);
  }
}

Order.count = 0;
module.exports = Order
