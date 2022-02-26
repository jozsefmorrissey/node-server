

const Property = require('./property');
const Measurement = require('../../../../public/js/utils/measurment.js');
const EPNTS = require('../../generated/EPNTS');
const Request = require('../../../../public/js/utils/request.js');

const h = new Property('h', 'height', null);
const w = new Property('w', 'width', null);
const d = new Property('d', 'depth', null);
const t = new Property('t', 'thickness', null);
const l = new Property('l', 'length', null);


let unitCount = 0;
const UNITS = [];
Measurement.units().forEach((unit) =>
      UNITS.push(new Property('Unit' + ++unitCount, unit, unit === Measurement.unit())));
UNITS._VALUE = Measurement.unit();

const assemProps = {
  Overlay: [
    new Property('ov', 'Overlay', 1/2)
  ],
  Reveal: [
    new Property('r', 'Reveal', 1/8),
    new Property('rvt', 'Reveal Top', 1/2),
    new Property('rvb', 'Reveal Bottom', 0)
  ],
  Inset: [
    new Property('is', 'Spacing', 3/32)
  ],
  Cabinet: [
      h.clone(), w.clone(), d.clone(),
      new Property('sr', 'Scribe Right', 3/8),
      new Property('sl', 'Scribe Left', 3/8),
      new Property('rvibr', 'Reveal Inside Bottom Rail', 1/8),
      new Property('rvdd', 'Reveal Dual Door', 1/16),
      new Property('tkbw', 'Toe Kick Backer Width', 1/2),
      new Property('tkd', 'Toe Kick Depth', 4),
      new Property('tkh', 'Toe Kick Height', 4),
      new Property('pbt', 'Panel Back Thickness', 1/2),
      new Property('iph', 'Ideal Handle Height', 42)
  ],
  Panel: [
    h.clone(), w.clone(), t.clone()
  ],
  Guides: [
    l.clone(),
    new Property('dbtos', 'Drawer Box Top Offset', 1/2),
    new Property('dbsos', 'Drawer Box Side Offest', 3/16),
    new Property('dbbos', 'Drawer Box Bottom Offset', 1/2)
  ],
  Door: [
    h.clone(), w.clone(), t.clone()
  ],
  DrawerBox: [
    h.clone(), w.clone(), d.clone(),
    new Property('dbst', 'Side Thickness', 5/8),
    new Property('dbbt', 'Box Bottom Thickness', 1/4)
  ],
  DrawerFront: [
    h.clone(), w.clone(), t.clone()
  ],
  Frame: [
    h.clone(), w.clone(), t.clone()
  ],
  Handle: [
    l.clone(), w.clone(),
    new Property('c2c', 'Center To Center', null),
    new Property('proj', 'Projection', null),
  ],
  Hinge: [
    new Property('maxtab', 'Max Spacing from bore to edge of door', null),
    new Property('maxol', 'Max Door Overlay', null),
    new Property('mintab', 'Minimum Spacing from bore to edge of door', null),
    new Property('minol', 'Minimum Door Overlay', null)
  ]
}

const excludeKeys = ['_ID', '_NAME', '_GROUP', 'properties'];
function assemProperties(clazz, filter) {
  clazz = (typeof clazz) === 'string' ? clazz : clazz.constructor.name;
  props = assemProps[clazz] || [];
  if ((typeof filter) != 'function') return props;
  props = props.filter(filter);
  return props;
}

let config = {};
const changes = {};
const copyMap = {};
assemProperties.changes = {
  saveAll: () => Object.values(changes).forEach((list) => assemProperties.changes.save(list._ID)),
  save: (id) => {
    const list = changes[id];
    if (!list) throw new Error(`Unkown change id '${id}'`);
    const group = list._GROUP;
    if (config[group] === undefined) config[group] = [];
    if(copyMap[id] === undefined) {
      config[group][list._NAME] = {name: list._NAME, properties: JSON.clone(list, excludeKeys, true)};
      copyMap[list._ID] = config[group][list._NAME];
    } else {
      const tempList = changes[id];
      for (let index = 0; index < tempList.length; index += 1) {
        const tempProp = tempList[index];
        const configProp = copyMap[id][index];
        configProp.value(tempProp.value(), true);
      }
    }
   },
  deleteAll: () => Object.values(changes).forEach((list) => assemProperties.changes.delete(list._GROUP)),
  delete: (id) => delete changes[id],
  changed: (id) => {
    const list = changes[id];
    if (list === undefined) return false;
    for (let index = 0; index < list.length; index += 1) {
      const prop = list[index];
      if (copyMap[list._ID] === undefined || !copyMap[list._ID][index].equals(prop)) {
        return true;
      }
    }
    return false;
  },
  changesExist: () => {
      const lists = Object.values(changes);
      for (let index = 0; index < lists.length; index += 1) {
        if (assemProperties.changes.changed(lists[index]._ID)) {
          return true;
        }
      }
      return false;
  }
}

assemProperties.config = () => {
  const plainObj = {};
  const keys = Object.keys(config);
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const lists = config[key];
    const listKeys = Object.keys(lists);
    plainObj[key] = {};
    for (let lIndex = 0; lIndex < listKeys.length; lIndex += 1) {
      const listKey = listKeys[lIndex];
      const list = lists[listKey];
      const propObj = {name: listKey, properties: []};
      plainObj[key][listKey] = propObj;
      list.properties.forEach((property) =>
          propObj.properties.push(property.toJson(excludeKeys, true)))
    }
  }
  return plainObj;
}
assemProperties.list = () => Object.keys(assemProps);
assemProperties.new = (group, name) => {
  if (assemProps[group]) {
    const list = [];
    const ogList = assemProps[group];
    for (let index = 0; index < ogList.length; index += 1) {
      list[index] = ogList[index].clone();
    }
    list._ID = String.random();
    list._GROUP = group;
    list._NAME = name;
    changes[list._ID] = list;
    return list;
  }
  throw new Error(`Requesting invalid Property Group '${group}'`);
}

assemProperties.groupList = (group) => {
  console.log(group, `(${typeof group})`);
  const groupList = config[group];
  const changeList = {};
  if (groupList === undefined) return {};
  const groupKeys = Object.keys(groupList);
  for (let index = 0; index < groupKeys.length; index += 1) {
    const groupKey = groupKeys[index];
    const list = groupList[groupKey];
    const properties = groupList[list.name].properties;
    changeList[list.name] = {name: list.name, properties: []};
    for (let pIndex = 0; pIndex < properties.length; pIndex += 1) {
      changeList[list.name].properties.push(properties[pIndex].clone());
    }
    const uniqueId = String.random();
    changeList[list.name].properties._ID = uniqueId;
    changes[uniqueId] = changeList[list.name].properties;
    copyMap[uniqueId] = properties;
  }
  return changeList;
}
assemProperties.UNITS = UNITS;

assemProperties.load = (body) => {
  config = Object.fromJson(body);
}

module.exports = assemProperties;
