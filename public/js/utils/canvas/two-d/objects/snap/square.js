const SnapPolygon = require('./polygon');
const Square2d = require('../square');
const Polygon2d = require('../polygon');
const SnapLocation2d = require('../snap-location');
const Vertex2d = require('../vertex');

// TODO: use SnapPolygon to build snap object....
class SnapSquare extends SnapPolygon {
  constructor(parent, tolerance) {
    const polygon = new Polygon2d();
    super(parent, polygon, tolerance);
    if (parent === undefined) return this;


    this.addLocation(SnapSquare.rightCenter(this));
    this.addLocation(SnapSquare.backRight(this));
    this.addLocation(SnapSquare.backCenter(this));
    this.addLocation(SnapSquare.backLeft(this));
    this.addLocation(SnapSquare.leftCenter(this));

    this.addLocation(SnapSquare.frontLeft(this));
    this.addLocation(SnapSquare.frontRight(this));

    polygon.addVertices(this.snapLocations.corners().map(s => s.center().clone()));

    this.object = () => {
      polygon.center(this.center());
      const rotated = polygon.rotate(parent.radians(), null, true);
      return rotated;
    }
  }
}

const fromToPoint = SnapLocation2d.fromToPoint;
const wFunc = (snapLoc, multiplier) => SnapLocation2d.locationFunction(snapLoc, 'width', multiplier);
const hFunc = (snapLoc, multiplier) => SnapLocation2d.locationFunction(snapLoc, 'height', multiplier);

SnapSquare.backCenter = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "backcenter");
  snapLoc.centerFunction(fromToPoint(snapLoc, wFunc(snapLoc, 0), hFunc(snapLoc, -.5)));
  return snapLoc;
}
// SnapSquare.frontCenter = (parent) => {
//   const snapLoc = new SnapLocation2d(parent, "frontcenter");
//   snapLoc.centerFunction(fromToPoint(snapLoc, wFunc(snapLoc, 0), () => hFunc(snapLoc, -.5)));
//   return snapLoc;
// }
SnapSquare.leftCenter = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "leftcenter");
  snapLoc.centerFunction(fromToPoint(snapLoc, wFunc(snapLoc, -.5), hFunc(snapLoc, 0)));
  return snapLoc;
}
SnapSquare.rightCenter = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "rightcenter");
  snapLoc.centerFunction(fromToPoint(snapLoc, wFunc(snapLoc, .5), hFunc(snapLoc, 0)));
  return snapLoc;
}

SnapSquare.backLeft = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "backleft");
  snapLoc.centerFunction(fromToPoint(snapLoc, wFunc(snapLoc, -.5), hFunc(snapLoc, -.5)));
  return snapLoc;
}
SnapSquare.backRight = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "backright");
  snapLoc.centerFunction(fromToPoint(snapLoc, wFunc(snapLoc, .5), hFunc(snapLoc, -.5)));
  return snapLoc;
}

SnapSquare.frontRight = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "right");
  snapLoc.centerFunction(fromToPoint(snapLoc, wFunc(snapLoc, .5), hFunc(snapLoc, .5)));
  return snapLoc;
}
SnapSquare.frontLeft = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "left");
  snapLoc.centerFunction(fromToPoint(snapLoc, wFunc(snapLoc, -.5), hFunc(snapLoc, .5)));
  return snapLoc;
}

module.exports = SnapSquare;
