
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
    this.cabinets = [];
    this.room = () => room;
    this.toJson = () => {
      const json = {cabinets: [], _TYPE: 'Group'};
      this.cabinets.forEach((cabinet) => json.cabinets.push(cabinet.toJson()));
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
  json.cabinets.forEach((cabinetJson) => {
    cabinetJson.propertyConfig = group.propertyConfig;
    group.cabinets.push(Object.fromJson(cabinetJson))
  });
  return group;
}

module.exports = Group;
