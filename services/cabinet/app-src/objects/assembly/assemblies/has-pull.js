const Assembly = require('../assembly.js');
const Handle = require('./hardware/pull.js');

class HasPull extends Assembly {
  constructor(partCode, partName, getBiPolygon) {
    super(partCode, partName);
    const pulls = [];
    this.pull = (index) => pulls[index || 0];
    this.addPull = (location) => {
      pulls.push(new Handle(`${partCode}-dp`, 'Door.Handle', this, location));
      this.addSubAssembly(pulls[pulls.length - 1]);
    }
    this.setPulls = (locations) => {
      pulls.copy([]);
      this.subassemblies.deleteAll();
      locations.forEach((location) => this.addPull(location));
    }
    this.biPolygon = () => getBiPolygon();

  }
}

module.exports = HasPull;
