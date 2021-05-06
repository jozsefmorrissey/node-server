
class Room {
  constructor(name, id) {
    this.name = name || `Room ${Room.count++}`;
    this.id = id || randomString(32);
    this.cabinets = [];
    this.toJson = () => {
      const json = {name: this.name, id: this.id, cabinets: []};
      this.cabinets.forEach((cabinet) => json.cabinets.push(cabinet.toJson()));
      return json;
    };
  }
};
Room.count = 0;
Room.fromJson = (roomJson) => {
  const room = new Room(roomJson.name, roomJson.id);
  roomJson.cabinets.forEach((cabJson) => room.cabinets.push(Cabinet.fromJson(cabJson)));
  return order;
}
