


const Assembly = require('../assembly.js');
const BiPolygon = require('../../../three-d/objects/bi-polygon.js');
const FunctionCache = require('../../../../../../public/js/utils/services/function-cache.js');

FunctionCache.on('cutter', 500);

class Cutter extends Assembly {
  constructor(partCode, partName, centerConfig, demensionConfig, rotationConfig) {
    super(partCode, partName, centerConfig, demensionConfig, rotationConfig);
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
    const partCode = `CR${String.random(4)}`;
    super(partCode);
    offset ||= 0;

    this.toModel = new FunctionCache(() => {
      let biPoly = reference.toBiPolygon();
      biPoly.offset(fromPoint, offset);
      const poly = front ? biPoly.front() : biPoly.back();
      let length = 0;
      poly.lines().forEach(l => length += l.length());
      const multiplier = biPoly.normal().sameDirection(poly.normal()) ? -1 : 1;
      const distance = 10 * length;
      biPoly = BiPolygon.fromPolygon(poly, 0, multiplier * distance, {x: distance, y:distance});
      return biPoly.toModel(this.getJoints().female);
    }, this, 'cutter');

    this.partName = () => `CutterRef(${reference.partCode()}${offset >= 0 ? '+' + offset : offset}@${fromPoint})`;
  }
}

Cutter.Model = CutterModel;
Cutter.Reference = CutterReference;

module.exports = Cutter;
