
const Assembly = require('../../assembly');
const Panel = require('../panel');
const Cutter = require('../cutter');

const {Vertex3D, Vector3D, Line3D, Polygon3D, BiPolygon} = require('../../../../../../../public/js/utils/canvas/three-d/lib.js');

const Butt = require('../../../joint/joints/butt.js');
const Dado = require('../../../joint/joints/dado.js');
const Cut = require('../../../joint/joints/cut.js');
const Dependency = require('../../../dependency.js');

class OpeningToeKick extends Assembly {
  constructor(opening, index) {
    const atkid = 'OpeningToeKick' + index;
    super(`OpenTK`, atkid);
    this.opening = () => opening;
    const toeKickPanel = new Panel(':tkb', `ToeKickBacker`);

    const instance = this;
    function sideJointConfig(sideSelector, cutCond, char) {
      const isButt = () => true;
      const isDado = () => !isButt() && !cutCond();
      const isCut = () => !isButt() && cutCond();
      const dado = new Dado(toeKickPanel, sideSelector, isDado, 'tkDADO-'+char);
      dado.maleOffset(.9525);
      const cut = new Cut(toeKickPanel, sideSelector, isCut, 'tkCUT-'+char);
      const butt = new Butt(toeKickPanel, sideSelector, isButt, 'tkCUT-'+char);
      butt.autoExtend(false);
      toeKickPanel.addDependencies(dado, cut, butt);
    }



    const leftCornerCutter = new Cutter(':lcc', 'LeftCorner', null, 'leftCorner');
    const rightCornerCutter = new Cutter(':rcc', 'RightCorner', null, 'rightCorner');
    rightCornerCutter.addDependencies(new Dependency(this.getAssembly('R'), rightCornerCutter))
    leftCornerCutter.addDependencies(new Dependency(this.getAssembly('L'), leftCornerCutter))

    this.addSubAssembly(leftCornerCutter);
    this.addSubAssembly(rightCornerCutter);
    this.leftCornerCutter = () => leftCornerCutter;
    this.rightCornerCutter = () => rightCornerCutter;

    const joint = (part) => (otherPartCode, condition) => {
      const joint = new Cut(part, otherPartCode, condition);
      part.addDependencies(joint);
    }

    joint(leftCornerCutter)(toeKickPanel.locationCode());
    joint(rightCornerCutter)(toeKickPanel.locationCode());
    const cutter = new Cutter(':tkc', `ToeKick`);
    const cutterR = new Cutter(':tkcr', `ToeKickPerp`);
    const cutterL = new Cutter(':tkcl', `ToeKickPerp`);
    toeKickPanel.normals(false, {DETERMINE_FROM_MODEL: true})
    joint(cutter)(/^c_R(:|_)/, () => !this.rightEndStyle());
    joint(cutter)(/^c_L(:|_)/, () => !this.leftEndStyle());
    sideJointConfig(/^R:/, this.overlayRight, 'r');
    sideJointConfig(/^L:/, this.overlayLeft, 'l');

    this.addSubAssembly(toeKickPanel);
    this.addSubAssembly(cutter);

    // joint(cutterR)(/^c_R(:|_)/, () => !this.rightEndStyle());
    // joint(cutterL)(/^c_L(:|_)/, () => !this.leftEndStyle());
    // this.addSubAssembly(cutterL);
    // this.addSubAssembly(cutterR);

    this.tkb = () => toeKickPanel;
    this.part = () => false;
    this.included = () => false;

    this.leftEndStyle = this.value.getterSetter('show.left.endStyle');
    this.rightEndStyle = this.value.getterSetter('show.left.endStyle');
    this.leftShow = this.value.getterSetter('show.left.type');
    this.rightShow = this.value.getterSetter('show.left.type');
    this.overlayRight = () =>
      !(this.rightShow() || this.rightEndStyle());
    this.overlayLeft = () =>
      !(this.leftShow() || this.leftEndStyle());

    this.hash = () => {
      return `${this.leftEndStyle()}:${this.leftEndStyle()}:${this.leftShow()}:${this.rightShow()}`.hash();
    }
  }
}

class AutoToekick extends Assembly {
  constructor(cabinet) {
    super(`AUTOTK`, 'AutoToeKick');
    this.part = () => false;
    this.included = () => false;

    this.tkh = this.value.getterSetter('tkh');
    this.hash = () => Math.hash(...this.children().map(c => c.hash()));

    const instance = this;
    this.parentAssembly(cabinet);
    const tkOpeningMap = {};

    let lastHash;
    this.update = () => {
      try{
        this.subassemblies.deleteAll()
        let openings = cabinet.openings;
        if (openings.length > 1) {
          let notParrelle = openings.filter(op => !op.normal().equals(openings[0].normal()));
          if (notParrelle.length > 0) throw new Error('Not yet implemented for multiple openings...');
          openings = [openings[0]];
        }
        for (let index = 0; index < openings.length; index++) {
          const opening = openings[index];
          if (tkOpeningMap[opening.id()] === undefined) tkOpeningMap[opening.id()] =
              new OpeningToeKick(opening.sectionProperties(), index);
          instance.addSubAssembly(tkOpeningMap[opening.id()]);
          tkOpeningMap[opening.id()].tkh = this.tkh;
        }
      } catch (e) {
        console.error('AutoToeKick: update exception');
        console.error(e);
      }
    }
    cabinet.on.change(this.update);
  }
}

module.exports = AutoToekick;
