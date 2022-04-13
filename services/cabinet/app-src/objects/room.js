


const Cabinet = require('./assembly/assemblies/cabinet.js');
const Group = require('./group.js');
const Lookup = require('../../../../public/js/utils/object/lookup');


class Room extends Lookup {
  constructor(name, id) {
    super(id || String.random(32));
    const initialVals = {
      name: name || `Room ${Room.count++}`,
    }
    Object.getSet(this, initialVals, 'groups');
    this.groups = [new Group(this)];
    this.addGroup = () => this.groups.push(new Group(this));
  }
};
Room.count = 0;
new Room();

module.exports = Room;
