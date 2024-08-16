


const Assembly = require('../assembly.js');
const BiPolygon = require('../../../three-d/objects/bi-polygon.js');
const Polygon3D = require('../../../three-d/objects/polygon.js');
const Cutter = require('./cutter.js');
const Panel = require('./panel');
const Frame = require('./frame');
const Joint = require('../../joint/joint.js');
const JointSettings = require('../../joint/settings');
const Dependency = require('../../dependency.js');

const configStrReg = /^(.*?):(.*?):(.*?)$/;
class Divider extends Assembly {
  constructor(partCode, partName, config) {
    partCode ||= 'dv';
    super(partCode, partName, config);
    const instance = this;
    const pToJson = this.toJson;
    this.jointSettings = new JointSettings(false,true,true,true);


    Object.getSet(this, 'type');

    const pFull = new Panel(':full', 'Full');
    const pFront = new Panel(':f', 'Front');
    const pBack = new Panel(':b', 'Back');
    pFull.normals(false, {DETERMINE_FROM_PARENT: true});
    pFront.normals(false, {DETERMINE_FROM_PARENT: true});
    pBack.normals(false, {DETERMINE_FROM_PARENT: true});
    const frame = new Frame('fr', 'Frame');
    frame.parentAssembly(this);



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
      return this.resolve('dft');
    }
    this.frameWidth = (rawOthickness) => {
      if (Boolean.is(rawOthickness)) return this.resolve('dfw', rawOthickness);
      if (rawOthickness !== undefined) {
        const evaluated = this.resolve(rawOthickness);
        const pt = this.panelThickness();
        if (pt >= evaluated) this.value('dpt', rawOthickness);
        this.value('dfw', rawOthickness);
      }
      return this.resolve('dfw');
    }
    this.panelThickness = (rawOthickness) => {
      if (Boolean.is(rawOthickness)) return this.resolve('dpt', rawOthickness);
      if (rawOthickness !== undefined) {
        const evaluated = this.resolve(rawOthickness);
        const ft = this.frameThickness();
        if (ft < evaluated) this.value('dpt', rawOthickness);
        this.value('dpt', rawOthickness);
      }
      return this.resolve('dpt', rawOthickness);
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
    this.hasFrame = () => !this.propertyConfig('fls');

    function activeParts() {
      if (!instance.included()) {
        return [];
      }
      const active = instance.hasFrame() ? [frame] : [];
      switch (type) {
        case 'front': return parts.slice(1,3).concat(active);
        case 'back': return parts.slice(3,5).concat(active);
        case 'frontAndBack': return parts.slice(1).concat(active);
        case 'none': return active;
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

Divider.abbriviation = 'dv';

Divider.fromJson = (json) => {
  const obj = Assembly.fromJson(json);
  obj.type(json.type);
  return obj;
}

module.exports = Divider
