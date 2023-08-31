
const Assembly = require('./assembly.js');
new Assembly();

const Cabinet = require('./assemblies/cabinet.js');
new Cabinet();

const Divider = require('./assemblies/divider.js');
new Divider();

const DoorCatch = require('./assemblies/door/door-catch.js');
new DoorCatch();

const Door = require('./assemblies/door/door.js');
new Door();

const Hinges = require('./assemblies/door/hinges.js');
new Hinges();

const DrawerBox = require('./assemblies/drawer/drawer-box.js');
new DrawerBox();

const DrawerFront = require('./assemblies/drawer/drawer-front.js');
new DrawerFront();

const Guides = require('./assemblies/drawer/guides.js');
new Guides();

const Frame = require('./assemblies/frame.js');
new Frame();

const Handle = require('./assemblies/hardware/pull.js');
new Handle();

const Screw = require('./assemblies/hardware/screw.js');
new Screw();

const Panel = require('./assemblies/panel.js');
new Panel();

// const PartitionSection = require('./assemblies/section/partition/sections/divider.js');
// new PartitionSection();
//
// const DividerSection = require('./assemblies/section/partition/partition');
// new DividerSection();
//
// const Section = require('./assemblies/section/section.js');
// new Section();
//
// const DivideSection = require('./assemblies/section/space/sections/divide-section.js');
// new DivideSection();
//
// const OpeningCoverSection = require('./assemblies/section/space/sections/open-cover/open-cover.js');
// new OpeningCoverSection();

const DoorSection = require('./assemblies/section/sections/door.js');
new DoorSection();

const DrawerSection = require('./assemblies/section/sections/drawer.js');
new DrawerSection();

const DualDoorSection = require('./assemblies/section/sections/duel-door.js');
new DualDoorSection();

const FalseFrontSection = require('./assemblies/section/sections/false-front.js');
new FalseFrontSection();

// const SpaceSection = require('./assemblies/section/space/space.js');
// new SpaceSection();

const Cutter = require('./assemblies/cutter.js');
new Cutter();

const CutterModel = Cutter.Model;
new CutterModel();

const Void = require('./assemblies/void.js');
new Void(new Assembly());

Assembly.components = {
  Divider, Panel, Cutter, Door, DrawerBox, DrawerFront, Frame, CutterModel,
  Void
};
