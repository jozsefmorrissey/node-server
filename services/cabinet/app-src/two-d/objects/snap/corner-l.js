
const Snap2d = require('../snap');
const SnapCorner = require('../snap/corner');
const Square2d = require('../square');
const Polygon2d = require('../polygon');
const SnapLocation2d = require('../snap-location');
const Vertex2d = require('../vertex');

class SnapCornerL extends Snap2d {
  constructor(parent, tolerance) {
    const polygon = new Polygon2d();
    super(parent, polygon, tolerance);
    polygon.getTextInfo = () => {
      const fwr = (this.height() - this.dl());
      const fwl = (this.width() - this.dr());
      const areaL = this.dl() * fwr;
      const areaR = this.dr() * fwl;
      const center = polygon.center();
      const info = {
        text: this.parent().name(),
        center: polygon.center(),
        maxWidth: this.width(),
        limit: 4
      };

      if (areaR > areaL) {
        // Dont know why radians cause the x and y axis to flip.... its not supposed to, check draw function
        info.x = this.height()/2 - fwr/2;
        info.y = this.width()/-2 + this.dr();
        info.maxWidth = fwr*.75;
        info.radians = Math.toRadians(-90) + this.radians();
      } else {
        info.x = this.width()/2 + -1 * (this.dr() + fwl/2);
        info.y = this.height()/-2 + 3 * this.dl() / 4;
        info.maxWidth = fwl;
        info.radians = Math.toRadians(180) + this.radians();
      }
      return info;
    }
    if (parent === undefined) return this;

    this.addLocation(SnapCorner.backRight(this));
    this.addLocation(SnapCorner.frontRight(this));
    this.addLocation(SnapCornerL.frontCenter(this));
    this.addLocation(SnapCorner.frontLeft(this));
    this.addLocation(SnapCorner.backLeft(this));

    this.addLocation(SnapCorner.daginalLeft(this));
    this.addLocation(SnapCorner.diagonalRight(this));
    const vertices = this.snapLocations().map((snap) =>
      snap.vertex());
    polygon.addVertices(vertices);
  }
}

const f = SnapLocation2d.locationFunction;
const fromToPoint = SnapLocation2d.fromToPoint;
const wf = (snapLoc, attrM, props) => f(snapLoc, 'width', attrM, props);
const hf = (snapLoc, attrM, props) => f(snapLoc, 'height', attrM, props);

SnapCornerL.frontCenter = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "frontCenter",  new Vertex2d(null),  null);
  snapLoc.locationFunction(fromToPoint(snapLoc, wf(snapLoc, -.5, {dr: 1}), hf(snapLoc, .5, {dl: -1})));
  snapLoc.at();
  return snapLoc;
}

module.exports = SnapCornerL;
