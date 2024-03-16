


const Assembly = require('../assembly.js');
const BiPolygon = require('../../../three-d/objects/bi-polygon.js');
const Polygon3D = require('../../../three-d/objects/polygon.js');
const Cutter = require('./cutter.js');
const Panel = require('./panel');
const Joint = require('../../joint/joint.js');

class Divider extends Assembly {
  constructor(partCode, partName, config) {
    partCode ||= 'dv';
    let z;
    // if (config && config.demension.z) {
    //   z = config.demension.z;
    //   config.demension.z = 'dw';
    // }
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
    const pcFront = new Cutter('dcf', 'Front');
    const pBack = new Panel(':b', 'Back');
    const pcBack = new Cutter('dcb', 'Back');
    pFull.normals(false, {DETERMINE_FROM_PARENT: true});
    pFront.normals(false, {DETERMINE_FROM_PARENT: true});
    pBack.normals(false, {DETERMINE_FROM_PARENT: true});


    const parts = [pFull, pFront, pcFront, pBack, pcBack];
    parts.forEach(p => p.parentAssembly(this));
    this.toJson = () => {
      const json = pToJson();
      json.type = this.type();
      json.joints = json.joints.filter(j => !j.locationId);
      return json;
    }

    const partCheck = (index) => (assem) => parts[index].locationCode() === assem.locationCode();
    parts[2].addDependencies(new Joint(parts[2], parts[1], null, 'frontCutJoint'));
    parts[4].addDependencies(new Joint(parts[4], parts[3], null, 'backCutJoint'));

    this.part = () => false;
    let dividerWidth;
    this.panelThickness = (thickness, raw) => {
      return 3 *2.54 / 4;
      const val = this.value('dpt', thickness, raw);
      return raw ? val : this.eval(val);
    }
    this.dividerWidth = (width, raw) => {
      return 3 *2.54 / 4;
      const val = this.value('dw', width, raw);
      return raw ? val : this.eval(val);
    }
    this.maxWidth = (width) => {
      const pt = this.eval(this.panelThickness());
      const dw = this.eval(this.dividerWidth());
      return pt > dw ? pt : dw;
    }

    function activeParts() {
      switch (type) {
        case 'front': return parts.slice(1,3);
        case 'back': return parts.slice(3,5);
        case 'frontAndBack': return parts.slice(1);
        default: return parts.slice(0,1);
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
