const Assembly = require('../assembly.js');
const Handle = require('./hardware/pull.js');

class HasPull extends Assembly {
  constructor(partCode, partName) {
    super(partCode, partName);
    let pullCount = 0;
    const pulls = [];
    this.pull = (index) => pulls[index || 0];
    this.addPull = (location) => {
      let handle = location;
      if (!(handle instanceof Handle)) handle = new Handle('pu', 'Pull', location);
      pulls.push(handle);
      this.addSubAssembly(pulls[pulls.length - 1]);
    }
    this.pulls = () => pulls;
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
  const subAssems = Object.values(json.subassemblies);
  for (let index = 0; index < subAssems.length; index++) {
    const subAssem = subAssems[index];
    if (subAssem._TYPE === 'Handle') locations.push(Object.fromJson(subAssem));
    else throw new Error('I dont know what this is. but you may need to modify this function');
  }
  hasPull.setPulls(locations);
  return hasPull;
}

module.exports = HasPull;
