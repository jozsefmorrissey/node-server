


const Assembly = require('../assembly.js');
const BiPolygon = require('../../../three-d/objects/bi-polygon.js');
const FunctionCache = require('../../../../../../public/js/utils/services/function-cache.js');
const Dependency = require('../../dependency');

FunctionCache.on('cutter', 500);

class Cutter extends Assembly {
  constructor(partCode, partName, config) {
    super(partCode, partName, config);
    this.part(false);
  }
}
Cutter.abbriviation = 'cut';

class CutterModel extends Cutter {
  constructor(partCode, partName) {
    super(partCode);
    this.partName = partName instanceof Function ? partName : () => partName;
  }
}

class CutterReference extends Cutter {
    constructor (reference, fromPoint, offset, front) {
    front = front === false ? false : true;
    const partCode = `CR${reference.locationCode().hash(9949, false)}`;
    super(partCode, 'Reference');
    // if (reference instanceof Assembly) {
    //   const joint = new Dependency(reference, this)
    //   this.addDependencies(joint);
    // }
    offset ||= 0;

    this.reference = () => reference;
    this.fromPoint = fromPoint instanceof Function ? fromPoint :() => fromPoint;
    this.offset = () => offset;
    this.front = () => front;

    this.toString = () => `CutterRef(${reference.partCode()}${offset >= 0 ? '+' + offset : offset}@${fromPoint()})`;
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

    this.partName = () => `CutterPoly(${poly.toString()})`;
  }
}

class ControlableAbyss extends CutterModel {
  constructor(...args) {
    super(...args)
  }
}

Cutter.Model = CutterModel;
Cutter.Reference = CutterReference;
Cutter.Poly = CutterPoly;

module.exports = Cutter;
