
const PropertyConfig = require('../config/property/config');
const Lookup = require('../../../../public/js/utils/object/lookup.js');

let groupIndex = -2;
class Group extends Lookup {
  constructor(room, name, id) {
    super(id);
    name ||= 'Group ';
    room ||= Group.defaultRoom;
    const initialVals = {name}
    Object.getSet(this, initialVals);
    this.propertyConfig = new PropertyConfig();
    this.objects = [];
    this.room = () => room;

    this.name = (value) => {
      if (value) {
        const list = room && Array.isArray(room.groups) ? room.groups : [];
        name =  list.map(g => g.name()).uniqueStringValue(value);
      }
      return name;
    }

    this.addObject = (obj) => {
      if (obj.group) obj.group(this);
      this.objects.push(obj);
    }

    this.hash = () => name.hash() + this.objects.map(o => o.hash ? o.hash() : 0).sum();

    this.resolve = (one, two, three) => {
      const lower = two ? two.toLowerCase() : null;
      const funcName = propertyFunctionMap[lower];
      if (one) {
        if (room) {
          const layout = room.layout();
          if (layout && lower) {
            const func = layout[funcName];
            if (func instanceof Function) return func(three);
          }
          return this.propertyConfig(one, two, three);
        } else {
          if (one) {
            return propertyFunctionDefaults[funcName] || this.propertyConfig(one, two, three);;
          }
        }
      }
    }

    this.toJson = () => {
      const json = {objects: [], _TYPE: 'Group'};
      this.objects.forEach((obj) => json.objects.push(obj.toJson()));
      json.name = this.name();
      json.id = this.id();
      json.roomId = this.room().id();
      json.propertyConfig = this.propertyConfig.toJson();
      return json;
    }
    this.name(name);
  }
}

Group.count = 0;
Group.DEFAULT = new Group();

Group.fromJson = (json) => {
  const group = new Group(json.room, json.name, json.id);
  group.propertyConfig = PropertyConfig.fromJson(json.propertyConfig);
  json.objects.forEach((objJson) => {
    const jsonClazz = Object.class.get(json.objects[0]._TYPE);
    const obj = jsonClazz.fromJson(objJson, group);
    group.objects.push(obj);
    obj.group(group);
  });
  return group;
}


const propertyFunctionMap = {
  ceilh: 'ceilingHeight',
  ceillingheight: 'ceilingHeight',
  baseh: 'baseHeight',
  baseheight: 'baseHeight',
  wallh: 'wallHeight',
  wallheight: 'wallHeight',
  based: 'baseDepth',
  basedepth: 'baseDepth',
  walld: 'wallDepth',
  walldepth: 'wallDepth',
  walle: 'wallElevation',
  wallelevation: 'wallElevation',
  counterh: 'counterHeight',
  counterheight: 'counterHeight',
}

const propertyFunctionDefaults = {
  ceilingHeight: 96*2.54,
  baseHeight: 34*2.54,
  wallHeight: 34*2.54,
  baseDepth: 24*2.54,
  wallDepth: 12*2.54,
  wallElevation: 52*2.54,
}

module.exports = Group;
