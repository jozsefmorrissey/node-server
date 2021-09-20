
const Assembly = require('./assembly.js');

const Cabinet = require('./assemblies/cabinet.js');
Assembly.register(Cabinet);

const Divider = require('./assemblies/divider.js');
Assembly.register(Divider);

const DoorCatch = require('./assemblies/door/door-catch.js');
Assembly.register(DoorCatch);

const Door = require('./assemblies/door/door.js');
Assembly.register(Door);

const Hinges = require('./assemblies/door/hinges.js');
Assembly.register(Hinges);

const DrawerBox = require('./assemblies/drawer/drawer-box.js');
Assembly.register(DrawerBox);

const DrawerFront = require('./assemblies/drawer/drawer-front.js');
Assembly.register(DrawerFront);

const Guides = require('./assemblies/drawer/guides.js');
Assembly.register(Guides);

const Frame = require('./assemblies/frame.js');
Assembly.register(Frame);

const Handle = require('./assemblies/hardware/pull.js');
Assembly.register(Handle);

const Screw = require('./assemblies/hardware/screw.js');
Assembly.register(Screw);

const Panel = require('./assemblies/panel.js');
Assembly.register(Panel);

const DividerSection = require('./assemblies/section/partition/sections/divider.js');
Assembly.register(DividerSection);

const Section = require('./assemblies/section/section.js');
Assembly.register(Section);

const DivideSection = require('./assemblies/section/space/sections/divide-section.js');
Assembly.register(DivideSection);

const OpeningCoverSection = require('./assemblies/section/space/sections/open-cover/open-cover.js');
Assembly.register(OpeningCoverSection);

const DoorSection = require('./assemblies/section/space/sections/open-cover/sections/door.js');
Assembly.register(DoorSection);

const DrawerSection = require('./assemblies/section/space/sections/open-cover/sections/drawer.js');
Assembly.register(DrawerSection);

const DualDoorSection = require('./assemblies/section/space/sections/open-cover/sections/duel-door.js');
Assembly.register(DualDoorSection);

const FalseFrontSection = require('./assemblies/section/space/sections/open-cover/sections/false-front.js');
Assembly.register(FalseFrontSection);

const SpaceSection = require('./assemblies/section/space/space.js');
Assembly.register(SpaceSection);
