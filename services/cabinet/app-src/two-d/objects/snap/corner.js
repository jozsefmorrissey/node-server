
const Snap2d = require('../snap');
const Square2d = require('../square');
const Polygon2d = require('../polygon');
const SnapLocation2d = require('../snap-location');
const Vertex2d = require('../vertex');

class SnapCorner extends Snap2d {
  constructor(parent, tolerance) {
    const polygon = new Polygon2d();
    // super(parent, new Square2d(parent.center), tolerance);
    super(parent, polygon, tolerance);
    if (parent === undefined) return this;

    this.addLocation(SnapCorner.backRight(this));
    this.addLocation(SnapCorner.frontRight(this));
    this.addLocation(SnapCorner.frontLeft(this));
    this.addLocation(SnapCorner.backLeft(this));

    this.addLocation(SnapCorner.daginalLeft(this));
    this.addLocation(SnapCorner.diagonalRight(this));
    const verticies = this.snapLocations().map((snap) =>
      snap.vertex());
    polygon.addVerticies(verticies);
  }
}

const f = (snapLoc, attr, attrM, props) => () => {
  let val = snapLoc.parent()[attr]() * attrM;
  let keys = Object.keys(props || {});
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    val += snapLoc.parent()[key]() * props[key];
  }
  return val;
};

const fromToPoint = SnapLocation2d.fromToPoint;
const wf = (snapLoc, attrM, props) => f(snapLoc, 'width', attrM, props);
const hf = (snapLoc, attrM, props) => f(snapLoc, 'height', attrM, props);

SnapCorner.daginalLeft = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "daginalLeft",  new Vertex2d(null),  'diagonalRight', 'teal');
  snapLoc.locationFunction(fromToPoint(snapLoc, wf(snapLoc, -.5), hf(snapLoc, .5, {dol: -1})));
  snapLoc.wallThetaOffset(90);
  snapLoc.thetaOffset(180);
  snapLoc.at();
  return snapLoc;
}

SnapCorner.diagonalRight = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "diagonalRight",  new Vertex2d(null),  'daginalLeft', 'teal');
  snapLoc.locationFunction(fromToPoint(snapLoc, wf(snapLoc, -.5, {dor: 1}), hf(snapLoc, .5)));
  snapLoc.wallThetaOffset(180);
  snapLoc.thetaOffset(180);
  snapLoc.at();
  return snapLoc;
}

SnapCorner.backLeft = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "backLeft",  new Vertex2d(null),  'frontLeft', 'teal');
  snapLoc.locationFunction(fromToPoint(snapLoc, wf(snapLoc, -.5), hf(snapLoc, -.5)));
  snapLoc.thetaOffset(180);
  snapLoc.at();
  return snapLoc;
}

SnapCorner.frontLeft = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "frontLeft",  new Vertex2d(null),  'backLeft', 'teal');
  snapLoc.locationFunction(fromToPoint(snapLoc, wf(snapLoc, -.5, {dl: 1}), hf(snapLoc, -.5)));
  snapLoc.thetaOffset(180);
  snapLoc.at();
  return snapLoc;
}

SnapCorner.backRight = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "backRight",  new Vertex2d(null),  'frontRight', 'teal');
  snapLoc.locationFunction(fromToPoint(snapLoc, wf(snapLoc, .5), hf(snapLoc, .5)));
  snapLoc.thetaOffset(180);
  snapLoc.at();
  return snapLoc;
}

SnapCorner.frontRight = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "frontRight",  new Vertex2d(null),  'backRight', 'teal');
  snapLoc.locationFunction(fromToPoint(snapLoc, wf(snapLoc,.5), hf(snapLoc, .5, {dr: -1})));
  snapLoc.thetaOffset(180);
  snapLoc.at();
  return snapLoc;
}

module.exports = SnapCorner;
