const Snap2d = require('../snap');
const Square2d = require('../square');
const Polygon2d = require('../polygon');
const SnapLocation2d = require('../snap-location');
const Vertex2d = require('../vertex');

class SnapSquare extends Snap2d {
  constructor(parent, tolerance) {
    const polygon = new Polygon2d();
    polygon.getTextInfo = () => ({
      text: this.parent().name(),
      center: this.object().center(),
      radians: this.radians(),
      x: 0,
      y: this.height() / 4,
      maxWidth: this.width(),
      limit: 10
    });
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
    const vertices = this.snapLocations().map((snap) =>
      snap.vertex());
    polygon.addVertices(vertices);
  }
}

const fromToPoint = SnapLocation2d.fromToPoint;
const wFunc = (snapLoc, multiplier) => SnapLocation2d.locationFunction(snapLoc, 'width', multiplier);
const hFunc = (snapLoc, multiplier) => SnapLocation2d.locationFunction(snapLoc, 'height', multiplier);

SnapSquare.backCenter = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "backCenter",  new Vertex2d(null),  'backCenter');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, 0), hFunc(snapLoc, -.5)));
  snapLoc.wallThetaOffset(0);
  snapLoc.thetaOffset(null, null, 180);
  snapLoc.at();
  return snapLoc;
}
SnapSquare.frontCenter = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "frontCenter",  new Vertex2d(null),  'frontCenter');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, 0), () => hFunc(snapLoc, .5)));
  snapLoc.at();
  return snapLoc;
}
SnapSquare.leftCenter = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "leftCenter",  new Vertex2d(null),  'rightCenter');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, -.5), hFunc(snapLoc, 0)));
  snapLoc.at();
  return snapLoc;
}
SnapSquare.rightCenter = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "rightCenter",  new Vertex2d(null),  'leftCenter');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, .5), hFunc(snapLoc, 0)));
  snapLoc.at();
  return snapLoc;
}

SnapSquare.backLeft = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "backLeft",  new Vertex2d(null),  'backRight');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, -.5), hFunc(snapLoc, -.5)));
  snapLoc.wallThetaOffset(-90);
  snapLoc.thetaOffset('SnapCorner', null, 270);
  snapLoc.thetaOffset('SnapCornerL', null, 270);
  snapLoc.at();
  return snapLoc;
}
SnapSquare.backRight = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "backRight",  new Vertex2d(null),  'backLeft');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, .5), hFunc(snapLoc, -.5)));
  snapLoc.wallThetaOffset(90);
  snapLoc.thetaOffset('SnapCorner', null, 180);
  snapLoc.thetaOffset('SnapCornerL', null, 180);
  snapLoc.at();
  return snapLoc;
}

SnapSquare.frontRight = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "frontRight",  new Vertex2d(null),  'frontLeft');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, .5), hFunc(snapLoc, .5)));
  snapLoc.thetaOffset('SnapCorner', null, 180);
  snapLoc.thetaOffset('SnapCornerL', null, 180);
  snapLoc.at();
  return snapLoc;
}
SnapSquare.frontLeft = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "frontLeft",  new Vertex2d(null),  'frontRight');
  snapLoc.locationFunction(fromToPoint(snapLoc, wFunc(snapLoc, -.5), hFunc(snapLoc, .5)));
  snapLoc.thetaOffset('SnapCorner', null, 270);
  snapLoc.thetaOffset('SnapCornerL', null, 270);
  snapLoc.at();
  return snapLoc;
}

module.exports = SnapSquare;
