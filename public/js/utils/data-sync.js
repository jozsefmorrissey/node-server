

class DataSync {
  constructor(idAttr, getById) {
    let connections = {};
    let lastValue = {};
    let idMap = {};

    const getId = (objOid) => !(objOid instanceof Object) ? objOid :
      ((typeof objOid[idAttr] === 'function' ? objOid[idAttr]() : objOid[idAttr]));

    const getArray = (elems) => !elems ? [] : (elems.length === 1 ? elems[0] : elems);


    function makeSyncronous(key,...objOids) {
      objOids = getArray(objOids);
      for (let index = 1; index < objOids.length; index += 1) {
        let id;
        const obj1Id = getId(objOids[index - 1]);
        const obj2Id = getId(objOids[index]);
        idMap[obj1Id] = idMap[obj1Id] || {};
        idMap[obj2Id] = idMap[obj2Id] || {};
        if (idMap[obj1Id][key] === undefined) {
          if (idMap[obj2Id][key] === undefined) {
            id = String.random();
          } else {
            id = idMap[obj2Id][key];
          }
        } else { id = idMap[obj1Id][key]; }
        idMap[obj1Id][key] = id;
        idMap[obj2Id][key] = id;
        connections[id] = connections[id] || [];
        if (connections[id].indexOf(obj1Id) === -1) {
          connections[id].push(obj1Id)
        }
        if (connections[id].indexOf(obj2Id) === -1) {
          connections[id].push(obj2Id)
        }
      }
    }

    function unSync(key,...objOids) {
      objOids = getArray(objOids);
      for (let index = 1; index < objOids.length; index += 1) {
        const id = getId(objOids[index]);
        const connId = idMap[id][key];
        const conns = connections[connId];
        let tIndex;
        while ((tIndex = conns.indexOf(id)) !== -1) conns.split(tIndex, 1);
        delete idMap[id][key];
      }
    }

    function update(key, value, objOid) {
      const id = getId(objOid);
      if (!idMap[id] || !idMap[id][key]) return;
      const connId = idMap[id] && idMap[id][key];
      if (connId === undefined) return;
      if (lastValue[connId] !== value) {
        lastValue[connId] = value;
        const objIds = connections[connId];
        for (let index = 0; objIds && index < objIds.length; index ++) {
          const obj = getById(objIds[index]);
          if (obj !== undefined) obj[key](value);
        }
      }
    }

    function shouldRun(hasRan, validIds, id) {
      return !hasRan && (validIds === null || validIds.indexOf(id) !== -1);
    }

    function forEach(func, ...objOids) {
      objOids = getArray(objOids);
      let alreadyRan = {};
      let validIds = objOids === undefined ? null :
                      objOids.map((objOid) => getId(objOid));
      let ids = Object.keys(idMap);
      for (let index = 0; index < ids.length; index += 1) {
        const id = ids[index];
        const idKeys = Object.keys(idMap[id]);
        for (let iIndex = 0; iIndex < idKeys.length; iIndex += 1) {
          const idKey = idKeys[iIndex];
          const connectionId = idMap[id][idKey];
          if (shouldRun(alreadyRan[connectionId], validIds, id)) {
            const connIds = connections[connectionId];
            const applicableConnections = [];
            for (let cIndex = 0; cIndex < connIds.length; cIndex += 1) {
              if (shouldRun(alreadyRan[connectionId], validIds, id)) {
                applicableConnections.push(connIds[cIndex]);
              }
            }
            if (applicableConnections.length === 0) throw new Error('This should never happen');
            func(idKey, applicableConnections);
            alreadyRan[connectionId] = true;
          }
        }
      }
    }

    function fromJson(connections) {
      const keys = Object.keys(connections);
      keys.forEach((key) => {
        this.addConnection(key);
        const groups = connections[key];
        groups.forEach((group) => {
          this[`${key}Sync`](group);
        });
      });
    }


    function toJson(...objOids) {
      objOids = getArray(objOids);
      const connects = {};
      forEach((key, connections) => {
        if (connects[key] === undefined) connects[key] = [];
        connects[key].push(connections);
      }, ...objOids);
      return connects;
    }

    this.addConnection = (key) => {
      this[`${key}Sync`] = (...objOids) => makeSyncronous(key, ...objOids);
      this[`${key}UnSync`] = (...objOids) => makeSyncronous(key, ...objOids);
      this[`${key}Update`] = (value, objOid) => update(key,value, objOid);
    }
    this.toJson = toJson;
    this.fromJson = fromJson;
  }
}

module.exports = DataSync;
