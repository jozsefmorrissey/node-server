

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

const IMPERIAL_US = Measurement.units()[1];
const assemProps = {
  Overlay: [
    new Property('ov', 'Overlay', {value: 1/2, notMetric: IMPERIAL_US})
  ],
  Reveal: [
    new Property('r', 'Reveal', {value: 1/8, notMetric: IMPERIAL_US}),
    new Property('rvt', 'Reveal Top', {value: 1/2, notMetric: IMPERIAL_US}),
    new Property('rvb', 'Reveal Bottom', {value: 0, notMetric: IMPERIAL_US})
  ],
  Inset: [
    new Property('is', 'Spacing', {value: 3/32, notMetric: IMPERIAL_US})
  ],
  Cabinet: [
      h.clone(), w.clone(), d.clone(),
      new Property('sr', 'Scribe Right', {value: 3/8, notMetric: IMPERIAL_US}),
      new Property('sl', 'Scribe Left', {value: 3/8, notMetric: IMPERIAL_US}),
      new Property('rvibr', 'Reveal Inside Bottom Rail', {value: 1/8, notMetric: IMPERIAL_US}),
      new Property('rvdd', 'Reveal Dual Door', {value: 1/16, notMetric: IMPERIAL_US}),
      new Property('tkbw', 'Toe Kick Backer Width', {value: 1/2, notMetric: IMPERIAL_US}),
      new Property('tkd', 'Toe Kick Depth', {value: 4, notMetric: IMPERIAL_US}),
      new Property('tkh', 'Toe Kick Height', {value: 4, notMetric: IMPERIAL_US}),
      new Property('pbt', 'Panel Back Thickness', {value: 1/2, notMetric: IMPERIAL_US}),
      new Property('iph', 'Ideal Handle Height', {value: 42, notMetric: IMPERIAL_US})
  ],
  Panel: [
    h.clone(), w.clone(), t.clone()
  ],
  Guides: [
    l.clone(),
    new Property('dbtos', 'Drawer Box Top Offset', {value: 1/2, notMetric: IMPERIAL_US}),
    new Property('dbsos', 'Drawer Box Side Offest', {value: 3/16, notMetric: IMPERIAL_US}),
    new Property('dbbos', 'Drawer Box Bottom Offset', {value: 1/2, notMetric: IMPERIAL_US})
  ],
  DoorAndFront:[
    new Property('daffrw', 'Door and front frame rail width', {value: '2 3/8', notMetric: IMPERIAL_US}),
    new Property('dafip', 'Door and front inset panel', {value: null})
  ],
  Door: [
    h.clone(), w.clone(), t.clone()
  ],
  DrawerBox: [
    h.clone(), w.clone(), d.clone(),
    new Property('dbst', 'Side Thickness', {value: 5/8, notMetric: IMPERIAL_US}),
    new Property('dbbt', 'Box Bottom Thickness', {value: 1/4, notMetric: IMPERIAL_US}),
    new Property('dbid', 'Bottom Inset Depth', {value: 1/2, notMetric: IMPERIAL_US}),
    new Property('dbn', 'Bottom Notched', {value: true, notMetric: IMPERIAL_US})
  ],
  DrawerFront: [
    h.clone(), w.clone(), t.clone(),
    new Property('mfdfd', 'Minimum Framed Drawer Front Height', {value: 6, notMetric: IMPERIAL_US})
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
    new Property('maxtab', 'Max Spacing from bore to edge of door', {value: 1/4, notMetric: IMPERIAL_US}),
    new Property('mintab', 'Minimum Spacing from bore to edge of door', {value: 1/4, notMetric: IMPERIAL_US}),
    new Property('maxol', 'Max Door Overlay', {value: 1/2, notMetric: IMPERIAL_US}),
    new Property('minol', 'Minimum Door Overlay', {value: .5, notMetric: IMPERIAL_US})
  ],
  Opening: []
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
      copyMap[list._ID] = config[group][list._NAME].properties;
    } else {
      const tempList = changes[id];
      for (let index = 0; index < tempList.length; index += 1) {
        const tempProp = tempList[index];
        const configProp = copyMap[id][index];
        configProp.value(tempProp.value());
      }
    }
   },
  deleteAll: () => Object.values(changes).forEach((list) => assemProperties.changes.delete(list._GROUP)),
  delete: (id) => {
    delete config[changes[id][0].name()][changes[id]._NAME];
    delete changes[id];
    delete copyMap[id];
  },
  changed: (id) => {
    const list = changes[id];
    if (list === undefined) return false;
    for (let index = 0; index < list.length; index += 1) {
      const prop = list[index];
      if (prop === undefined || (copyMap[list._ID] !== undefined && copyMap[list._ID][index] === undefined)) {
        console.log('booyacka!');
      }
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
    const ogList = assemProps[group].filter(hasValueFilter);
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

const dummyFilter = () => true;
assemProperties.groupList = (group, filter) => {
  filter = filter || dummyFilter;
  const groupList = config[group];
  const changeList = {};
  if (groupList === undefined) return {};
  const groupKeys = Object.keys(groupList);
  for (let index = 0; index < groupKeys.length; index += 1) {
    const groupKey = groupKeys[index];
    const list = groupList[groupKey];
    const properties = groupList[list.name].properties;
    const codes = properties.map((prop) => prop.code());
    // const newProps = assemProps[group].filter((prop) => codes.indexOf(prop.code()) === -1)
    //                   .filter(filter);
    // newProps.forEach((prop) => properties.push(prop.clone()));
    changeList[list.name] = {name: list.name, properties: []};
    for (let pIndex = 0; pIndex < properties.length; pIndex += 1) {
      const prop = properties[pIndex];
      changeList[list.name].properties.push(prop.clone());
    }
    const uniqueId = String.random();
    const set = changeList[list.name].properties;
    set._ID = uniqueId;
    set._NAME = list.name;
    changes[uniqueId] = set;
    copyMap[uniqueId] = properties;
  }
  return changeList;
}

const hasValueFilter = (prop) => prop.value() !== null;
assemProperties.hasValue = (group) => {
  return assemProperties.groupList(group, hasValueFilter);
}

const noValueFilter = (prop) => prop.value() === null;
assemProperties.noValue = (group) => {
  const props = assemProps[group];
  return props.filter(noValueFilter);
}

assemProperties.UNITS = UNITS;

assemProperties.load = (body) => {
  config = Object.fromJson(body);
}

module.exports = assemProperties;
