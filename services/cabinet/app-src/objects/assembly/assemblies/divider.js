


const Assembly = require('../assembly.js');
const BiPolygon = require('../../../three-d/objects/bi-polygon.js');
const Polygon3D = require('../../../three-d/objects/polygon.js');
const Cutter = require('./cutter.js');
const Panel = require('./panel');
const Joint = require('../../joint/joint.js');

class Divider extends Assembly {
  constructor(partCode, partName, config) {
    partCode ||= 'dv';
    super(partCode, partName, config);
    const instance = this;

    Object.getSet(this, 'type');

    const pFull = new Panel(':full', 'panel-full');
    const pFront = new Panel(':f', 'panel-front');
    const pcFront = new Cutter(':f', 'cutter-front');
    const pBack = new Panel(':b', 'panel-back');
    const pcBack = new Cutter(':b', 'cutter-back');

    pFull.modelingMethod('Full');
    pBack.modelingMethod('Back');
    pcFront.modelingMethod('Front');
    pcBack.modelingMethod('Back');
    pBack.modelingMethod('Back');
    const parts = [pFull, pFront, pcFront, pBack, pcBack];

    const pToJson = this.toJson;
    this.toJson = () => {
      const json = pToJson();
      json.joints = json.joints.filter(j => !j.locationId);
      return json;
    }

    this.addJoints(new Joint(parts[2].locationCode(), parts[1].locationCode(), null, 'only'));
    this.addJoints(new Joint(parts[4].locationCode(), parts[3].locationCode(), null, 'only'));

    this.part = () => false;
    this.maxWidth = () => 2.54*3/4;

    function activeParts() {
      switch (type) {
        case 'front': return parts.slice(3,2);
        case 'back': return parts.slice(1,2);
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
    this.hash = () => parentHash() + type.hash();
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
