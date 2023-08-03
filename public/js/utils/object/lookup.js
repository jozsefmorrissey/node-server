
class IdString extends String {
  constructor(...ids) {
    let id = '';
    for (let index = 0; index < ids.length; index++) {
      id += `${ids[index]}_`;
    }
    id = id.substring(0, id.length - 1);
    super(id);
    this.split = () => {
      return id.split('_');
    }
    this.toJson = () => new String(id).toString();
    this.index = (index) => this.split().at(index);
    this.equals = (other) => `${this}` ===`${other}`;
    this.equivalent = (other, ...indicies) => {
      if (indicies.length === 0) return this.equals(other);
      const thisSplit = this.split();
      const otherSplit = other.split();
      for (let index = 0; index < indicies.length; index++) {
        const i = indicies[index];
        if (thisSplit[i] !== otherSplit[i]) return false;
      }
      return true;
    }
  }
}



class Lookup {
  constructor(id, attr, singleton) {
    if (id && id._TYPE) {
      attr = id.ID_ATTRIBUTE;
      id = id.id;
    }
    Lookup.convert(this, attr, id, singleton);
  }
}

Lookup.convert = function (obj, attr, id, singleton) {
  if (id) {
    const decoded = Lookup.decode(id);
    if (decoded) {
      id = decoded.id;
    } else if (id._TYPE !== undefined) {
      id = Lookup.decode(id[id[Lookup.ID_ATTRIBUTE]]).id;
    }
  }

  const cxtr = obj.constructor;
  const cxtrName = cxtr.name;
  id = new IdString(cxtrName, id || String.random());
  let group;
  if (singleton && cxtr.get(id)) return cxtr.get(id);

  let constructedAt = new Date().getTime();
  let modificationWindowOpen = true;
  attr = attr || 'id';
  if (obj.constructor.name === 'Object' && !obj.toJson) {
    obj.toJson = () => JSON.copy(obj);
  }
  Object.getSet(obj, attr, Lookup.ID_ATTRIBUTE);
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
    delete Lookup.byId[cxtr.name][obj[attr]().index(-1)];
  }


  obj[Lookup.ID_ATTRIBUTE] = () => attr;
  obj[attr] = (idStr) => {
    if (modificationWindowOpen) {
      if (idStr instanceof IdString) {
        let objId = idStr.index(-1);
        id = new IdString(cxtrName, objId);
        Lookup.byId[cxtr.name][id.index(-1)] = obj;
        modificationWindowOpen = false;
      } else if (constructedAt < new Date().getTime() - 200) {
        modificationWindowOpen = false;
      }
    }
    return id;
  }

  function registerConstructor() {
    if (Lookup.byId[cxtr.name] === undefined) {
      Lookup.byId[cxtr.name] = {};
      Lookup.constructorMap[cxtr.name] = cxtr;
    }
  }

  function addSelectListFuncToConstructor() {
    if (cxtr !== Lookup) {
      if(cxtr.selectList === Lookup.selectList) {
        cxtr.get = (id) => Lookup.get(id, cxtr);
        if (cxtr.instance === undefined) cxtr.instance = () => Lookup.instance(cxtr.name);
        Lookup.byId[cxtr.name] = {};
        cxtr.selectList = () => Lookup.selectList(cxtr.name);
      }
    }
  }

  registerConstructor();
  addSelectListFuncToConstructor();


  if (!Lookup.byId[cxtrName][id.index(-1)])
    Lookup.byId[cxtrName][id.index(-1)] = obj;
  else
    console.warn(`Lookup id '${id}' object has been created more than once.`);
  if (obj.toString === undefined) obj.toString = () => obj[attr]();
}

Lookup.ID_ATTRIBUTE = 'ID_ATTRIBUTE';
Lookup.byId = {Lookup};
Lookup.constructorMap = {Lookup: Lookup};
Lookup.groups = {};
Lookup.freeAgents = {};

Lookup.get = (id, cxtr) => {
  const decoded = Lookup.decode(id);
  let decodedId, decodedCxtr;
  if (decoded) {
    decodedId = decoded.id;
    decodedCxtr = decoded.constructor;
  }
  id = decodedId || id;
  cxtr = cxtr || decodedCxtr || Lookup;
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
  if ((typeof id) === 'string') id = new IdString(...id.split('_'));
  if (!(id instanceof IdString)) return;
  const cxtrId = id.index(0);
  const objId = id.index(-1);
  return {
    constructor: cxtrId === objId ? undefined : Lookup.constructorMap[cxtrId],
    id: objId
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

Lookup.fromJson = (json) => {
  const attr = json[Lookup.ID_ATTRIBUTE];
  if (attr) {
    const obj = Lookup.get(json[attr]);
    if(obj) return obj;
  }

  const type = json._TYPE;
  if (type && type === 'Lookup') return new Lookup(json);
  const obj = Object.fromJson(json);
  if (obj instanceof Lookup) return obj;
  if (attr) {
    Lookup.convert(obj, obj[attr], attr)
    return obj;
  }
  return null;
}

Lookup.IdString = IdString;
try {
  module.exports = Lookup;
} catch (e) {/* TODO: Consider Removing */}
