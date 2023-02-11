
const Vertex2d = require('vertex');
const Line2d = require('line');
const Circle2d = require('circle');
const HoverMap2d = require('../hover-map')

class SnapLocation2d {
  constructor(parent, location, centerFunction) {
    Object.getSet(this, {location});
    let pairedWith = null;
    let courting;
    const instance = this;

    this.center = () => centerFunction();

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
    this.circle = (radius) => new Circle2d(radius || 2, centerFunction());
    this.eval = () => this.parent().position[location]();
    this.parent = () => parent;
    this.pairedWith = () => pairedWith;
    this.disconnect = () => {
      if (pairedWith === null) return false;
      const wasPaired = pairedWith;
      pairedWith = null;
      if (wasPaired instanceof SnapLocation2d) wasPaired.disconnect();
      instance.parent().clearIdentifiedConstraints();
      return true;
    }
    this.pairWith = (otherSnapLoc) => {
      otherSnapLoc ||= courting;
      const alreadyPaired = otherSnapLoc === pairedWith;
      if (!alreadyPaired && otherSnapLoc) {
        pairedWith = otherSnapLoc;
        courting = null;
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
        if (otherSnapLoc) {
          courting = otherSnapLoc;
          if (otherSnapLoc instanceof SnapLocation2d)
            otherSnapLoc.courting(this);
        } else if (otherSnapLoc === null && courting) {
          const tempLocation = courting;
          courting = null;
          if (tempLocation instanceof SnapLocation2d)
            tempLocation.courting(null);
        }
      } else if (otherSnapLoc) {
        throw new Error('You cannot court a location when alreadyPaired');
      }
      return courting;
    }

    this.neighbors = (...indicies) => {
      const vertexNeighbors = parent.object().neighbors(this.center(), ...indicies);
      return vertexNeighbors.map((vert) => parent.snapLocations.at(vert));
    }

    this.neighbor = (index) => this.neighbors(index)[0];

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

    function snapToObject(vertex) {
      const otherSnapLoc = parent.otherHoveringSnap(vertex);
      if (!otherSnapLoc) return false;
      instance.courting(otherSnapLoc);
      instance.snapToLocation(otherSnapLoc);
      return true;
    }

    this.move = (vertex, moveId) => {
      if (parent.connected()) return parent.moveConnected(this.at({center: vertex}));
      const shouldNotSnap = (typeof moveId) === 'number' || moveId === null;
      vertex = new Vertex2d(vertex);
      if (shouldNotSnap || !snapToObject(vertex)) {
        const thisNewCenterLoc = this.parent().position[location]({center: vertex});
        this.parent().makeMove({center: thisNewCenterLoc});
      }
    }

    this.rotateAround = (theta) => {
      const startPosition = {center: this.center()};
      this.parent().moveConnected(null, theta);
      const newCenter = this.at(startPosition);
      this.parent().moveConnected(newCenter);
    }

    this.setRadians = (radians) => {
      const startPosition = {center: this.center()};
      const theta = radians - parent.radians();
      this.parent().moveConnected(null, theta);
      const newCenter = this.at(startPosition);
      this.parent().moveConnected(newCenter);
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
    const vertex = snapLoc.center();
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
