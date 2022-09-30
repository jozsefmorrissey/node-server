
const Vertex2d = require('vertex');
const Circle2d = require('circle');

class SnapLocation2d {
  constructor(parent, location, vertex, targetVertex, color, pairedWith) {
    Object.getSet(this, {location, vertex, targetVertex, color}, "canPairWithWall", "parentId", "pairedWithId");
    let locationFunction;
    const circle = new Circle2d(5, vertex);
    pairedWith = pairedWith || null;

    // If position is defined and a Vertex2d:
    //        returns the position of parents center iff this location was at positiion
    // else
    //        returns current postion based off of the parents current center

    this.at = (position) => (typeof locationFunction) === 'function' ? locationFunction(position) : null;
    this.locationFunction = (lf) => {
      if ((typeof lf) === 'function') locationFunction = lf;
      return lf;
    }
    this.circle = () => circle;
    this.eval = () => this.parent().position[location]();
    this.parent = () => parent;
    this.parentId = () => parent.id();
    this.pairedWithId = () => pairedWith && pairedWith.id();
    this.pairedWith = () => pairedWith;
    this.disconnect = () => {
      if (pairedWith === null) return;
      const wasPaired = pairedWith;
      pairedWith = null;
      if (wasPaired instanceof SnapLocation2d) wasPaired.disconnect();
    }
    this.pairWith = (otherSnapLoc) => {
      const alreadyPaired = otherSnapLoc === pairedWith;
      if (!alreadyPaired) {
        pairedWith = otherSnapLoc;
        if (otherSnapLoc instanceof SnapLocation2d) otherSnapLoc.pairWith(this);
      }
    }

    this.forEachObject = (func, objMap) => {
      objMap = objMap || {};
      objMap[this.parent().toString()] = this.parent();
      const locs = this.parent().snapLocations.paired();
      for (let index = 0; index < locs.length; index += 1) {
        const loc = locs[index];
        const connSnap = loc.pairedWith();
        if (connSnap instanceof SnapLocation2d) {
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
      } else return objMap;
    };

    this.forEachConnectedSnap = (func, pairedMap) => {
      pairedMap ||= {};
      const locs = this.parent().snapLocations.paired();
      for (let index = 0; index < locs.length; index += 1) {
        const loc = locs[index];
        pairedMap[loc.toString()]  = loc;
        const connSnap = loc.pairedWith();
        if (connSnap instanceof SnapLocation2d) {
          const snapStr = connSnap.toString();
          if (pairedMap[snapStr] === undefined) {
            pairedMap[snapStr] = connSnap;
            connSnap.forEachConnectedSnap(undefined, pairedMap);
          }
        }
      }

      if ((typeof func) === 'function') {
        const snaps = Object.values(pairedMap);
        for (let index = 0; index < snaps.length; index += 1) {
          func(snaps[index]);
        }
      } else return pairedMap;
    }

    this.getNonSnap = () => {
      let nonSnap = undefined;
      this.forEachConnectedSnap((snap) => {
        const pw = snap.pairedWith();
        if (pw !== undefined && !(pw instanceof SnapLocation2d)) nonSnap = pw;
      });
      return nonSnap;
    }

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
      const nonSnap = this.getNonSnap();
      console.log(nonSnap);
      moveId = (typeof moveId) !== 'number' ? lastMove + 1 : moveId;
      if (lastMove === moveId) return;
      vertexLocation = new Vertex2d(vertexLocation);
      const parent = this.parent();
      const thisNewCenterLoc = this.parent().position[location]({center: vertexLocation});
      parent.object().move({center: thisNewCenterLoc});
      lastMove = moveId;
      const pairedLocs = parent.snapLocations.paired();
      for (let index = 0; index < pairedLocs.length; index += 1) {
        const loc = pairedLocs[index];
        const paired = loc.pairedWith();
        const tarVertexLoc = this.parent().position[loc.location()]().vertex();
        if (paired instanceof SnapLocation2d) paired.move(tarVertexLoc, moveId);
      }
    }
    this.notPaired = () => pairedWith === null;

    this.instString = () => `${parent.id()}:${location}`;
    this.toString = () => pairedWith  instanceof SnapLocation2d ?
                  `${this.instString()}=>${pairedWith && pairedWith.instString()}` :
                  `${this.instString()}=>${pairedWith}`;
    this.toJson = () => {
      const pw = pairedWith;
      if (pw === undefined) return;
      const json = [{
        location, objectId: parent.parent().id()
      }];
      json[1] = pw instanceof SnapLocation2d ?
                  {location: pw.location(), objectId: pw.parent().parent().id()} :
                  pw.constructor.name;
      const thisStr = this.toString();
      const pairStr = pw.toString();
      json.view = parent.view();
      json.UNIQUE_ID = thisStr < pairStr ? thisStr : pairStr;;
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

function fromToPoint(snapLoc, xDiffFunc, yDiffFunc) {
  return (position) => {
    const xDiff = xDiffFunc();
    const yDiff = yDiffFunc();
    const vertex = snapLoc.vertex();
    const object = snapLoc.parent().object();
    const center = object.center();
    const direction = xDiff >= 0 ? 1 : -1;
    const hypeLen = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    let rads = Math.atan(yDiff/xDiff);
    rads += object.radians();
    if (position) {
      const newPoint = position.center;
      return new Vertex2d({
        x: newPoint.x() - direction * (hypeLen * Math.cos(rads)),
        y: newPoint.y() - direction * (hypeLen * Math.sin(rads))
      });
    } else {
      vertex.point({
        x: center.x() + direction * (hypeLen * Math.cos(rads)),
        y: center.y() + direction * (hypeLen * Math.sin(rads))
      });
      return snapLoc;
    }
  }
}
SnapLocation2d.fromToPoint = fromToPoint;

const wFunc = (snapLoc, multiplier) => () => snapLoc.parent().width() * multiplier;
const hFunc = (snapLoc, multiplier) => () => snapLoc.parent().height() * multiplier;

SnapLocation2d.backCenter = (parent, canPairWithWall) => {
  const snapLoc = new SnapLocation2d(parent, "backCenter",  new Vertex2d(null),  'backCenter', 'teal');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, 0), hFunc(snapLoc, -.5)));
  snapLoc.canPairWithWall(canPairWithWall);
  return snapLoc;
}
SnapLocation2d.frontCenter = (parent, canPairWithWall) => {
  const snapLoc = new SnapLocation2d(parent, "frontCenter",  new Vertex2d(null),  'frontCenter', 'blue');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, 0), () => hFunc(snapLoc, .5)));
  snapLoc.canPairWithWall(canPairWithWall);
  return snapLoc;
}
SnapLocation2d.leftCenter = (parent, canPairWithWall) => {
  const snapLoc = new SnapLocation2d(parent, "leftCenter",  new Vertex2d(null),  'rightCenter', 'pink');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, -.5), hFunc(snapLoc, 0)));
  snapLoc.canPairWithWall(canPairWithWall);
  return snapLoc;
}
SnapLocation2d.rightCenter = (parent, canPairWithWall) => {
  const snapLoc = new SnapLocation2d(parent, "rightCenter",  new Vertex2d(null),  'leftCenter', 'yellow');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, .5), hFunc(snapLoc, 0)));
  snapLoc.canPairWithWall(canPairWithWall);
  return snapLoc;
}

SnapLocation2d.backLeft = (parent, canPairWithWall) => {
  const snapLoc = new SnapLocation2d(parent, "backLeft",  new Vertex2d(null),  'backRight', 'red');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, -.5), hFunc(snapLoc, -.5)));
  snapLoc.canPairWithWall(canPairWithWall);
  return snapLoc;
}
SnapLocation2d.backRight = (parent, canPairWithWall) => {
  const snapLoc = new SnapLocation2d(parent, "backRight",  new Vertex2d(null),  'backLeft', 'purple');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, .5), hFunc(snapLoc, -.5)));
  snapLoc.canPairWithWall(canPairWithWall);
  return snapLoc;
}

SnapLocation2d.frontRight = (parent, canPairWithWall) => {
  const snapLoc = new SnapLocation2d(parent, "frontRight",  new Vertex2d(null),  'frontLeft', 'black');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, .5), hFunc(snapLoc, .5)));
  snapLoc.canPairWithWall(canPairWithWall);
  return snapLoc;
}
SnapLocation2d.frontLeft = (parent, canPairWithWall) => {
  const snapLoc = new SnapLocation2d(parent, "frontLeft",  new Vertex2d(null),  'frontRight', 'green');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, -.5), hFunc(snapLoc, .5)));
  snapLoc.canPairWithWall(canPairWithWall);
  return snapLoc;
}





module.exports = SnapLocation2d;
