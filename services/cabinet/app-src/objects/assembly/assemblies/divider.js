


const Assembly = require('../assembly.js');
const BiPolygon = require('../../../three-d/objects/bi-polygon.js');
const Polygon3D = require('../../../three-d/objects/polygon.js');
const Cutter = require('./cutter.js');
const Panel = require('./panel');
const Frame = require('./frame');
const Joint = require('../../joint/joint.js');
const Dado = require('../../joint/joints/dado.js');
const Butt = require('../../joint/joints/butt.js');
const Cut = require('../../joint/joints/cut.js');
const JointSettings = require('../../../../web-worker/shared/settings.js');
const Dependency = require('../../dependency.js');

const configStrReg = /^(.*?):(.*?):(.*?)$/;
class Divider extends Assembly {
  constructor(partCode, partName, config) {
    partCode ||= 'dv';
    super(partCode, partName, config);
    const instance = this;
    const pToJson = this.toJson;
    // this.jointSettings = new JointSettings(true,true,true,true);


    Object.getSet(this, 'type');

    const pFull = new Panel(':full', 'Full');
    const pFront = new Panel(':f', 'Front');
    const pBack = new Panel(':b', 'Back');
    pFull.normals(false, {DETERMINE_FROM_PARENT: true});
    pFront.normals(false, {DETERMINE_FROM_MODEL: true});
    pBack.normals(false, {DETERMINE_FROM_MODEL: true});
    const frame = new Frame('fr', 'Frame');
    frame.normals(false, {DETERMINE_FROM_MODEL: true});
    frame.parentAssembly(this);


    const notThisFrontPanel = (a) => this.hasFrame() && !isThisFrontPanel(a);
    const isDividerPart = (a) => a.parentAssembly() && a.parentAssembly().constructor.name === 'Divider';
    const notThisFrame = (a) => frame !== a;
    const isFrontPanel = (a) => isDividerPart(a) && a.match(/:(full|f)$/);
    const isFrontPanelWFrame = (a) => isFrontPanel(a) && a.parentAssembly().hasFrame();
    const isFrontPanelWOFrame = (a) => isFrontPanel(a) && !a.parentAssembly().hasFrame();
    const isNeigbor = (a) => notThisFrame(a) && isDividerPart(a) && isFrame(a) && this.neighbors().indexOf(a.parentAssembly()) !== -1;



    const isThisFrame = (a) => a === frame;
    const isThisFrontPanel = (a) => a === pFull || pFront === a;

    const framePanelJoint = new Dado(isThisFrontPanel, isThisFrame, null, 'FramePanelJoint');
    framePanelJoint.full.female(true);
    const frameOtherPanelJoint = new Butt(isFrontPanel, isThisFrame, null, 'FrameOtherPanelJoint');
    frameOtherPanelJoint.full.male(false);
    this.addDependencies(framePanelJoint, frameOtherPanelJoint);

    const parts = [pFull, pFront, pBack];
    this.possibleParts = () => parts.concat(frame);
    parts.forEach(p => {
      p.parentAssembly(this);
    });
    this.toJson = () => {
      const json = pToJson();
      json.type = this.type();
      json.joints = json.joints.filter(j => !j.locationId);
      return json;
    }
    this.isPanel = (assem) =>
       assem instanceof Panel && this.isSubPart(assem);

    const partCheck = (index) => (assem) => parts[index].locationCode() === assem.locationCode();

    this.thickness = () => this.hasFrame() ? this.frameWidth() : this.panelThickness();
    this.partialWidth = () => this.resolve('dpw');

    this.frameThickness = (rawOthickness) => {
      if (Boolean.is(rawOthickness)) return this.resolve('dft', rawOthickness);
      if (rawOthickness !== undefined) {
        this.value('dft', rawOthickness);
      }
      return this.eval('dft');
    }
    this.frameWidth = (rawOthickness) => {
      if (Boolean.is(rawOthickness)) return this.resolve('dfw', rawOthickness);
      if (rawOthickness !== undefined) {
        const evaluated = this.resolve(rawOthickness);
        const pt = this.panelThickness();
        if (pt >= evaluated) this.value('dpt', rawOthickness);
        this.value('dfw', rawOthickness);
      }
      const crownTarget = this.match('^c_T');
      if (crownTarget) {
        const hasChrown = this.group().hasChrown(this.getRoot());
        return this.resolve('crh');
      }
      return this.eval('dfw');
    }
    this.panelThickness = (rawOthickness) => {
      if (Boolean.is(rawOthickness)) return this.resolve('dpt', rawOthickness);
      if (rawOthickness !== undefined) {
        const evaluated = this.eval(rawOthickness);
        const ft = this.frameThickness();
        if (ft < evaluated) this.value('dpt', rawOthickness);
        this.value('dpt', rawOthickness);
      }
      return this.eval('dpt', rawOthickness);
    }
    this.scribe = (rawOscribe) => {
      if (Boolean.is(rawOscribe)) return this.resolve('sc', rawOscribe);
      if (rawOscribe !== undefined) this.value('sc', rawOscribe);
      const scribe = this.resolve('sc');
      return this.scribe.valid(scribe) ? scribe : 0;
    }
    this.scribe.valid = (scribe) => {
      const ft = this.frameThickness();
      const pt = this.panelThickness();
      scribe ||= this.resolve('sc');
      return (scribe && ft >= scribe + pt);
    }

    const thicknessWarrentsFrame = (thickness) =>
      thickness && thickness > this.panelThickness() + 0.3175;



    this.hasFrame = () => {
      const frameless = this.resolve('fls', true);
      if (!frameless) return true;
      const crownTarget = this.match('^c_T');
      if (crownTarget) {
        const hasChrown = this.group().hasChrown(this.getRoot());
        return hasChrown;
      }
      return false;
    }

    function activeParts() {
      if (!instance.included()) {
        return [];
      }
      const active = instance.hasFrame() ? [frame] : [];
      switch (type) {
        case 'front': return parts.slice(1,2).concat(active);
        case 'back': return parts.slice(2,3).concat(active);
        case 'frontAndBack': return parts.slice(1).concat(active);
        case 'none': return active;
        default: return parts.slice(0,1).concat(active);
      }
    }

    let sectionProps = [];
    this.sectionProperties = (secProps) => sectionProps;
    this.sectionProperties.add = (secProps) => sectionProps.push(secProps);

    this.neighbors = () =>
      sectionProps.map(s => s.borders.neighbors(this)).concatElements();

    this.getSubassemblies = (childrenOnly) => {
      const children = activeParts().concat(Object.values(this.subassemblies));
      if (childrenOnly) return children;
      const decendents = [];
      for (let index = 0; index < children.length; index++) {
        decendents.concatInPlace(children[index].getSubassemblies(false));
      }
      return children.concat(decendents);
    }

    let type = Divider.Types[0];
    let cutter;
    this.type = (t) => {
      const index = Divider.Types.indexOf(t);
      if (index !== -1) type = Divider.Types[index];
      return type;
    }

    const parentHash = this.hash;
    this.hash = () => parentHash() +
        `${type}:${this.thickness()}`.hash();
  }
}

Divider.Types = ['full', 'none', 'front', 'back', 'frontAndBack'];
Divider.count = 0;

Divider.fromJson = (json) => {
  const obj = Assembly.fromJson(json);
  obj.type(json.type);
  return obj;
}

module.exports = Divider
