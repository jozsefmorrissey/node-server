const Assembly = require('../assembly.js');
const Handle = require('./hardware/pull.js');

class HasPull extends Assembly {
  constructor(partCode, partName) {
    super(partCode, partName);
    const pulls = [];
    this.pull = (index) => pulls[index || 0];
    this.addPull = (location) => {
      pulls.push(new Handle('pu', 'Pull', this, location));
      this.addSubAssembly(pulls[pulls.length - 1]);
    }
    this.setPulls = (locations) => {
      pulls.deleteAll();
      this.subassemblies.deleteAll();
      locations.forEach((location) => this.addPull(location));
    }
  }
}

HasPull.fromJson = (json) => {
  const hasPull = Assembly.fromJson(json);
  const locations = [];
  for (let index = 0; index < json.subassemblies; index++) {
    const subAssem = json.subassemblies[index];
    if (subAssem._TYPE === 'Handle') locations.push(Object.fromJson(subAssem));
    else throw new Error('I dont know what this is. but you may need to modify this function');
  }
}

module.exports = HasPull;
