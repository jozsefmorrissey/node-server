


const Assembly = require('../assembly.js');
const BiPolygon = require('../../../three-d/objects/bi-polygon.js');
const Dependency = require('../../dependency');


class Cutter extends Assembly {
  constructor(partCode, partName, config) {
    super(partCode, partName, config);
    this.jointSettings.sliceAtOpening(false);
    this.jointSettings.noDependencies(true)
    this.jointSettings.female(false)
    this.jointSettings.extend(false)
    this.jointSettings.extendTo(false)
    this.digital(true);
  }
}

Cutter.property('manuallyConfigurable', true, false, false, false);

class CutterAutoConfigured extends Cutter {
  constructor(...args) {
    super(...args);
  }
}
CutterAutoConfigured.property('manuallyConfigurable', false, false, false, false);

class CutterModel extends CutterAutoConfigured {
  constructor(partCode, partName) {
    super(partCode);
    this.partName = partName instanceof Function ? partName : () => partName;
  }
}

class CutterReference extends CutterAutoConfigured {
    constructor (reference, fromPoint, offset, front) {
    front = front === false ? false : true;
    const partCode = `CR${reference.toString().hash(9949, false)}`;
    const partName = 'Reference';
    super(partCode, partName);
    // if (reference instanceof Assembly) {
    //   const joint = new Dependency(reference, this)
    //   this.addDependencies(joint);
    // }
    // this.part(true);
    // this.included(true);
    offset ||= 0;

    this.reference = () => reference;
    this.fromPoint = fromPoint instanceof Function ? fromPoint :() => fromPoint;
    this.offset = () => offset;
    this.front = () => front;

    this.toString = () => `CutterRef(${reference.partCode()}${offset >= 0 ? '+' + offset : offset}@${this.fromPoint()})`;
  }
}


class CutterRegExp extends CutterAutoConfigured {
    constructor (regexp, offsetRatio, ingulf, axis, fromPoint) {
    const partCode = `CREG${String.random()}`;
    const partName = 'RegExp';
    super(partCode, partName);
    offsetRatio ||= 0;

    this.regexp = () => regexp;
    this.ingulf = () => ingulf;
    this.offsetRatio = () => offsetRatio;
    this.axis = () => axis;
    this.fromPoint = fromPoint instanceof Function ? fromPoint :() => fromPoint;


    this.toString = () => `CutterRegExp(${reference}${offset >= 0 ? '+' + offsetRatio : offsetRatio}@${axis})`;
  }
}


class CutterPoly extends CutterAutoConfigured {
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
Cutter.RegExp = CutterRegExp;
Cutter.Poly = CutterPoly;
Cutter.AutoConfigured = CutterAutoConfigured;

module.exports = Cutter;
