
const Handle = require('../objects/assembly/assemblies/hardware/pull.js');

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
  opening.sections[0].setSection("DrawerSection");
  opening.sections[1].setSection("DualDoorSection");
  opening.pattern('ab').value('a', 6);
});

new CabinetLayout('1dD', (cabinet) => {
  cabinet.width(18*2.54);

  const opening = cabinet.openings[0];

  opening.divide(1);
  opening.vertical(false);
  opening.sections[0].setSection("DrawerSection");
  opening.sections[1].setSection("DoorSection");
  opening.pattern('ab').value('a', 6);
});

new CabinetLayout('3d', (cabinet) => {
  cabinet.width(18*2.54);

  const opening = cabinet.openings[0];

  opening.divide(2);
  opening.vertical(false);
  opening.sections[0].setSection("DrawerSection");
  opening.sections[1].setSection("DrawerSection");
  opening.sections[2].setSection("DrawerSection");
  opening.pattern('abb').value('a', 6);
});

new CabinetLayout('3dsb3d', (cabinet) => {
  cabinet.width(60*2.54);

  const opening = cabinet.openings[0];
  opening.divide(2);
  opening.sectionProperties().pattern('bab').value('a', 30*2.54);
  const left = opening.sections[0];
  const center = opening.sections[1];
  const right = opening.sections[2];
  const a = 6*2.54

  left.divide(2);
  left.vertical(false);
  left.sections[0].setSection("DrawerSection");
  left.sections[1].setSection("DrawerSection");
  left.sections[2].setSection("DrawerSection");
  left.pattern('abb').value('a', 6);

  center.divide(1);
  center.vertical(false);
  center.sections[1].setSection('DualDoorSection');
  center.pattern('ab').value('a', 6);
  const centerTop = center.sections[0];

  centerTop.divide(2);
  centerTop.sections[0].setSection("DoorSection");
  centerTop.sections[1].setSection("FalseFrontSection");
  centerTop.sections[2].setSection("DoorSection");
  centerTop.pattern('ztz').value('t', 15*2.54);
  centerTop.sections[0].cover().pull().location(Handle.location.RIGHT);
  centerTop.sections[2].cover().pull().location(Handle.location.LEFT);

  right.divide(2);
  right.vertical(false);
  right.sections[0].setSection("DrawerSection");
  right.sections[1].setSection("DrawerSection");
  right.sections[2].setSection("DrawerSection");
  right.pattern('abb').value('a', 6);
});
