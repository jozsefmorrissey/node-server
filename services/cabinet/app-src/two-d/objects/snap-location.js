
const Vertex2d = require('vertex');
const Line2d = require('line');
const Circle2d = require('circle');
const HoverMap2d = require('../hover-map')

class SnapLocation2d {
  constructor(parent, location, centerFunction, targetVertex, pairedWith) {
    Object.getSet(this, {location, targetVertex}, "wallThetaOffset", "parentId", "pairedWithId", "thetaOffset");
    pairedWith = pairedWith || null;
    let courting;
    const instance = this;

    const thetaOffset = {_DEFAULT: 0};
    this.center = () => centerFunction();
    this.thetaOffset = (cxtrNameOinstance, location, value) => {
      const cxtrName = cxtrNameOinstance instanceof SnapLocation2d ?
              cxtrNameOinstance.parent().constructor.name :
              cxtrNameOinstance ? cxtrNameOinstance : parent.constructor.name;
      if (cxtrNameOinstance instanceof SnapLocation2d && location === undefined)
        location = cxtrNameOinstance.location();
      if (cxtrName !== undefined && Number.isFinite(value)) {
        if (thetaOffset._DEFAULT === undefined) thetaOffset._DEFAULT = value;
        if (thetaOffset[cxtrName] === undefined) thetaOffset[cxtrName] = {};
        if (thetaOffset[cxtrName]._DEFAULT === undefined) thetaOffset[cxtrName]._DEFAULT = value;
        if (location) thetaOffset[cxtrName][location] = value;
      }
      return thetaOffset[cxtrName] === undefined ? thetaOffset._DEFAULT :
          (thetaOffset[cxtrName][location] === undefined ? thetaOffset[cxtrName]._DEFAULT :
          thetaOffset[cxtrName][location]);
    }

    // If position is defined and a Vertex2d:
    //        returns the position of parents center iff this location was at position
    // else
    //        returns current postion based off of the parents current center

    this.at = (position) => {
      return centerFunction(position);
    }
    this.centerFunction = (lf) => {
      if ((typeof lf) === 'function') centerFunction = lf;
      return lf;
    }
    this.circle = () => new Circle2d(5, centerFunction());
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
      otherSnapLoc ||= courting;
      const alreadyPaired = otherSnapLoc === pairedWith;
      if (!alreadyPaired) {
        pairedWith = otherSnapLoc;
        if (otherSnapLoc instanceof SnapLocation2d) otherSnapLoc.pairWith(this);
      }
    }

    // TODO: location should be immutible and so should these;
    this.isRight = this.location().indexOf('right') === 0;
    this.isLeft = this.location().indexOf('left') === 0;
    this.isBack = this.location().indexOf('back') === 0;
    this.isCenter = this.location().match(/center$/) !== null;

    this.courting = (otherSnapLoc) => {
      if (courting === otherSnapLoc) return courting;
      if (!pairedWith) {
        if (otherSnapLoc instanceof SnapLocation2d) {
          courting = otherSnapLoc;
          otherSnapLoc.courting(this);
        } else if (otherSnapLoc === null && courting) {
          const tempLocation = courting;
          courting = null;
          tempLocation.courting(null);
        }
      } else {
        throw new Error('You cannot court a location when alreadyPaired');
      }
      return courting;
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

    this.neighbors = (...indicies) => {
      const vertexNeighbors = parent.object().neighbors(this.center(), ...indicies);
      return vertexNeighbors.map((vert) => parent.snapLocations.at(vert));
    }

    this.neighbor = (index) => this.neighbors(index)[0];

    this.isConnected = (obj) => {
      let connected = false;
      this.forEachObject((connObj) => connected = connected || obj.id() === connObj.id());
      return connected;
    }

    this.rotate = (theta) => {
      this.forEachObject((obj) => obj.radians((obj.radians() + theta) % (2*Math.PI)));
    }

    this.slope = (offsetIndex) => {
      const neighbor = parent.object().neighbors(this.center(), offsetIndex)[0];
      const nCenter = neighbor.point();
      const center = this.center().point();
      if (offsetIndex < 0)
        return Line2d.getSlope(nCenter.x, nCenter.y, center.x, center.y);
      return Line2d.getSlope(center.x, center.y, nCenter.x, nCenter.y);
    }

    this.forwardSlope = () => this.slope(1);
    this.reverseSlope =  () => this.slope(-1);
    this.forwardRadians = () => Math.atan(this.slope(1));
    this.reverseRadians = () => Math.atan(this.slope(-1));


    function moveConnectedObjects(moveId) {
      const pairedLocs = parent.snapLocations.paired();
      for (let index = 0; index < pairedLocs.length; index += 1) {
        const loc = pairedLocs[index];
        const paired = loc.pairedWith();
        const tarVertexLoc = instance.parent().position[loc.location()]().center();
        if (paired instanceof SnapLocation2d) paired.move(tarVertexLoc, moveId);
      }
    }

    function makeMove(thisNewCenterLoc, moveId, theta) {
      if (theta) instance.parent().object().rotate(theta);
      instance.parent().radians(thisNewCenterLoc);
      instance.parent().update();
      lastMove = moveId;
      moveConnectedObjects(moveId);
    }

    this.snapToLocation = (otherSnapLoc) => {
      const center = otherSnapLoc.center();
      const otherRads = otherSnapLoc.forwardRadians();
      const rads = instance.forwardRadians();
      const changeInTheta = otherRads - rads;
      const position1 = {center: center, theta: changeInTheta};
      const position2 = {center: center, theta: changeInTheta - Math.PI};
      const newPosition1 = instance.parent().position[location](position1);
      const newPosition2 = instance.parent().position[location](position2);
      const otherObjectCenter = otherSnapLoc.parent().object().center()
      const dist1 = newPosition1.distance(otherObjectCenter);
      const dist2 = newPosition2.distance(otherObjectCenter);
      const objTheta = instance.parent().radians();
      const theta = objTheta - changeInTheta;
      if (dist1 > dist2) {
        instance.parent().makeMove({center: newPosition1, theta});
      } else {
        instance.parent().makeMove({center: newPosition2, theta: theta - Math.PI});
      }
    }

    function snapToObject(vertex, moveId) {
      const otherSnapLoc = parent.otherHoveringSnap(vertex);
      if (!otherSnapLoc) return false;
      instance.courting(otherSnapLoc);
      instance.snapToLocation(otherSnapLoc);
      return true;
    }

    let lastMove = 0;
    this.move = (vertex, moveId) => {
      const shouldNotSnap = (typeof moveId) === 'number' || moveId === null;
      moveId = (typeof moveId) !== 'number' ? lastMove + 1 : moveId;
      if (lastMove === moveId) return;
      vertex = new Vertex2d(vertex);
      if (shouldNotSnap || !snapToObject(vertex)) {
        const thisNewCenterLoc = this.parent().position[location]({center: vertex});
        this.parent().makeMove({center: thisNewCenterLoc});
        // makeMove(thisNewCenterLoc, moveId);
      }
    }
    this.notPaired = () => pairedWith === null;

    this.hovering = new HoverMap2d(() => this.center(), 12).hovering;

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
    if (xDiff === 0 && yDiff === 0) {
      if (position) return snapLoc.parent().parent().center().clone();
      vertex.point(snapLoc.parent().parent().center().clone());
      return snapLoc;
    }
    const center = snapLoc.parent().parent().center();
    const direction = xDiff >= 0 ? 1 : -1;
    const hypeLen = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    let rads = Math.atan(yDiff/xDiff);
    if (position) {
      rads += position.theta === undefined ? snapLoc.parent().radians() : position.theta;
      const newPoint = position.center;
      return new Vertex2d({
        x: newPoint.x() - direction * (hypeLen * Math.cos(rads)),
        y: newPoint.y() - direction * (hypeLen * Math.sin(rads))
      });
    } else {
      rads += snapLoc.parent().radians();
      vertex.point({
        x: center.x() + direction * (hypeLen * Math.cos(rads)),
        y: center.y() + direction * (hypeLen * Math.sin(rads))
      });
      return snapLoc;
    }
  }
}
SnapLocation2d.fromToPoint = fromToPoint;

const f = (snapLoc, attr, attrM, props) => () => {
  let val = snapLoc.parent()[attr]() * attrM;
  let keys = Object.keys(props || {});
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    val += snapLoc.parent()[key]() * props[key];
  }
  return val;
};

SnapLocation2d.locationFunction = f;

module.exports = SnapLocation2d;
