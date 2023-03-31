
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line');

class Corner2d extends Vertex2d {
  constructor(layout, point) {
    if (point instanceof Vertex2d) {
      point = point.point();
    }
    super(point);
    Lookup.convert(this);
    let angleLock = false;
    let angleInc = 22.5;
    let lengthInc = 2.54;
    const instance = this;

    this.nextWall = () => layout.nextWall(this, 1);
    this.prevWall = () => layout.prevWall(this, -1);
    this.angleLock = (on) => {
      if (on === true || on === false) angleLock = on;
      return angleLock;
    }
    this.isFree = () => layout.isFreeCorner(this);
    this.angleInc = (increment) => {
      if (increment > .01 && increment <= 45) angleInc = on;
      return angleLock;
    }
    this.lengthInc = (increment) => {
      if (increment > .01 && increment < 10) angleInc = on;
      return angleLock;
    }
    this.angle = (degrees) => {
      const currDeg = (this.nextWall().degrees() - this.prevWall().degrees() + 360) % 360;
      if (Number.isFinite(degrees)) {
        const offset = Math.toRadians((degrees - currDeg)/2);

        const prev = this.prevWall();
        const newPrev = Line2d.startAndTheta(this, prev.negitive().radians() - offset);
        const prevStartVert = newPrev.findIntersection(prev.startVertex().prevWall());
        prev.startVertex().point(prevStartVert);

        const next = this.nextWall();
        const newNext = Line2d.startAndTheta(this, next.radians() + offset);
        const nextEndVert = newNext.findIntersection(next.endVertex().nextWall());
        next.endVertex().point(nextEndVert);
        angleLock = true;
      }
      return Math.round(currDeg * 10) / 10;
    }

    const angleDist = (angle1, angle2) => {
      angle1 = angle1 % 360;
      angle2 = angle2 % 360;
      const dist1 = Math.abs(angle1 - angle2);
      const dist2 = Math.abs(angle1 - 360 - angle2);
      return dist1 < dist2 ? dist1 : dist2;
    }
    const cleanAngle = (degrees) => {
      let offset = degrees%angleInc;
      offset = offset > angleInc/2 ? angleInc - offset : -1*offset;
      return (degrees + offset) % 360
    }

    function determineAngle(prevWall, currAngle) {
      const angle = currAngle === undefined ? prevWall.angle() : currAngle;
      const currRads = Math.toRadians(angle);

      const smallerAngle = cleanAngle(angle - angleInc);
      const adjustedAngle = cleanAngle(angle);
      const biggerAngle = cleanAngle(angle + angleInc);
      const smDist = angleDist(angle, smallerAngle);
      const adjDist = angleDist(angle, adjustedAngle);
      const bigDist = angleDist(angle, biggerAngle);
      const chooseAdj =  adjDist < smDist && adjDist < bigDist;
      const newAngle = chooseAdj ? adjustedAngle : (smDist < bigDist ? smallerAngle : biggerAngle);
      return newAngle;
    }

    this.straightenUp = () => {
      const corners = layout.vertices();
      let freeCount = 0;
      let currAngle;
      let currLength;
      for (let index = 0; freeCount < 2 && index < corners.length*2; index++) {
        const corner = corners[index % corners.length];
        const prevWall = corner.prevWall();
        if (freeCount > 0 && !corner.isFree()) {
          const length = currLength === undefined ? prevWall.length() : currLength;
          const newAngle = determineAngle(prevWall, currAngle);
          const rads = Math.toRadians(newAngle);
          const newLine = Line2d.startAndTheta(prevWall.startVertex(), rads, length);
          const newEndPoint = newLine.endVertex();
          const before = corner.angle();
          currAngle = corner.nextWall().angle();
          currLength = corner.nextWall().length();
          prevWall.endVertex().point(newEndPoint);
        } else if (corner.isFree()) {
          freeCount++;
        }
      }
    }

    const toRads = (degrees) => Math.toRadians(degrees - degrees%angleInc)

    this.bisector = (dist) => this.prevWall().bisector(this.nextWall(), dist);
  }
}

Corner2d.fromJson = (json) => {
  return new Corner2d(json.layout, json.point);
}

module.exports = Corner2d;
