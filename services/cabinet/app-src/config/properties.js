

const Property = require('./property');
const Defs = require('./property/definitions');
const Measurement = require('../../../../public/js/utils/measurement.js');
const EPNTS = require('../../generated/EPNTS');
const Request = require('../../../../public/js/utils/request.js');

let unitCount = 0;
const UNITS = [];
Measurement.units().forEach((unit) =>
      UNITS.push(new Property('Unit' + ++unitCount, unit, unit === Measurement.unit())));
UNITS._VALUE = Measurement.unit();

const assemProps = {}
const add = (key, properties) => properties.forEach((prop) => {
  if (assemProps[key] === undefined) assemProps[key] = {};
  assemProps[key][prop.code()] = prop;
});

add('Overlay', [Defs.ov]);
add('Reveal', [Defs.r,Defs.rvt,Defs.rvb,Defs.rvr,Defs.rvl]);
add('Inset', [Defs.is]);
add('Cabinet', [Defs.h,Defs.w,Defs.d,Defs.sr,Defs.sl,Defs.rvibr,Defs.rvdd,
                Defs.tkbw,Defs.tkd,Defs.tkh,Defs.pbt,Defs.iph, Defs.brr,
                Defs.frw,Defs.frt]);
add('Panel', [Defs.h,Defs.w,Defs.t]);
add('Guides', [Defs.l,Defs.dbtos,Defs.dbsos,Defs.dbbos]);
add('DoorAndFront', [Defs.daffrw,Defs.dafip])
add('Door', [Defs.h,Defs.w,Defs.t]);
add('DrawerBox', [Defs.h,Defs.w,Defs.d,Defs.dbst,Defs.dbbt,Defs.dbid,Defs.dbn]);
add('DrawerFront', [Defs.h,Defs.w,Defs.t,Defs.mfdfd]);
add('Frame', [Defs.h,Defs.w,Defs.t]);
add('Handle', [Defs.l,Defs.w,Defs.c2c,Defs.proj]);
add('Hinge', [Defs.maxtab,Defs.mintab,Defs.maxol,Defs.minol]);
add('Opening', []);

function definitionsRequired(group) {
  const required = [];
  if (assemProps[group] === undefined) return [];
  Object.values(assemProps[group]).forEach((prop) => {
    if (prop instanceof Property && prop.value() !== null) required.push(prop);
  });
  return required;
}

function propertiesToDefine() {
  const propNames = [];
  const keys = Object.keys(assemProps);
  keys.forEach((key) => {
    if (definitionsRequired(key).length !== 0) {
      propNames.push(key);
    }
  });
  return propNames;
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
    let addIndex = 0;
    const ogList = Object.values(assemProps[group]);
    for (let index = 0; index < ogList.length; index += 1) {
      if (hasValueFilter(ogList[index])) {
        list[addIndex++] = ogList[index].clone();
      }
    }
    list._ID = String.random();
    list._GROUP = group;
    list._NAME = name;
    changes[list._ID] = list;
    return list;
  }
  throw new Error(`Requesting invalid Property Group '${group}'`);
}

assemProperties.instance = () => {
  const keys = Object.keys(assemProps);
  const clone = {};
  keys.forEach((key) => {
    const props = Object.values(assemProps[key]);
    if (clone[key] === undefined) clone[key] = {};
    props[keys] = {};
    props.forEach((prop) => clone[key][prop.code()] = prop.clone());
  });
  return clone;
};

assemProperties.getSet = (group, setName) => {
  const clone = {};
  let propertyObj = config[group][setName];
  propertyObj.properties.forEach((prop) => clone[prop.code()] = prop.clone());
  clone.__KEY = setName;
  return clone;
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
    const id = String.random();
    const set = changeList[list.name].properties;
    set._ID = id;
    set._NAME = list.name;
    changes[id] = set;
    copyMap[id] = properties;
  }
  return changeList;
}

const hasValueFilter = (prop) => prop.value() !== null;
assemProperties.hasValue = (group) => {
  if (props === undefined) return [];
  return assemProperties.groupList(group, hasValueFilter);
}

const list = (key) =>
    assemProps[key] ? Object.values(assemProps[key]) : [];

const noValueFilter = (prop) => prop.value() === null;
assemProperties.noValue = (group) => {
  const props = list(group);
  if (props === undefined) return [];
  return props.filter(noValueFilter);
}

assemProperties.all = () => {
  const props = {};
  const keys = Object.keys(assemProps);
  keys.forEach((key) => {
    const l = [];
    list(key).forEach((prop) => l.push(prop));
    props[key] = l;
  });
  return props;
}

assemProperties.UNITS = UNITS;

assemProperties.load = (body) => {
  config = Object.fromJson(body);
}

assemProperties.definitionsRequired = definitionsRequired;
assemProperties.propertiesToDefine = propertiesToDefine;
module.exports = assemProperties;
