
const Snap2d = require('../snap');
const Square2d = require('../square');
const Polygon2d = require('../polygon');
const SnapLocation2d = require('../snap-location');
const Vertex2d = require('../vertex');
const Line2d = require('../line');

class SnapCorner extends Snap2d {
  constructor(parent, tolerance) {
    const polygon = new Polygon2d();
    // super(parent, new Square2d(parent.center), tolerance);
    super(parent, polygon, tolerance);
    if (parent === undefined) return this;
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

SnapCorner.diagonalRight = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "diagonalRight",  new Vertex2d(null),  'daginalLeft');
  snapLoc.locationFunction(fromToPoint(snapLoc, wf(snapLoc, -.5), hf(snapLoc, .5, {dol: -1})));
  snapLoc.wallThetaOffset(90);
  snapLoc.thetaOffset('SnapCorner', null, 180);
  snapLoc.thetaOffset('SnapCornerL', null, 180);
  snapLoc.at();
  return snapLoc;
}

SnapCorner.daginalLeft = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "daginalLeft",  new Vertex2d(null),  'diagonalRight');
  snapLoc.locationFunction(fromToPoint(snapLoc, wf(snapLoc, -.5, {dor: 1}), hf(snapLoc, .5)));
  snapLoc.wallThetaOffset(180);
  snapLoc.thetaOffset('SnapCorner', null, 180);
  snapLoc.thetaOffset('SnapCornerL', null, 180);
  snapLoc.at();
  return snapLoc;
}

SnapCorner.backRight = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "backRight",  new Vertex2d(null),  'backLeft');
  snapLoc.locationFunction(fromToPoint(snapLoc, wf(snapLoc, -.5), hf(snapLoc, -.5)));
  snapLoc.thetaOffset('SnapCorner', null, -90);
  snapLoc.thetaOffset('SnapCornerL', null, -90);
  snapLoc.thetaOffset('SnapSquare', null, 90);
  snapLoc.at();
  return snapLoc;
}

SnapCorner.frontRight = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "frontRight",  new Vertex2d(null),  'frontLeft');
  snapLoc.locationFunction(fromToPoint(snapLoc, wf(snapLoc, -.5, {dr: 1}), hf(snapLoc, -.5)));
  snapLoc.thetaOffset('SnapCorner', null, -90);
  snapLoc.thetaOffset('SnapCornerL', null, -90);
  snapLoc.thetaOffset('SnapSquare', null, 90);
  snapLoc.at();
  return snapLoc;
}

SnapCorner.backLeft = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "backLeft",  new Vertex2d(null),  'backRight');
  snapLoc.locationFunction(fromToPoint(snapLoc, wf(snapLoc, .5), hf(snapLoc, .5)));
  snapLoc.thetaOffset('SnapCorner', null, 90);
  snapLoc.thetaOffset('SnapCornerL', null, 90);
  snapLoc.thetaOffset('SnapSquare', null, 180);
  snapLoc.at();
  return snapLoc;
}

SnapCorner.frontLeft = (parent) => {
  const snapLoc = new SnapLocation2d(parent, "frontLeft",  new Vertex2d(null),  'frontRight');
  snapLoc.locationFunction(fromToPoint(snapLoc, wf(snapLoc,.5), hf(snapLoc, .5, {dl: -1})));
  snapLoc.thetaOffset('SnapCorner', null, 90);
  snapLoc.thetaOffset('SnapCornerL', null, 90);
  snapLoc.thetaOffset('SnapSquare', null, 180);
  snapLoc.at();
  return snapLoc;
}

module.exports = SnapCorner;
