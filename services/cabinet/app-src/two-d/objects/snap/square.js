
const Snap = require('../snap');
const Square2d = require('../square');
const SnapLocation2d = require('../snap-location');

class SnapSquare extends Snap {
  constructor(parent, tolerance) {
    super(parent, new Square2d(parent.center), tolerance);
    this.addLocation(SnapLocation2d.backCenter(this, true));
    this.addLocation(SnapLocation2d.leftCenter(this));
    this.addLocation(SnapLocation2d.rightCenter(this));
    this.addLocation(SnapLocation2d.backLeft(this, true));
    this.addLocation(SnapLocation2d.backRight(this, true));
    this.addLocation(SnapLocation2d.frontRight(this));
    this.addLocation(SnapLocation2d.frontLeft(this));
  }
}

module.exports = SnapSquare;
