


const Cabinet = require('./assembly/assemblies/cabinet.js');


class Room {
  constructor(name, id) {

    const initialVals = {
      name: name || `Room ${Room.count++}`,
      id: id || String.random(32),
    }
    Object.getSet(this, initialVals);

    this.cabinets = [];
    this.toJson = () => {
      const json = { cabinets: []};
      this.cabinets.forEach((cabinet) => json.cabinets.push(cabinet.toJson()));
      return json;
    };
  }
};
Room.count = 0;
Room.fromJson = (roomJson) => {
  const room = new Room(roomJson.name, roomJson.id);
  roomJson.cabinets.forEach((cabJson) => room.cabinets.push(Cabinet.fromJson(cabJson)));
  return room;
}
module.exports = Room
