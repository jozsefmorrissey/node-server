


const Room = require('./room.js');

class Order {
  constructor(name, versionId, id) {
    if (id === null) this.loaded = false;
    else this.loaded = true;
    versionId ||= 'original';
    const initialVals = {
      name: name || ++Order.count,
      id: id || String.random(32),
    }
    Object.getSet(this, initialVals, 'rooms');
    Object.getSet(this, {_TEMPORARY: true, name, versionId});
    this.rooms = {};
    this.worthSaving = () => {
      const keys = Object.keys(this.rooms);
      const roomCount = keys.length;
      if (roomCount === 0) return false;
      if (roomCount > 1) return true;
      const groups = this.rooms[keys[0]].groups;
      return groups && groups[0].objects.length > 0;
    }
    this.addRoom = (name) => this.rooms[name] = new Room(name, this);
  }
}

Order.fromJson = (json) => {
  const order = new Order(json.name, json.versionId, json.id);
  const rooms = Object.values(json.rooms);
  for(let index = 0; index < rooms.length; index++) {
    const roomJson = rooms[index];
    roomJson.order = order;
    order.rooms[roomJson.name] = Room.fromJson(roomJson);
  }
  return order;
}

Order.count = 0;
module.exports = Order
