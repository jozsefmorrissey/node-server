


const Assembly = require('../assembly.js');
const BiPolygon = require('../../../three-d/objects/bi-polygon.js');

class Cutter extends Assembly {
  constructor(partCode, partName, centerConfig, demensionConfig, rotationConfig) {
    super(partCode, partName, centerConfig, demensionConfig, rotationConfig);
    this.included(false);
  }
}
Cutter.abbriviation = 'cut';

class CutterModel extends Cutter {
  constructor(partCode, partNameFunc, toModel) {
    super(partCode);
    this.toModel = toModel;
    this.partName = partNameFunc;
  }
}

class CutterReference extends Cutter {
    constructor (reference, fromPoint, offset, front) {
    front = front === false ? false : true;
    const partCode = `CR${String.random(4)}`;
    super(partCode);
    offset ||= 0;

    this.toModel = () => {
      let biPoly = reference.toBiPolygon();
      biPoly.offset(fromPoint, offset);
      const poly = front ? biPoly.front() : biPoly.back();
      const lineLens = poly.lines().map(l => l.length());
      const multiplier = biPoly.normal().sameDirection(poly.normal()) ? -1 : 1;
      const distance = 2 * Math.max.apply(null, lineLens);
      biPoly = BiPolygon.fromPolygon(poly, 0, multiplier * distance, {x: distance, y:distance});
      return biPoly.toModel(this.getJoints().female);
    }

    this.partName = () => `CutterRef(${reference.partCode()}${offset >= 0 ? '+' + offset : offset}@${fromPoint})`;
  }
}

Cutter.Model = CutterModel;
Cutter.Reference = CutterReference;

module.exports = Cutter;
