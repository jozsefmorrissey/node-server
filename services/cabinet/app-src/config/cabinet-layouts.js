
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

  opening.divide(2);
  opening.vertical(false);
  opening.sections()[0].setSection("DrawerSection");
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
  opening.divide(2);
  opening.sectionProperties().pattern('232');
  opening.vertical(true);
  const left = opening.sections()[0];
  const center = opening.sections()[1];
  const right = opening.sections()[2];
  const a = 6*2.54

  left.divide(2);
  left.vertical(false);
  left.sections[0].setSection("DrawerSection");
  left.sections[1].setSection("DrawerSection");
  left.sections[2].setSection("DrawerSection");
  left.pattern('abb');

  center.divide(1);
  center.vertical(false);
  center.sections[1].setSection('DualDoorSection');
  center.pattern('ab');
  const centerTop = center.sections[0];

  centerTop.divide(2);
  centerTop.sections[0].setSection("DoorSection");
  centerTop.sections[1].setSection("FalseFrontSection");
  centerTop.sections[2].setSection("DoorSection");
  centerTop.pattern('232');
  centerTop.sections[0].cover().pull().location(Handle.location.RIGHT);
  centerTop.sections[2].cover().pull().location(Handle.location.LEFT);
  centerTop.vertical(true);

  right.divide(2);
  right.vertical(false);
  right.sections[0].setSection("DrawerSection");
  right.sections[1].setSection("DrawerSection");
  right.sections[2].setSection("DrawerSection");
  right.pattern('abb');
});

new CabinetLayout('test', (cabinet) => {
  cabinet.width(60*2.54);

  const opening = cabinet.openings[0];
  opening.divide(2);
  opening.sectionProperties().pattern('232');
  opening.vertical(true);
  const left = opening.sections()[0];
  const center = opening.sections()[1];
  const right = opening.sections()[2];
  const a = 6*2.54

  left.divide(3);
  left.vertical(false);
  left.sections[0].setSection("DrawerSection");
  left.sections[1].setSection("DrawerSection");
  left.sections[2].setSection("DrawerSection");
  left.sections[3].setSection("DrawerSection");
  left.pattern('aabb');

  center.divide(1);
  center.vertical(false);
  center.sections[1].setSection('DualDoorSection');
  center.pattern('ab');
  const centerTop = center.sections[0];
  const centerBottom = center.sections[1];

  centerTop.divide(2);
  centerTop.sections[0].setSection("DoorSection");
  centerTop.sections[1].setSection("FalseFrontSection");
  centerTop.sections[2].setSection("DoorSection");
  centerTop.pattern('232');
  centerTop.sections[0].cover().pull().location(Handle.location.RIGHT);
  centerTop.sections[2].cover().pull().location(Handle.location.LEFT);
  centerTop.vertical(true);

  right.divide(2);
  right.vertical(false);
  right.sections[0].setSection("DrawerSection");
  right.sections[1].setSection("DrawerSection");
  right.sections[2].setSection("DrawerSection");
  right.pattern('abb');

  centerTop.divider().divider().type('frontAndBack');
  left.sections[0].divider().divider().type('front');
  left.sections[1].divider().divider().type('front');
  left.sections[2].divider().divider().type('frontAndBack');
  right.sections[0].divider().divider().type('front');
  right.sections[1].divider().divider().type('front');

  let config = Void.referenceConfig('horizontal', 'c_BACK', 5*2.54, 5*2.54);
  let vOid = new Void(cabinet, 'Void1', config);
  cabinet.addSubAssembly(vOid);

  config = Void.referenceConfig('horizontal', 'c_L', 5*2.54, 5*2.54);
  vOid = new Void(cabinet, 'Void3', config);
  cabinet.addSubAssembly(vOid);

  config = Void.referenceConfig('horizontal', 'c_R', 5*2.54, 5*2.54);
  vOid = new Void(cabinet, 'Void5', config);
  cabinet.addSubAssembly(vOid);
});

new CabinetLayout('testSplit', (cabinet) => {
  cabinet.width(60*2.54);

  const opening = cabinet.openings[0];
  opening.divide(2);
  opening.sectionProperties().pattern('232');
  opening.vertical(true);
  const left = opening.sections()[0];
  const center = opening.sections()[1];
  const right = opening.sections()[2];
  const a = 6*2.54

  left.divide(2);
  left.vertical(false);
  left.sections[0].setSection("DrawerSection");
  left.sections[1].setSection("DrawerSection");
  left.sections[2].setSection("DrawerSection");
  left.pattern('abb');

  center.divide(1);
  center.vertical(false);
  center.sections[1].setSection('DualDoorSection');
  center.pattern('ab');
  const centerTop = center.sections[0];
  const centerBottom = center.sections[1];

  centerTop.divide(2);
  centerTop.sections[0].setSection("DoorSection");
  centerTop.sections[1].setSection("FalseFrontSection");
  centerTop.sections[2].setSection("DoorSection");
  centerTop.pattern('232');
  centerTop.sections[0].cover().pull().location(Handle.location.RIGHT);
  centerTop.sections[2].cover().pull().location(Handle.location.LEFT);
  centerTop.vertical(true);

  right.divide(2);
  right.vertical(false);
  right.sections[0].setSection("DrawerSection");
  right.sections[1].setSection("DrawerSection");
  right.sections[2].setSection("DrawerSection");
  right.pattern('abb');

  centerTop.divider().divider().type('frontAndBack');
  left.sections[0].divider().divider().type('front');
  left.sections[1].divider().divider().type('front');
  right.sections[0].divider().divider().type('front');
  right.sections[1].divider().divider().type('front');

  let config = Void.referenceConfig('horizontal', 'c_BACK', 5*2.54, 5*2.54);
  let vOid = new Void(cabinet, 'Void1', config);
  cabinet.addSubAssembly(vOid);

  config = Void.referenceConfig('vertical', 'c_BACK', 5*2.54, 5*2.54);
  vOid = new Void(cabinet, 'Void2', config);
  cabinet.addSubAssembly(vOid);

  config = Void.referenceConfig('horizontal', 'c_L', 5*2.54, 5*2.54);
  vOid = new Void(cabinet, 'Void3', config);
  cabinet.addSubAssembly(vOid);

  config = Void.referenceConfig('vertical', 'c_L', 5*2.54, 5*2.54);
  vOid = new Void(cabinet, 'Void4', config);
  cabinet.addSubAssembly(vOid);

  config = Void.referenceConfig('horizontal', 'c_R', 5*2.54, 5*2.54);
  vOid = new Void(cabinet, 'Void5', config);
  cabinet.addSubAssembly(vOid);

  config = Void.referenceConfig('vertical', 'c_R', 5*2.54, 5*2.54);
  vOid = new Void(cabinet, 'Void6', config);
  cabinet.addSubAssembly(vOid);
});
