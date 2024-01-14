
const Assembly = require('../../assembly.js');

// Probably shouldnt extend assembly but its how these classes are currently written.
class GovernedBySection extends Assembly {
  constructor(...args) {
    super(...args);

    this.governingSection = () => {
      throw new Error('Implement Dummy!!');
    }

    const initialize = (assem) => () => {
      if (assem instanceof Cabinet) {
        const governingSection = this.governingSection();
        if (this.initialize) this.initialize(governingSection);
      } else {
        const parent = instance.parentAssembly();
        parent.on.parentSet(initialize(parent));
      }
      // setTimeout(() => );
      // panel.part(false);
      this.addSubAssembly(panel);

    }

    this.on.parentSet(initialize(this));
  }
}

class DrawerBoxGoverned extends GovernedBySection {constructor(...args) {super(...args);}}
class DrawerFrontGoverned extends GovernedBySection {constructor(...args) {super(...args);}}
class DoorGoverned extends GovernedBySection {constructor(...args) {super(...args);}}
class DuelDoorGoverned extends GovernedBySection {constructor(...args) {super(...args);}}
class PanelGoverned extends GovernedBySection {constructor(...args) {super(...args);}}
class DividerGoverned extends GovernedBySection {constructor(...args) {super(...args);}}

class PanelFullGoverned extends GovernedBySection {constructor(...args) {super(...args);}}
class PanelFrontGoverned extends GovernedBySection {constructor(...args) {super(...args);}}
class PanelBackGoverned extends GovernedBySection {constructor(...args) {super(...args);}}
class CutterBackGoverned extends GovernedBySection {constructor(...args) {super(...args);}}
class CutterFrontGoverned extends GovernedBySection {constructor(...args) {super(...args);}}

GovernedBySection.DrawerBox = DrawerBoxGoverned;
GovernedBySection.DrawerFront = DrawerFrontGoverned;
GovernedBySection.Door = DoorGoverned;
GovernedBySection.DuelDoor = DuelDoorGoverned;
GovernedBySection.Panel = PanelGoverned;

GovernedBySection.Panel.Full = PanelFullGoverned;
GovernedBySection.Panel.Front = PanelFrontGoverned;
GovernedBySection.Panel.Back = PanelBackGoverned;
GovernedBySection.Panel.Front.Cutter = CutterFrontGoverned;
GovernedBySection.Panel.Back.Cutter = CutterBackGoverned;

module.exports = GovernedBySection;
