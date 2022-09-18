
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
    const cxtrHash = cxtr.name;
    let group;
    let cxtrAndId = `${cxtrHash}_${id}`
    if (singleton && cxtr.get(id)) return cxtr.get(id);

    let constructedAt = new Date().getTime();
    let modificationWindowOpen = true;
    attr = attr || 'id';
    Object.getSet(this, attr, Lookup.ID_ATTRIBUTE);
    this.lookupGroup = (g) => {
      if (group === undefined && g !== undefined) {
        if (Lookup.groups[g] === undefined) Lookup.groups[g] = [];
        group = g;
        Lookup.groups[g].push(this);
      }
      return group;
    }

    this.release = () => {
      if (cxtr.reusable === true) {
        if (Lookup.freeAgents[cxtr.name] === undefined) Lookup.freeAgents[cxtr.name] = [];
        Lookup.freeAgents[cxtr.name].push(this);
        const index = Lookup.groups[group] ? Lookup.groups[group].indexOf(this) : -1;
        if (index !== -1) Lookup.groups[group].splice(index, 1);
      }
      delete Lookup.byId[cxtr.name][this[attr]];
    }


    this[Lookup.ID_ATTRIBUTE] = () => attr;
    this[attr] = (initialValue) => {
      if (modificationWindowOpen) {
        if ((typeof initialValue) === "string") {
          Lookup.byId[cxtr.name][id] = undefined;
          const decoded = Lookup.decode(initialValue);
          id = decoded ? decoded.id : initialValue;
          cxtrAndId = `${cxtrHash}_${id}`
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
        Lookup.constructorMap[cxtr.name] = cxtr;
      }
    }

    function addSelectListFuncToConstructor() {
      if(cxtr.selectList === Lookup.selectList) {
        cxtr.get = (id) => Lookup.get(id, cxtr);
        if (cxtr.instance === undefined) cxtr.instance = () => Lookup.instance(cxtr.name);
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

Lookup.convert = function (obj, attr) {
  let id = obj.id && obj.id();
  if (id){
    const decoded = Lookup.decode(id);
    if (decoded) {
      id = decoded.id;
    } else if (id._TYPE !== undefined) {
      id = Lookup.decode(id[id[Lookup.ID_ATTRIBUTE]]).id;
    }
  }
  id = id || String.random();
  const cxtr = obj.constructor;
  const cxtrHash = cxtr.name;
  let group;
  let cxtrAndId = `${cxtrHash}_${id}`

  let constructedAt = new Date().getTime();
  let modificationWindowOpen = true;
  attr = attr || 'id';
  Object.getSet(obj);
  obj.lookupGroup = (g) => {
    if (group === undefined && g !== undefined) {
      if (Lookup.groups[g] === undefined) Lookup.groups[g] = [];
      group = g;
      Lookup.groups[g].push(obj);
    }
    return group;
  }

  obj.lookupRelease = () => {
    if (cxtr.reusable === true) {
      if (Lookup.freeAgents[cxtr.name] === undefined) Lookup.freeAgents[cxtr.name] = [];
      Lookup.freeAgents[cxtr.name].push(obj);
      const index = Lookup.groups[group] ? Lookup.groups[group].indexOf(obj) : -1;
      if (index !== -1) Lookup.groups[group].splice(index, 1);
    }
    delete Lookup.byId[cxtr.name][obj[attr]];
  }


  obj[Lookup.ID_ATTRIBUTE] = () => attr;
  obj[attr] = (initialValue) => {
    if (modificationWindowOpen) {
      if (initialValue) {
        Lookup.byId[cxtr.name][id] = undefined;
        const decoded = Lookup.decode(initialValue);
        id = decoded ? decoded.id : initialValue;
        cxtrAndId = `${cxtrHash}_${id}`
        Lookup.byId[cxtr.name][id] = obj;
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
      Lookup.constructorMap[cxtr.name] = cxtr;
    }
  }

  function addSelectListFuncToConstructor() {
    if(cxtr.selectList === Lookup.selectList) {
      cxtr.get = (id) => Lookup.get(id, cxtr);
      if (cxtr.instance === undefined) cxtr.instance = () => Lookup.instance(cxtr.name);
      Lookup.byId[cxtr.name] = {};
      cxtr.selectList = () => Lookup.selectList(cxtr.name);
    }
  }

  registerConstructor();
  addSelectListFuncToConstructor();


  Lookup.byId[cxtr.name][id] = obj;
  if (obj.toString === undefined) obj.toString = () => obj[attr]();
}

Lookup.ID_ATTRIBUTE = 'ID_ATTRIBUTE';
Lookup.byId = {Lookup};
Lookup.constructorMap = {};
Lookup.groups = {};
Lookup.freeAgents = {};

Lookup.get = (id, cxtr) => {
  cxtr = cxtr || Lookup;
  const decoded = Lookup.decode(id);
  let decodedId, decodedCxtr;
  if (decoded) {
    decodedId = decoded.id;
    decodedCxtr = decoded.constructor;
  }
  id = decodedId || id;
  cxtr = cxtr || decodedCxtr;
  const instance = Lookup.byId[cxtr.name][id] || (decodedCxtr && Lookup.byId[decodedCxtr.name][id]);
  return instance;
}
Lookup.selectList = (className) => {
  return Object.keys(Lookup.byId[className]);
}
Lookup.instance = (cxtrName) => {
  const agents = Lookup.freeAgents[cxtrName];
  if (!agents || agents.length === 0) {
    return new (Lookup.constructorMap[cxtrName])();
  }

  const index = agents.length - 1;
  const agent = agents[index];
  agents.splice(index, 1);
  return agent;
}
Lookup.decode = (id) => {
  if ((typeof id) !== 'string') return;
  const split = id.split('_');
  if (split.length === 1) return;
  return {
    constructor: Lookup.constructorMap[split[0]],
    id:  split[1]
  };
}
Lookup.release = (group) => {
  const groupList = Lookup.groups[group];
  if (groupList === undefined) return;
  Lookup.groups[group] = [];
  for (let index = 0; index < groupList.length; index += 1) {
    groupList[index].release();
  }
}

try {
  module.exports = Lookup;
} catch (e) {/* TODO: Consider Removing */}
