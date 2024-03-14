
const Handle = require('../objects/assembly/assemblies/hardware/pull.js');
const Void = require('../objects/assembly/assemblies/void.js');

const map = {};
const list = () => Object.keys(map);

class CabinetLayout {
  constructor(name, build) {
    this.name = () => name;
    this.build = build;
    if (map[name]) throw new Error(`CabinetLayout '${name}' already exists`);
    map[name] = this;
  }
}


module.exports = {map, list};

new CabinetLayout('1dDD', (cabinet) => {
  cabinet.width(18*2.54);

  const opening = cabinet.openings[0];

  opening.divide(1);
  opening.vertical(false);
  opening.sections()[0].setSection("DrawerSection");
  opening.sections()[1].setSection("DualDoorSection");
});

new CabinetLayout('DD', (cabinet) => {
  cabinet.width(18*2.54);
  const opening = cabinet.openings[0];
  opening.divide(0);
  opening.sections()[0].setSection("DualDoorSection");
});

new CabinetLayout('DDDD', (cabinet) => {
  cabinet.width(18*2.54);
  const opening = cabinet.openings[0];
  opening.divide(1);
  opening.vertical(true);
  opening.sections()[0].setSection("DualDoorSection");
  opening.sections()[1].setSection("DualDoorSection");
});

new CabinetLayout('1dD', (cabinet) => {
  cabinet.width(18*2.54);

  const opening = cabinet.openings[0];

  opening.divide(1);
  opening.vertical(false);
  opening.sections()[0].setSection("DrawerSection");
  opening.sections()[1].setSection("DoorSection");
});

new CabinetLayout('3d', (cabinet) => {
  cabinet.width(18*2.54);

  const opening = cabinet.openings[0];

  opening.divide(2);
  opening.vertical(false);
  opening.sections()[0].setSection("DrawerSection");
  opening.sections()[1].setSection("DrawerSection");
  opening.sections()[2].setSection("DrawerSection");
});

new CabinetLayout('3dsb3d', (cabinet) => {
  cabinet.width(60*2.54);

  const opening = cabinet.openings[0];
  opening.sectionProperties().pattern('232');
  opening.vertical(true);
  const left = opening.sections()[0];
  const center = opening.sections()[1];
  const right = opening.sections()[2];
  const a = 6*2.54

  left.vertical(false);
  left.pattern('abb');
  left.sections[0].setSection("DrawerSection");
  left.sections[1].setSection("DrawerSection");
  left.sections[2].setSection("DrawerSection");

  center.vertical(false);
  center.pattern('ab');
  center.sections[1].setSection('DualDoorSection');
  const centerTop = center.sections[0];

  centerTop.pattern('232');
  centerTop.sections[0].setSection("DoorSection");
  centerTop.sections[1].setSection("FalseFrontSection");
  centerTop.sections[2].setSection("DoorSection");
  centerTop.sections[0].cover().pull().location(Handle.location.RIGHT);
  centerTop.sections[2].cover().pull().location(Handle.location.LEFT);
  centerTop.vertical(true);

  right.vertical(false);
  right.pattern('abb');
  right.sections[0].setSection("DrawerSection");
  right.sections[1].setSection("DrawerSection");
  right.sections[2].setSection("DrawerSection");
});

new CabinetLayout('test', (cabinet) => {
  cabinet.width(60*2.54);

  const opening = cabinet.openings[0];
  opening.sectionProperties().pattern('232');
  opening.vertical(true);
  const left = opening.sections()[0];
  const center = opening.sections()[1];
  const right = opening.sections()[2];
  const a = 6*2.54

  left.vertical(false);
  left.pattern('aabb');
  left.sections[0].setSection("DrawerSection");
  left.sections[1].setSection("DrawerSection");
  left.sections[2].setSection("DrawerSection");
  left.sections[3].setSection("DrawerSection");

  center.vertical(false);
  center.pattern('ab');
  center.sections[1].setSection('DualDoorSection');
  const centerTop = center.sections[0];
  const centerBottom = center.sections[1];

  centerTop.pattern('232');
  centerTop.sections[0].setSection("DoorSection");
  centerTop.sections[1].setSection("FalseFrontSection");
  centerTop.sections[2].setSection("DoorSection");
  centerTop.sections[0].cover().pull().location(Handle.location.RIGHT);
  centerTop.sections[2].cover().pull().location(Handle.location.LEFT);
  centerTop.vertical(true);

  right.vertical(false);
  right.pattern('abb');
  right.sections[0].setSection("DrawerSection");
  right.sections[1].setSection("DrawerSection");
  right.sections[2].setSection("DrawerSection");

  centerTop.divider().divider().type('frontAndBack');
  left.sections[0].divider().divider().type('front');
  left.sections[1].divider().divider().type('front');
  left.sections[2].divider().divider().type('frontAndBack');
  right.sections[0].divider().divider().type('front');
  right.sections[1].divider().divider().type('front');

  let config = Void.referenceConfig('horizontal', 'c_BACK', 5*2.54, 5*2.54);
  let vOid = new Void(0, 'Void1', config);
  cabinet.addSubAssembly(vOid);

  config = Void.referenceConfig('horizontal', 'c_L', 5*2.54, 5*2.54);
  vOid = new Void(1, 'Void3', config);
  cabinet.addSubAssembly(vOid);

  config = Void.referenceConfig('horizontal', 'c_R', 5*2.54, 5*2.54);
  vOid = new Void(2, 'Void5', config);
  cabinet.addSubAssembly(vOid);
});

new CabinetLayout('testSplit', (cabinet) => {
  cabinet.width(60*2.54);

  const opening = cabinet.openings[0];
  opening.sectionProperties().pattern('232');
  opening.vertical(true);
  const left = opening.sections()[0];
  const center = opening.sections()[1];
  const right = opening.sections()[2];
  const a = 6*2.54

  left.vertical(false);
  left.pattern('abb');
  left.sections[0].setSection("DrawerSection");
  left.sections[1].setSection("DrawerSection");
  left.sections[2].setSection("DrawerSection");

  center.vertical(false);
  center.pattern('ab');
  center.sections[1].setSection('DualDoorSection');
  const centerTop = center.sections[0];
  const centerBottom = center.sections[1];

  centerTop.pattern('232');
  centerTop.sections[0].setSection("DoorSection");
  centerTop.sections[1].setSection("FalseFrontSection");
  centerTop.sections[2].setSection("DoorSection");
  centerTop.sections[0].cover().pull().location(Handle.location.RIGHT);
  centerTop.sections[2].cover().pull().location(Handle.location.LEFT);
  centerTop.vertical(true);

  right.vertical(false);
  right.pattern('abb');
  right.sections[0].setSection("DrawerSection");
  right.sections[1].setSection("DrawerSection");
  right.sections[2].setSection("DrawerSection");

  centerTop.divider().divider().type('frontAndBack');
  left.sections[0].divider().divider().type('front');
  left.sections[1].divider().divider().type('front');
  right.sections[0].divider().divider().type('front');
  right.sections[1].divider().divider().type('front');

  let config = Void.referenceConfig('horizontal', 'c_BACK', 5*2.54, 5*2.54);
  let vOid = new Void(0, 'Void1', config);
  cabinet.addSubAssembly(vOid);

  config = Void.referenceConfig('vertical', 'c_BACK', 5*2.54, 5*2.54);
  vOid = new Void(1, 'Void2', config);
  cabinet.addSubAssembly(vOid);

  config = Void.referenceConfig('horizontal', 'c_L', 5*2.54, 5*2.54);
  vOid = new Void(2, 'Void3', config);
  cabinet.addSubAssembly(vOid);

  config = Void.referenceConfig('vertical', 'c_L', 5*2.54, 5*2.54);
  vOid = new Void(3, 'Void4', config);
  cabinet.addSubAssembly(vOid);

  config = Void.referenceConfig('horizontal', 'c_R', 5*2.54, 5*2.54);
  vOid = new Void(4, 'Void5', config);
  cabinet.addSubAssembly(vOid);

  config = Void.referenceConfig('vertical', 'c_R', 5*2.54, 5*2.54);
  vOid = new Void(5, 'Void6', config);
  cabinet.addSubAssembly(vOid);
});
