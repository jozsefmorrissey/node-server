class Order {
  constructor(name) {
    this.name = name;
    this.rooms = []
    this.toJson = () => {
      const json = {name, rooms: []};
      this.rooms.forEach((room) => json.rooms.push(room.toJson()));
      return json;
    }
  }
}
