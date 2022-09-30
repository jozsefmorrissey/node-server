
const PropertyConfig = require('../config/property/config');
const Lookup = require('../../../../public/js/utils/object/lookup.js');

class Group extends Lookup {
  constructor(room, name, id) {
    super(id);
    const initialVals = {
      name: name || 'Group',
    }
    Object.getSet(this, initialVals);
    this.propertyConfig = new PropertyConfig();
    this.objects = [];
    this.room = () => room;
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
  const room = Lookup.get(json.roomId);
  const group = new Group(room, json.name, json.id);
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
