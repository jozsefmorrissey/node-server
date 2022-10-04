
const Snap2d = require('../snap');
const SnapCorner = require('../snap/corner');
const Square2d = require('../square');
const Polygon2d = require('../polygon');
const SnapLocation2d = require('../snap-location');
const Vertex2d = require('../vertex');

class SnapCornerL extends Snap2d {
  constructor(parent, tolerance) {
    const polygon = new Polygon2d();
    // super(parent, new Square2d(parent.center), tolerance);
    super(parent, polygon, tolerance);
    if (parent === undefined) return this;

    this.addLocation(SnapCorner.backRight(this));
    this.addLocation(SnapCorner.frontRight(this));
    this.addLocation(SnapCornerL.frontCenter(this));
    this.addLocation(SnapCorner.frontLeft(this));
    this.addLocation(SnapCorner.backLeft(this));

    this.addLocation(SnapCorner.daginalLeft(this));
    this.addLocation(SnapCorner.diagonalRight(this));
    const verticies = this.snapLocations().map((snap) =>
      snap.vertex());
    polygon.addVerticies(verticies);
  }
}

const f = SnapLocation2d.locationFunction;
const fromToPoint = SnapLocation2d.fromToPoint;
const wf = (snapLoc, attrM, props) => f(snapLoc, 'width', attrM, props);
const hf = (snapLoc, attrM, props) => f(snapLoc, 'height', attrM, props);

SnapCornerL.frontCenter = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "frontCenter",  new Vertex2d(null),  null, 'teal');
  snapLoc.locationFunction(fromToPoint(snapLoc, wf(snapLoc, -.5, {dl: 1}), hf(snapLoc, .5, {dr: -1})));  snapLoc.at();
  return snapLoc;
}

module.exports = SnapCornerL;
