


const Assembly = require('../../assembly.js');
const Handle = require('../hardware/pull.js');
const pull = require('../../../../three-d/models/pull.js');


class Door extends Assembly {
  constructor(partCode, partName, getBiPolygon) {
    super(partCode, partName);

    this.toModel = () => {
      const biPolygon = getBiPolygon();
      if (biPolygon) return biPolygon.toModel();
      return undefined;
    }

    this.front = () => {
      const biPoly = getBiPolygon();
      if (biPoly === undefined) return;
      return biPoly.front();
    }
    this.back = () => {
      const biPoly = getBiPolygon();
      if (biPoly === undefined) return;
      return biPoly.back();
    }

    let pull = new Handle(`${partCode}-dp`, 'Door.Handle', this, Handle.location.LEFT);
    this.pull = () => pull;
    this.addSubAssembly(pull);
  }
}

Door.abbriviation = 'dr';


module.exports = Door
