


const Assembly = require('../assembly.js');
const BiPolygon = require('../../../three-d/objects/bi-polygon.js');
const FunctionCache = require('../../../../../../public/js/utils/services/function-cache.js');
const Joint = require('../../joint/joint.js');

FunctionCache.on('cutter', 500);

class Cutter extends Assembly {
  constructor(partCode, partName, config) {
    super(partCode, partName, config);
    this.included(false);
  }
}
Cutter.abbriviation = 'cut';

class CutterModel extends Cutter {
  constructor(partCode, partName, toModel) {
    super(partCode);
    this.toModel = toModel;
    this.partName = partName instanceof Function ? partName : () => partName;
  }
}

class CutterReference extends Cutter {
    constructor (reference, fromPoint, offset, front) {
    front = front === false ? false : true;
    const partCode = `CR${reference.locationCode().hash(9949, false)}`;
    super(partCode);
    offset ||= 0;

    this.reference = () => reference;
    this.toModel = new FunctionCache((joints) => {
      let biPoly = reference instanceof BiPolygon ? reference : reference.toBiPolygon();
      joints ||= this.getJoints().female;
      biPoly.offset(fromPoint(), offset);
      let poly = (front ? biPoly.front() : biPoly.back()).reverse();
      let length = 0;
      poly.lines().forEach(l => length += l.length());
      const sameDir = biPoly.normal().sameDirection(poly.normal());
      const multiplier = sameDir ? -1 : 1;
      const distance = 10 * length;
      biPoly = BiPolygon.fromPolygon(poly, 0, multiplier * distance, {x: distance, y:distance});
      return Joint.apply(biPoly.toModel(), joints);
    }, this, 'cutter');

    this.partName = () => `CutterRef(${reference.partCode()}${offset >= 0 ? '+' + offset : offset}@${fromPoint()})`;
  }
}

class CutterPoly extends Cutter {
    constructor (poly) {
    const partCode = `CP${String.random(4)}`;
    super(partCode);
    this.poly = (p) => {
      if (p) poly = p;
      return poly;
    }

    this.toModel = new FunctionCache((joints) => {
      let length = 20;
      joints ||= this.getJoints().female;
      poly.lines().forEach(l => length += l.length());
      const distance = length;
      const biPoly = BiPolygon.fromPolygon(poly, 0, distance, {x: distance, y:distance});
      return Joint.apply(biPoly.toModel(), joints);
    }, this, 'cutter');

    this.partName = () => `CutterPoly(${poly.toString()})`;
  }
}

Cutter.Model = CutterModel;
Cutter.Reference = CutterReference;
Cutter.Poly = CutterPoly;

module.exports = Cutter;
