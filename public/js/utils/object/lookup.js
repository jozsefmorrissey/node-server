
class Lookup {
  constructor(id, attr, singleton) {
    if (id){
      const decoded = Lookup.decode(id);
      if (decoded) {
        id = decoded.id;
      } else if (id._TYPE !== undefined) {
        id = Lookup.decode(id[id[Lookup.ID_ATTRIBUTE]]).id;
      }
    }
    id = id || String.random();
    const cxtr = this.constructor;
    const cxtrHash = cxtr.name.hash();
    let cxtrAndId = `${cxtrHash}:${id}`
    if (singleton && cxtr.get(id)) return cxtr.get(id);

    let constructedAt = new Date().getTime();
    let modificationWindowOpen = true;
    attr = attr || 'id';
    Object.getSet(this, attr, Lookup.ID_ATTRIBUTE);


    this[Lookup.ID_ATTRIBUTE] = () => attr;
    this[attr] = (initialValue) => {
      if (modificationWindowOpen) {
        if (initialValue) {
          Lookup.byId[cxtr.name][id] = undefined;
          id = initialValue;
          cxtrAndId = `${cxtrHash}:${id}`
          Lookup.byId[cxtr.name][id] = this;
          modificationWindowOpen = false;
        } else if (constructedAt < new Date().getTime() - 200) {
          modificationWindowOpen = false;
        }
      }
      return cxtrAndId;
    }

    function registerConstructor() {
      if (Lookup.byId[cxtr.name] === undefined) {
        Lookup.byId[cxtr.name] = {};
        Lookup.constructorMap[cxtr.name.hash()] = cxtr;
      }
    }

    function addSelectListFuncToConstructor() {
      if(cxtr.selectList === Lookup.selectList) {
        cxtr.get = (id) => Lookup.newGet(id, cxtr);
        Lookup.byId[cxtr.name] = {};
        cxtr.selectList = () => Lookup.selectList(cxtr.name);
      }
    }

    registerConstructor();
    addSelectListFuncToConstructor();


    Lookup.byId[cxtr.name][id] = this;
    this.toString = () => this[attr]();
  }
}

Lookup.ID_ATTRIBUTE = 'ID_ATTRIBUTE';
Lookup.byId = {};
Lookup.constructorMap = {};
Lookup.get = (cxtrName, id) => {
  const decoded = Lookup.decode(id);
  id = decoded ? decoded.id : id;
  return Lookup.byId[cxtrName][id];
}
Lookup.newGet = (id, constructor) => {
  const decoded = Lookup.decode(id);
  id = decoded ? decoded.id : id;
  constructor = constructor || decoded.constructor;
  return Lookup.byId[constructor.name][id];
}
Lookup.selectList = (className) => {
  return Object.keys(Lookup.byId[className]);
}
Lookup.decode = (id) => {
  if ((typeof id) !== 'string') return;
  const split = id.split(':');
  if (split.length === 1) return;
  return {
    constructor: Lookup.constructorMap[split[0]],
    id:  split[1]
  };
}

try {
  module.exports = Lookup;
} catch (e) {/* TODO: Consider Removing */}
