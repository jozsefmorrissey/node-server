


const Group = require('./group.js');
const Lookup = require('../../../../public/js/utils/object/lookup');
const Layout2D = require('../two-d/layout/layout.js');
let Global;
const Object3D = require('../three-d/layout/object.js');

class Room extends Lookup {
  constructor(name, order, id, layout) {
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

    // function onLayoutChange(elem, detail) {
    //   const cabGroupMap = {};
    //   groupMap(cabGroupMap, detail.objects, 'removed');
    //   groupMap(cabGroupMap, detail.objects, 'added');
    //
    //   instance.groups.forEach((g) => {
    //     if (cabGroupMap[g.id()]) {
    //       g.objects.removeAll(cabGroupMap[g.id()].removed);
    //       g.objects.concatInPlace(cabGroupMap[g.id()].added);
    //     }
    //   });
    // }



    const obj3dMap = {};
    this.layoutObjects = (target) => {
      if (instance.groups === undefined) return [];
      // TODO: hacky fix for circular reference.
      if (Global === undefined) Global = require('../services/global.js');

      let selectorFunc;
      if (target === true) target = Global.group();
      if ((typeof target) === 'number') {
        selectorFunc = (group, index) => index === target
      } else if (target instanceof Group) {
        selectorFunc = (group) => group === target;
      } else {
        selectorFunc = () => true
      }
      const objs = [];
      for (let gi = 0; gi < instance.groups.length; gi++) {
        const group = instance.groups[gi];
        for (let oi = 0; oi < group.objects.length; oi++) {
          const obj = group.objects[oi];
          if (selectorFunc(group, index, obj)) {
            if (obj3dMap[obj.id()] === undefined) {
              obj3dMap[obj.id()] = Object3D.new(obj, this.layout());
            }
            objs.push(obj3dMap[obj.id()]);
          }
        }
      }
      return objs;
    }

    const initialVals = {
      name: name || `Room ${Room.count++}`,
      layout: layout || new Layout2D(this.layoutObjects)
    }
    // initialVals.layout.onStateChange(onLayoutChange);
    Object.getSet(this, initialVals, 'groups');
    this.groups = [new Group(this)];
    this.addGroup = (name) => {
      const group = new Group(this, name);
      this.groups.push(group);
      return group;
    }

    this.hash = () => name.hash() + this.groups.map(g => g.hash()).sum();

    this.name = (value) => {
      if (value) {
        const list = order && order.rooms ? order.rooms : {};
        name =  Object.values(list).map(r => r.name()).uniqueStringValue(value);
      }
      return name;
    }
    this.name(name);
  }
};
Room.count = 0;

Room.fromJson = (json) => {
  const layout = Object.fromJson(json.layout);
  const room = new Room(json.name, json.order, json.id, layout);
  room.groups = [];
  layout.setObjects(room.layoutObjects);
  for (let index = 0; index < json.groups.length; index++) {
    const groupJson = json.groups[index];
    groupJson.room = room;
    room.groups.push(Group.fromJson(groupJson));
  }
  return room;
}

Group.defaultRoom = new Room('defaultRoom');

module.exports = Room;
