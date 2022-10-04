const Snap2d = require('../snap');
const Square2d = require('../square');
const Polygon2d = require('../polygon');
const SnapLocation2d = require('../snap-location');
const Vertex2d = require('../vertex');

class SnapSquare extends Snap2d {
  constructor(parent, tolerance) {
    const polygon = new Polygon2d();
    // super(parent, new Square2d(parent.center), tolerance);
    super(parent, polygon, tolerance);
    if (parent === undefined) return this;
    this.addLocation(SnapSquare.backCenter(this));
    this.addLocation(SnapSquare.backRight(this));
    this.addLocation(SnapSquare.rightCenter(this));
    this.addLocation(SnapSquare.frontRight(this));
    this.addLocation(SnapSquare.frontLeft(this));
    this.addLocation(SnapSquare.leftCenter(this));
    this.addLocation(SnapSquare.backLeft(this));
    const verticies = this.snapLocations().map((snap) =>
      snap.vertex());
    polygon.addVerticies(verticies);
  }
}

const fromToPoint = SnapLocation2d.fromToPoint;
const wFunc = (snapLoc, multiplier) => SnapLocation2d.locationFunction(snapLoc, 'width', multiplier);
const hFunc = (snapLoc, multiplier) => SnapLocation2d.locationFunction(snapLoc, 'height', multiplier);

SnapSquare.backCenter = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "backCenter",  new Vertex2d(null),  'backCenter', 'teal');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, 0), hFunc(snapLoc, -.5)));
  snapLoc.wallThetaOffset(0);
  snapLoc.thetaOffset(180);
  snapLoc.at();
  return snapLoc;
}
SnapSquare.frontCenter = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "frontCenter",  new Vertex2d(null),  'frontCenter', 'blue');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, 0), () => hFunc(snapLoc, .5)));
  snapLoc.at();
  return snapLoc;
}
SnapSquare.leftCenter = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "leftCenter",  new Vertex2d(null),  'rightCenter', 'pink');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, -.5), hFunc(snapLoc, 0)));
  snapLoc.at();
  return snapLoc;
}
SnapSquare.rightCenter = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "rightCenter",  new Vertex2d(null),  'leftCenter', 'yellow');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, .5), hFunc(snapLoc, 0)));
  snapLoc.at();
  return snapLoc;
}

SnapSquare.backLeft = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "backLeft",  new Vertex2d(null),  'backRight', 'red');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, -.5), hFunc(snapLoc, -.5)));
  snapLoc.wallThetaOffset(-90);
  snapLoc.at();
  return snapLoc;
}
SnapSquare.backRight = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "backRight",  new Vertex2d(null),  'backLeft', 'purple');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, .5), hFunc(snapLoc, -.5)));
  snapLoc.wallThetaOffset(90);
  snapLoc.at();
  return snapLoc;
}

SnapSquare.frontRight = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "frontRight",  new Vertex2d(null),  'frontLeft', 'black');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, .5), hFunc(snapLoc, .5)));
  snapLoc.at();
  return snapLoc;
}
SnapSquare.frontLeft = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "frontLeft",  new Vertex2d(null),  'frontRight', 'green');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, -.5), hFunc(snapLoc, .5)));
  snapLoc.at();
  return snapLoc;
}

module.exports = SnapSquare;
