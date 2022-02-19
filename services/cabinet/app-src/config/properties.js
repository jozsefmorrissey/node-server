

const Property = require('./property');
const Measurement = require('../../../../public/js/utils/measurment.js');

const h = new Property('h', 'height', null);
const w = new Property('w', 'width', null);
const d = new Property('d', 'depth', null);
const t = new Property('t', 'thickness', null);
const l = new Property('l', 'length', null);


let unitCount = 0;
const UNIT = [];
Measurement.units().forEach((unit) =>
      UNIT.push(new Property('Unit' + ++unitCount, unit, unit === Measurement.unit())));
UNIT._IS_RADIO = true;
UNIT._VALUE = Measurement.unit();

const assemProps = {
  UNIT,
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

function assemProperties(clazz, filter) {
  clazz = (typeof clazz) === 'string' ? clazz : clazz.constructor.name;
  props = assemProps[clazz] || [];
  if ((typeof filter) != 'function') return props;
  props = props.filter(filter);
  return props;
}

const config = {};
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
      config[group].push(JSON.clone(changes[id]));
      copyMap[list._ID] = config[group][config[group].length - 1];
    } else {
      const tempList = changes[id];
      for (let index = 0; index < tempList.length; index += 1) {
        const tempProp = tempList[index];
        const configProp = copyMap[id][index];
        configProp.fromJson(tempProp.toJson());
      }
    }
    console.log('config', config);
    console.log('changes', changes);
  },
  deleteAll: () => Object.values(changes).forEach((list) => assemProperties.delete(list._GROUP)),
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
  }
}

assemProperties.list = () => Object.keys(assemProps);
assemProperties.get = (group) => {
  if (assemProps[group]) {
    const list = [];
    const ogList = assemProps[group];
    for (let index = 0; index < ogList.length; index += 1) {
      list[index] = ogList[index].clone();
    }
    list._ID = String.random();
    list._GROUP = group;
    changes[list._ID] = list;
    return list;
  }
  throw new Error(`Requesting invalid Property Group '${group}'`);
}


module.exports = assemProperties;
