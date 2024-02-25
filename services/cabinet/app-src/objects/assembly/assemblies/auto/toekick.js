
const Assembly = require('../../assembly');
const Panel = require('../panel');
const Cutter = require('../cutter');
const Vertex3D = require('../../../../three-d/objects/vertex');
const Vector3D = require('../../../../three-d/objects/vector');
const Line3D = require('../../../../three-d/objects/line');
const Polygon3D = require('../../../../three-d/objects/polygon');
const BiPolygon = require('../../../../three-d/objects/bi-polygon');
const Butt = require('../../../joint/joints/butt.js');
const Dependency = require('../../../dependency.js');

class OpeningToeKick extends Assembly {
  constructor(autoToeKick, opening, index) {
    const atkid = 'OpeningToeKick' + index;
    super(`OpenTK`, atkid);
    this.parentAssembly(autoToeKick);
    this.autoToeKick = () => autoToeKick;
    this.opening = () => opening;

    const instance = this;


    const leftCornerCutter = new Cutter('lcc', 'LeftCorner', null, 'leftCorner');
    const rightCornerCutter = new Cutter('rcc', 'RightCorner', null, 'rightCorner');
    rightCornerCutter.addDependencies(new Dependency(this.getAssembly('R'), rightCornerCutter))
    leftCornerCutter.addDependencies(new Dependency(this.getAssembly('L'), leftCornerCutter))

    this.addSubAssembly(leftCornerCutter);
    this.addSubAssembly(rightCornerCutter);
    this.leftCornerCutter = () => leftCornerCutter;
    this.rightCornerCutter = () => rightCornerCutter;

    const joint = (part, fullLength) => (otherPartCode, condition) => {
      const joint = new Butt(part.locationCode(), otherPartCode, condition, otherPartCode);
      joint.fullLength(fullLength);
      part.addDependencies(joint);
    }
    const toeKickPanel = new Panel('tkb', `ToeKickBacker`);
    joint(toeKickPanel)(/^R:/);
    joint(toeKickPanel, true)(/^B:/);
    joint(toeKickPanel)(/^L:/);
    joint(leftCornerCutter)(toeKickPanel.locationCode());
    joint(rightCornerCutter)(toeKickPanel.locationCode());
    const cutter = new Cutter('tkc', `ToeKick`);
    const openNorm = opening.normal();
    const rParrelleToOpening = openNorm.parrelle(instance.getAssembly('R').position().normals().x);
    toeKickPanel.normals(false, {DETERMINE_FROM_MODEL: true})
    joint(cutter)(/^R:/, () => !autoToeKick.rightEndStyle());
    joint(cutter)(/^L:/, () => !autoToeKick.leftEndStyle());

    this.addSubAssembly(toeKickPanel);
    this.addSubAssembly(cutter);

    this.tkb = () => toeKickPanel;
    this.part = () => false;
  }
}

class AutoToekick extends Assembly {
  constructor(cabinet) {
    super(`AUTOTK`, 'AutoToeKick');
    this.part = () => false;

    Object.getSet(this, {rightEndStyle: false, leftEndStyle: false});
    const instance = this;
    this.parentAssembly(cabinet);

    let lastHash;
    this.update = () => {
      const hash = cabinet.hash();
      if (hash !== lastHash) {
        try{
          this.subassemblies.deleteAll()
          const openings = cabinet.openings;
          if (openings.length > 1) throw new Error('Not yet implemented for multiple openings...');
          for (let index = 0; index < openings.length; index++) {
            const otk = new OpeningToeKick(this, openings[index], index);
            instance.addSubAssembly(otk);
          }
        } catch (e) {
          console.error('AutoToeKick: update exception');
          console.error(e);
        }
      }
    }
  }
}

module.exports = AutoToekick;
