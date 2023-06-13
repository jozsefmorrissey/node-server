

class Lookup {
  constructor(id) {
    id = id || String.random();
    console.log('creating lookup: ', id)
    Object.getSet(this, 'id');
    this.id = () => id;
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
    this.toString = () => this.id();
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
