
const PropertyConfig = require('../config/property/config');
const Lookup = require('../../../../public/js/utils/object/lookup.js');

let groupIndex = -2;
class Group extends Lookup {
  constructor(room, name, id) {
    super(id);
    room ||= Group.defaultRoom;
    const initialVals = {
      name: name || new String(groupIndex++),
    }
    Object.getSet(this, initialVals);
    this.propertyConfig = new PropertyConfig();
    this.objects = [];
    this.room = () => room;

    this.resolve = (one, two, three) => {
      if (one) {
        const layout = room.layout();
        if (layout && (typeof two) === 'string') {
          const lower = two.toLowerCase();
          if(lower === 'ceilh' || 'ceillingheight' === lower) return layout.ceilingHeight(three);
          if(lower === 'baseh' || 'baseheight' === lower) return layout.baseHeight(three);
          if(lower === 'wallh' || 'wallheight' === lower) return layout.wallHeight(three);
          if(lower === 'based' || 'basedepth' === lower) return layout.baseDepth(three);
          if(lower === 'walld' || 'walldepth' === lower) return layout.wallDepth(three);
          if(lower === 'walle' || 'wallelevation' === lower) return layout.wallElevation(three);
          if(lower === 'counterh' || 'counterheight' === lower) return layout.counterHeight(three);
        }
        return this.propertyConfig(one, two, three);
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
  }
}

Group.count = 0;
new Group();

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

module.exports = Group;
