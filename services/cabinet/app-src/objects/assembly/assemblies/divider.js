


const Assembly = require('../assembly.js');
const BiPolygon = require('../../../three-d/objects/bi-polygon.js');
const Polygon3D = require('../../../three-d/objects/polygon.js');
const Cutter = require('./cutter.js');
const Panel = require('./panel');
const Frame = require('./frame');
const Joint = require('../../joint/joint.js');
const Dependency = require('../../dependency.js');

class Divider extends Assembly {
  constructor(partCode, partName, config) {
    partCode ||= 'dv';
    let z;
    if (config && config.demension.z) {
      z = config.demension.z;
      config.demension.z = 'dw';
    }
    super(partCode, partName, config);
    const instance = this;
    const pToJson = this.toJson;

    // if (z) {
    //   this.value('dw', z);
    //   console.log(this.id() + '', z);
    // }
    Object.getSet(this, 'type');

    const pFull = new Panel(':full', 'Full');
    const pFront = new Panel(':f', 'Front');
    const pBack = new Panel(':b', 'Back');
    pFull.normals(false, {DETERMINE_FROM_PARENT: true});
    pFront.normals(false, {DETERMINE_FROM_PARENT: true});
    pBack.normals(false, {DETERMINE_FROM_PARENT: true});
    const frame = new Frame(':fr', 'Frame');
    frame.parentAssembly(this);
    const frameCutter = new Cutter('cfr', 'FrameRail');
    frameCutter.parentAssembly(this);



    const parts = [pFull, pFront, pBack];
    this.possibleParts = () => parts.concat(frame);
    parts.forEach(p => p.parentAssembly(this));
    this.toJson = () => {
      const json = pToJson();
      json.type = this.type();
      json.joints = json.joints.filter(j => !j.locationId);
      return json;
    }
    this.isPanel = (assem) =>
       assem instanceof Panel && this.isSubPart(assem);

    const partCheck = (index) => (assem) => parts[index].locationCode() === assem.locationCode();

    this.part = () => false;
    const parentWidth = this.width;
    this.thickness = () => eval(this.value('dw'));

    const thicknessWarrentsFrame = (thickness) =>
      thickness && thickness > this.panelThickness() + 0.1587;

    this.frameThickness = (thickness, raw) => {
      if (raw) return this.value('dft');
      thickness = this.eval(this.value('dft', thickness));
      return thickness;
    }
    this.panelThickness = (thickness, raw) => {
      if (raw) return this.value('dpt');
      const width = this.eval(this.thickness());
      thickness = this.eval(this.value('dpt', thickness));
      return (thickness && width >= thickness) ? thickness : width;
    }
    this.scribe = (scribe, raw) => {
      if (raw) return this.value('sc');
      const width = this.eval(this.thickness());
      scribe = this.eval(this.value('sc', scribe));
      const pt = this.panelThickness();
      return (scribe && width >= scribe + pt) ? scribe : width - pt;
    }
    this.hasFrame = () => thicknessWarrentsFrame(this.thickness());
    this.maxWidth = (width, raw) => {
      if (raw) return this.value('dft');
      if (width) {
        if (width === 'dw') this.value('dw', null);
        else this.value('dw', width);
      }
      width = eval(this.value('dw', width));
      return width;
    }

    function activeParts() {
      const active = instance.hasFrame() ? [frame, frameCutter] : [];
      switch (type) {
        case 'front': return parts.slice(1,3).concat(active);
        case 'back': return parts.slice(3,5).concat(active);
        case 'frontAndBack': return parts.slice(1).concat(active);
        default: return parts.slice(0,1).concat(active);
      }
    }

    this.getSubassemblies = (childrenOnly) => {
      const children = activeParts().concat(Object.values(this.subassemblies));
      if (childrenOnly) return children;
      const decendents = [];
      for (let index = 0; index < children.length; index++) {
        decendents.concatInPlace(children[index].getSubassemblies(false));
      }
      return children.concat(decendents);
    }
    instance.includeJoints(false);

    let type = Divider.Types[0];
    let cutter;
    this.type = (t) => {
      const index = Divider.Types.indexOf(t);
      if (index !== -1) type = Divider.Types[index];
      return type;
    }

    const parentHash = this.hash;
    this.hash = () => parentHash() +
        `${type}:${this.maxWidth()}:${this.panelThickness()}`.hash();

    const frontPanelReg = `^${this.locationCode()}:f(|ull)$`;
    const frameCutterDep = new Joint(frameCutter, frontPanelReg, this.hasFrame);
    const panelDep = new Joint(frontPanelReg, frame, this.hashFrame);
    this.addDependencies(frameCutterDep, panelDep);
  }
}

Divider.Types = ['full', 'none', 'front', 'back', 'frontAndBack'];
Divider.count = 0;

Divider.abbriviation = 'dv';

Divider.fromJson = (json) => {
  const obj = Assembly.fromJson(json);
  obj.type(json.type);
  return obj;
}

module.exports = Divider
