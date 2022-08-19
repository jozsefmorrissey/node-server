
const Vertex2d = require('vertex');
const Circle2d = require('circle');

class SnapLocation2d {
  constructor(parent, location, vertex, targetVertex, color, pairedWith) {
    Object.getSet(this, {location, vertex, targetVertex, color}, "parentId", "pairedWithId");
    const circle = new Circle2d(5, vertex);
    pairedWith = pairedWith || null;
    this.circle = () => circle;
    this.eval = () => this.parent()[location]();
    this.parent = () => parent;
    this.parentId = () => parent.id();
    this.pairedWithId = () => pairedWith && pairedWith.id();
    this.pairedWith = () => pairedWith;
    this.disconnect = () => {
      if (pairedWith === null) return;
      const wasPaired = pairedWith;
      pairedWith = null;
      wasPaired.disconnect();
    }
    this.pairWith = (otherSnapLoc) => {
      const alreadyPaired = otherSnapLoc === pairedWith;
      if (!alreadyPaired) {
        pairedWith = otherSnapLoc;
        otherSnapLoc.pairWith(this);
      }
    }

    this.forEachObject = (func, objMap) => {
      objMap = objMap || {};
      objMap[this.parent().id()] = this.parent();
      const locs = this.parent().snapLocations.paired();
      for (let index = 0; index < locs.length; index += 1) {
        const loc = locs[index];
        const connSnap = loc.pairedWith();
        if (connSnap) {
          const connObj = connSnap.parent();
          if (connObj && objMap[connObj.id()] === undefined) {
            objMap[connObj.id()] = connObj;
            connSnap.forEachObject(undefined, objMap);
          }
        }
      }
      if ((typeof func) === 'function') {
        const objs = Object.values(objMap);
        for (let index = 0; index < objs.length; index += 1) {
          func(objs[index]);
        }
      }
    };

    this.isConnected = (obj) => {
      let connected = false;
      this.forEachObject((connObj) => connected = connected || obj.id() === connObj.id());
      return connected;
    }

    this.rotate = (theta) => {
      this.forEachObject((obj) => obj.radians((obj.radians() + theta) % (2*Math.PI)));
    }

    let lastMove = 0;
    this.move = (vertexLocation, moveId) => {
      moveId = (typeof moveId) !== 'number' ? lastMove + 1 : moveId;
      if (lastMove === moveId) return;
      vertexLocation = new Vertex2d(vertexLocation);
      const parent = this.parent();
      const thisNewCenterLoc = this.parent()[location]({center: vertexLocation});
      parent.object().move({center: thisNewCenterLoc});
      lastMove = moveId;
      const pairedLocs = parent.snapLocations.paired();
      for (let index = 0; index < pairedLocs.length; index += 1) {
        const loc = pairedLocs[index];
        const paired = loc.pairedWith();
        const tarVertexLoc = this.parent()[loc.location()]().vertex();
        paired.move(tarVertexLoc, moveId);
      }
    }
    this.notPaired = () => pairedWith === null;

    this.instString = () => `${parent.id()}:${location}`;
    this.toString = () => `${this.instString()}=>${pairedWith && pairedWith.instString()}`;
    this.toJson = () => {
      const pw = pairedWith;
      if (pw === undefined) return;
      const json = [{
        location, objectId: parent.id()
      }, {
        location: pw.location(), objectId: pw.parent().id()
      }];
      const thisStr = this.toString();
      const pairStr = pw.toString();
      const uniqueId = thisStr < pairStr ? thisStr : pairStr;
      json.UNIQUE_ID = uniqueId;
      return json;
    }
  }
}

SnapLocation2d.fromJson = (json) => {
  console.log('jsoned it up!')
}

let activeLocations = [];
SnapLocation2d.active = (locs) => {
  if (Array.isArray(locs)) activeLocations = activeLocations.concat(locs);
  return activeLocations;
}
SnapLocation2d.clear = () => activeLocations = [];

module.exports = SnapLocation2d;
