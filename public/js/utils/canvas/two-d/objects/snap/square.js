const Snap2d = require('../snap');
const Square2d = require('../square');
const Polygon2d = require('../polygon');
const SnapLocation2d = require('../snap-location');
const Vertex2d = require('../vertex');

class SnapSquare extends Snap2d {
  constructor(parent, tolerance) {
    const polygon = new Polygon2d();
    const orig = polygon;
    polygon.getTextInfo = () => ({
      text: this.parent().name() || 'kazzooi',
      center: this.center(),
      radians: this.radians(),
      x: this.x(),
      y: this.y() / 4,
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
    const vertices = this.snapLocations().map((snap) => snap.center());
    polygon.addVertices(vertices);

    this.center = (cent) => {
      return polygon.center(parent.center(cent));
    }
  }
}

const fromToPoint = SnapLocation2d.fromToPoint;
const wFunc = (snapLoc, multiplier) => SnapLocation2d.locationFunction(snapLoc, 'width', multiplier);
const hFunc = (snapLoc, multiplier) => SnapLocation2d.locationFunction(snapLoc, 'height', multiplier);

SnapSquare.backCenter = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "backCenter");
  snapLoc.centerFunction(fromToPoint(snapLoc, wFunc(snapLoc, 0), hFunc(snapLoc, -.5)));
  return snapLoc;
}
SnapSquare.frontCenter = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "frontCenter");
  snapLoc.centerFunction(fromToPoint(snapLoc, wFunc(snapLoc, 0), () => hFunc(snapLoc, .5)));
  return snapLoc;
}
SnapSquare.leftCenter = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "leftCenter");
  snapLoc.centerFunction(fromToPoint(snapLoc, wFunc(snapLoc, -.5), hFunc(snapLoc, 0)));
  return snapLoc;
}
SnapSquare.rightCenter = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "rightCenter");
  snapLoc.centerFunction(fromToPoint(snapLoc, wFunc(snapLoc, .5), hFunc(snapLoc, 0)));
  return snapLoc;
}

SnapSquare.backLeft = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "backLeft");
  snapLoc.centerFunction(fromToPoint(snapLoc, wFunc(snapLoc, -.5), hFunc(snapLoc, -.5)));
  return snapLoc;
}
SnapSquare.backRight = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "backRight");
  snapLoc.centerFunction(fromToPoint(snapLoc, wFunc(snapLoc, .5), hFunc(snapLoc, -.5)));
  return snapLoc;
}

SnapSquare.frontRight = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "frontRight");
  snapLoc.centerFunction(fromToPoint(snapLoc, wFunc(snapLoc, .5), hFunc(snapLoc, .5)));
  return snapLoc;
}
SnapSquare.frontLeft = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "frontLeft");
  snapLoc.centerFunction(fromToPoint(snapLoc, wFunc(snapLoc, -.5), hFunc(snapLoc, .5)));
  return snapLoc;
}

module.exports = SnapSquare;
