


const Cabinet = require('./assembly/assemblies/cabinet.js');
const Group = require('./group.js');
const Lookup = require('../../../../public/js/utils/object/lookup');
const Layout2D = require('../two-d/layout/layout.js');


class Room extends Lookup {
  constructor(name, id) {
    super(id || String.random(32));
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
      console.log('onlaychan', detail);
    }
    const initialVals = {
      name: name || `Room ${Room.count++}`,
      layout: new Layout2D()
    }
    initialVals.layout.onStateChange(onLayoutChange);
    Object.getSet(this, initialVals, 'groups');
    this.groups = [new Group(this)];
    this.addGroup = () => this.groups.push(new Group(this));
  }
};
Room.count = 0;
Group.defaultRoom = new Room('defaultRoom');

module.exports = Room;
