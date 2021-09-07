


const Room = require('./room.js');

class Order {
  constructor(name, id) {
    this.name = name || ++Order.count;
    this.id = id || String.random(32);
    this.rooms = []
    this.toJson = () => {
      const json = {name: this.name, rooms: []};
      this.rooms.forEach((room) => json.rooms.push(room.toJson()));
      return json;
    }
  }
}

Order.count = 0;
Order.fromJson = (orderJson) => {
  const order = new Order(orderJson.name, orderJson.id);
  orderJson.rooms.forEach((roomJson) => order.rooms.push(Room.fromJson(roomJson)));
  return order;
}
module.exports = Order




