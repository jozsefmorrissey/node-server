

class Lookup {
  constructor(id, attr) {
    attr = attr || 'id';
    id = id || String.random();
    Object.getSet(this, attr);
    this[attr] = () => id;
    const cxtr = this.constructor;
    if(cxtr.selectList === Lookup.selectList) {
      cxtr.get = (id) => Lookup.get(cxtr.name, id);
      Lookup.byId[cxtr.name] = {};
      cxtr.selectList = () => Lookup.selectList(cxtr.name);
    }
    if (Lookup.register[cxtr.name] === undefined)
      Lookup.register[cxtr.name] = {};
    Lookup.register[cxtr.name][id] = this;
    Lookup.byId[cxtr.name][id] = this;
    this.toString = () => this[attr]();
  }
}

Lookup.register = {};
Lookup.byId = {};
Lookup.get = (cxtrName, id) =>
    Lookup.byId[cxtrName][id];
Lookup.selectList = (className) => {
  return Object.keys(Lookup.register[className]);
}

module.exports = Lookup;
