
const Snap = require('../snap');
const Square2d = require('../square');
const Polygon2d = require('../polygon');
const SnapLocation2d = require('../snap-location');

class SnapSquare extends Snap {
  constructor(parent, tolerance) {
    const polygon = new Polygon2d();
    // super(parent, new Square2d(parent.center), tolerance);
    super(parent, polygon, tolerance);
    this.addLocation(SnapLocation2d.backLeft(this, true));
    this.addLocation(SnapLocation2d.backCenter(this, true));
    this.addLocation(SnapLocation2d.backRight(this, true));
    this.addLocation(SnapLocation2d.rightCenter(this));
    this.addLocation(SnapLocation2d.frontRight(this));
    this.addLocation(SnapLocation2d.frontLeft(this));
    this.addLocation(SnapLocation2d.leftCenter(this));
    const verticies = this.snapLocations().map((snap) =>
      snap.vertex());
    polygon.addVerticies(verticies);
  }
}

module.exports = SnapSquare;
