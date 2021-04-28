
class Room {
  constructor(name) {
    this.name = name || `Room ${Room.count++}`;
    this.id = randomString(32);
    this.cabinets = [];
    this.toJson = () => {
      const json = {name: this.name, id: this.id, cabinets: []};
      this.cabinets.forEach((cabinet) => json.cabinets.push(cabinet.toJson()));
      return json;
    };
  }
};
Room.count = 0;
