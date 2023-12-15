


const Group = require('./group.js');
const Lookup = require('../../../../public/js/utils/object/lookup');
const Layout2D = require('../two-d/layout/layout.js');


class Room extends Lookup {
  constructor(name, id, layout) {
    super(id || String.random());
    const instance = this;

    function groupMap(map, detailLists, listId) {
      for(let index = 0; index < detailLists[listId].length; index += 1) {
        const cabinet = detailLists[listId][index];
        const groupId = cabinet.group().id();
        if (map[groupId] === undefined) map[groupId] = {added: [], removed: []};
        map[groupId][listId].push(cabinet);
      }
    }

    function onLayoutChange(elem, detail) {
      const cabGroupMap = {};
      groupMap(cabGroupMap, detail.objects, 'removed');
      groupMap(cabGroupMap, detail.objects, 'added');

      instance.groups.forEach((g) => {
        if (cabGroupMap[g.id()]) {
          g.objects.removeAll(cabGroupMap[g.id()].removed);
          g.objects.concatInPlace(cabGroupMap[g.id()].added);
        }
      });
    }
    const initialVals = {
      name: name || `Room ${Room.count++}`,
      layout: layout || new Layout2D()
    }
    initialVals.layout.onStateChange(onLayoutChange);
    Object.getSet(this, initialVals, 'groups');
    this.groups = [new Group(this)];
    this.addGroup = () => this.groups.push(new Group(this));
  }
};
Room.count = 0;

Room.fromJson = (json) => {
  const room = new Room(json.name, json.id, Object.fromJson(json.layout));
  room.groups = [];
  for (let index = 0; index < json.groups.length; index++) {
    const groupJson = json.groups[index];
    groupJson.room = room;
    room.groups.push(Group.fromJson(groupJson));
  }
  return room;
}

Group.defaultRoom = new Room('defaultRoom');

module.exports = Room;
