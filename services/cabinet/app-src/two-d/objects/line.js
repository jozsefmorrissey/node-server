
const approximate = require('../../../../../public/js/utils/approximate.js');
const Vertex2d = require('./vertex');
const Circle2d = require('./circle');

class Line2d {
  constructor(startVertex, endVertex) {
    startVertex = new Vertex2d(startVertex);
    endVertex = new Vertex2d(endVertex);
    const measureTo = [];
    const instance = this;
    Object.getSet(this, {startVertex, endVertex});

    this.startVertex = (newVertex) => {
      if (newVertex instanceof Vertex2d) {
        startVertex = newVertex;
      }
      return startVertex;
    }
    this.endVertex = (newVertex) => {
      if (newVertex instanceof Vertex2d) {
        endVertex = newVertex;
      }
      return endVertex;
    }

    function changeLength(value) {
      const circle = new Circle2d(value, instance.startVertex());
      const points = circle.intersections(instance);
      const dist0 = instance.endVertex().distance(points[0]);
      const dist1 = instance.endVertex().distance(points[1]);
      if (dist1 < dist0) {
        instance.endVertex().point(points[1]);
      } else {
        instance.endVertex(points[0]);
      }
    }

    this.withinSegmentBounds = (point) => {
      point = new Vertex2d(point);
      return approximate.lteq(this.minX(), point.x(), 100) && approximate.lteq(this.minY(), point.y(), 100) &&
            approximate.gteq(this.maxX(), point.x(), 100) && approximate.gteq(this.maxY(), point.y(), 100);
    }


    function reconsileLength (newLength) {
      const moveVertex = instance.endVertex();
      const nextLine = moveVertex.nextLine()
      if (nextLine === undefined) changeLength(newLength);

      const vertex1 = nextLine.endVertex();
      const circle1 = new Circle2d(nextLine.length(), vertex1);
      const vertex2 = instance.startVertex();
      const circle2 = new Circle2d(newLength, vertex2);
      const intersections = circle1.intersections(circle2);

      const useFirst = (intersections.length !== 0 && intersections.length === 1) ||
                moveVertex.distance(intersections[0]) < moveVertex.distance(intersections[1]);
      if (intersections.length === 0) {
        changeLength(newLength);
      } else if (useFirst) {
        moveVertex.point(intersections[0]);
      } else {
        moveVertex.point(intersections[1]);
      }
    }

    this.length = (value) => {
      value = Number.parseFloat(value);
      if (!Number.isNaN(value)) {
        const sv = this.startVertex();
        const x = value * Math.cos(this.radians()) + sv.x();
        const y = value * Math.sin(this.radians()) + sv.y();
        this.endVertex().point({x,y});
      }
      const a = this.endVertex().x() - this.startVertex().x();
      const b = this.endVertex().y() - this.startVertex().y();
      return approximate(Math.sqrt(a*a + b*b), 1000000);
    }

    function getSlope(v1, v2) {
      const y1 = v1.y();
      const y2 = v2.y();
      const x1 = v1.x();
      const x2 = v2.x();
      return approximate((y2 - y1) / (x2 - x1));
    }

    function getB(x, y, slope) {
      if (slope === 0) return y;
      else if (Math.abs(slope) === Infinity) {
        if (this.startVertex().x() === 0) return 0;
        else return Infinity;
      }
      else return y - slope * x;
    }

    function newX(m1, m2, b1, b2) {
      return (b2 - b1) / (m1 - m2);
    }

    function getY(x, slope, b) {return slope*x + b}
    function getX(y, slope, b) {return  (y - b)/slope}

    this.midpoint = () => {
      const x = (this.endVertex().x() + this.startVertex().x())/2;
      const y = (this.endVertex().y() + this.startVertex().y())/2;
      return new Vertex2d({x,y});
    }

    this.closestEnds = (other) => {
      const tsv = this.startVertex();
      const osv = other.startVertex();
      const tev = this.endVertex();
      const oev = other.endVertex();

      const ss = tsv.distance(osv);
      const se = tsv.distance(oev);
      const ee = tev.distance(oev);
      const es = tev.distance(osv);

      if (ss <= se && ss <= ee && ss <= es) return [tsv, osv];
      if (se <= ee && se <= es) return [tsv, oev];
      if (ee <= es) return [tev, oev];
      else return [tev, osv]
    }

    // Always returns left side of intersection path
    this.thetaBetween = (other) => {
      if (!(other instanceof Line2d)) throw new Error('Cannot calculate thetaBetween if arg1 is not an instanceof Line2d');
      let theta;
      let theta1 = this.radians();
      let closestEnds = this.closestEnds(other);
      if (closestEnds.indexOf(this.startVertex()) !== -1) {
        theta1 += Math.PI;
      }
      let theta2 = other.radians();
      if (closestEnds.indexOf(other.startVertex()) !== -1) {
        theta2 += Math.PI;
      }

      if (theta1 > theta2) {
        theta = theta2 - theta1 + Math.PI * 2;
      } else {
        theta = theta2 - theta1;
      }
      return theta % (2 * Math.PI)
    }

    this.yIntercept = () => getB(this.startVertex().x(), this.startVertex().y(), this.slope());
    this.slope = () => getSlope(this.startVertex(), this.endVertex());
    this.y = (x) => {
      x ||= this.startVertex().x();
      const slope = this.slope();
      if (Math.abs(slope) === Infinity) return Infinity;
      if (slope === 0) return this.startVertex().y();
      return  (this.slope()*x + this.yIntercept());
    }

    this.x = (y) => {
      y ||= this.startVertex().y();
      const slope = this.slope();
      if (Math.abs(slope) === Infinity) return this.startVertex().x();
      if (slope === 0) {
        if (this.yIntercept() === 0) return 0;
        else return Infinity;
      }
      return (y - this.yIntercept())/slope;
    }

    //TODO: fix!!!!
    this.liesOn = (vertices) => {
      const liesOn = [];
      for (let index = 0; index < vertices.length; index += 1) {
        const v = vertices[index];
        const y = this.y(v.x());
        if ((y === v.y() || Math.abs(y) === Infinity) && this.withinSegmentBounds(v)) {
          liesOn.push(v);
        }
      }
      liesOn.sort(Vertex2d.sort);
      return liesOn;
    }

    this.isOn = (vertex) => {
      const y = this.y(vertex.x());
      return (y === vertex.y() || Math.abs(y) === Infinity) && this.withinSegmentBounds(vertex);
    }

    this.measureTo = (verts) => {
      if (Array.isArray(verts)) {
        verts = this.liesOn(verts);
        measureTo.concatInPlace(verts);
      }
      return measureTo;
    }

    this.maxDem = () => this.y() > this.x() ? this.y() : this.x();
    this.minDem = () => this.y() < this.x() ? this.y() : this.x();

    this.closestPointOnLine = (vertex, segment) => {
      vertex = (vertex instanceof Vertex2d) ? vertex : new Vertex2d(vertex);
      const perpLine = this.perpendicular(undefined, vertex, true);
      const perpSlope = perpLine.slope();
      const slope = this.slope();
      let x, y;
      if (!Number.isFinite(slope)) {
        x = this.startVertex().x();
        y = vertex.y();
      } else if (!Number.isFinite(perpSlope)) {
        x = vertex.x();
        y = this.startVertex().y();
      } else {
        x = newX(slope, perpSlope, this.yIntercept(), perpLine.yIntercept());
        y = this.y(x);
      }
      const closestPoint = new Vertex2d({x, y});
      if (!segment || this.withinSegmentBounds(closestPoint)) return closestPoint;
      return false;
    }

    this.inverseX = (y) => this.slope()*y + this.yIntercept();
    this.inverseY = (x) => (x-this.yIntercept())/this.slope();
    this.perpendicular = (distance, vertex, center) => {
      distance ||= this.length();
      const rotated = this.copy().rotate(Math.PI12);
      const mp = vertex || rotated.midpoint();
      if (center) {
        distance = Math.abs(distance);
        const left = Line2d.startAndTheta(mp, rotated.negitive().radians(), distance/2);
        const right = Line2d.startAndTheta(mp, rotated.radians(), distance/2);
        return right.combine(left);
      }
      return Line2d.startAndTheta(mp, rotated.radians(), distance);
    }

    this.rotate = (radians, pivot) => {
      pivot ||= this.midpoint();

      const sv = this.startVertex();
      const spl = new Line2d(pivot, sv);
      const sRadOffset = radians + spl.radians();
      const sfl = Line2d.startAndTheta(pivot, sRadOffset, spl.length());
      sv.point(sfl.endVertex());

      const ev = this.endVertex();
      const epl = new Line2d(pivot, ev);
      const eRadOffset = radians + epl.radians();
      const efl = Line2d.startAndTheta(pivot, eRadOffset, epl.length());
      ev.point(efl.endVertex());
      return this;
    }

    this.findIntersection = (line, segment) => {
      if (this.slope() === 0 && line.slope() === 0) {
        if (this.yIntercept() === line.yIntercept()) return Infinity;
        return false;
      }
      if (this.slope() === 0) return line.findIntersection(this, segment);
      if (approximate.eq(line.radians(), this.radians(), 10000)) {
        return Vertex2d.center(line.startVertex(), this.startVertex(), line.endVertex(), this.endVertex());
      }
      const slope = this.slope();
      const lineSlope = line.slope();
      let x, y;
      if (!Number.isFinite(slope)) {
        x = this.startVertex().x();
        y = line.y(x);
      } else if (!Number.isFinite(lineSlope)) {
        x = line.startVertex().x();
        y = this.y(x);
      } else {
        x = newX(slope, lineSlope, this.yIntercept(), line.yIntercept());
        y = this.y(x);
      }
      const intersection = {x,y};
      if (segment !== true) return new Vertex2d(intersection);
      if (this.withinSegmentBounds(intersection) && line.withinSegmentBounds(intersection)) {
        return new Vertex2d(intersection);
      }
      return false;
    }
    this.minX = () => this.startVertex().x() < this.endVertex().x() ?
                        this.startVertex().x() : this.endVertex().x();
    this.minY = () => this.startVertex().y() < this.endVertex().y() ?
                        this.startVertex().y() : this.endVertex().y();
    this.maxX = () => this.startVertex().x() > this.endVertex().x() ?
                        this.startVertex().x() : this.endVertex().x();
    this.maxY = () => this.startVertex().y() > this.endVertex().y() ?
                        this.startVertex().y() : this.endVertex().y();
    this.angle = () => {
      return Math.toDegrees(this.radians());
    }
    this.radians = () => {
      const deltaX = this.endVertex().x() - this.startVertex().x();
      const deltaY = this.endVertex().y() - this.startVertex().y();
      return Math.atan2(deltaY, deltaX);
    }

    // Positive returns right side.
    this.parrelle = (distance, midpoint, length) => {
      if (distance === 0) return this.copy();
      if ((typeof distance) !== 'number') throw new Error('distance (arg1) must be of type number && a non-zero value');
      length ||= this.length();
      midpoint ||= this.midpoint();
      const perpLine = this.perpendicular(distance * 2, midpoint, true);
      let targetPoint = perpLine.startVertex();
      if (distance < 0) targetPoint = perpLine.endVertex();
      const radians = this.radians();
      const halfLine1 = Line2d.startAndTheta(targetPoint, radians, length/2);
      const halfLine2 = Line2d.startAndTheta(targetPoint, radians, length/-2);
      const parrelle = halfLine1.combine(halfLine2);
      return Math.abs(parrelle.radians() - this.radians()) < Math.PI12 ? parrelle : parrelle.negitive();
    }

    this.isParrelle = (other) => {
      const posRads = Math.mod(this.radians(), 2*Math.PI);
      const negRads = Math.mod(this.radians() + Math.PI, 2*Math.PI);
      const otherRads = Math.mod(other.radians(), 2*Math.PI);
      return approximate.eq(posRads, otherRads, 10000) ||
              approximate.eq(negRads, otherRads, 10000);
    }

    this.equals = (other) => {
      if (other === this) return true;
      if (this.toString() === other.toString()) return true;
      if (this.toString() === other.toNegitiveString()) return true;
      return false;
    }


    this.clean = (other) => {
      if (!(other instanceof Line2d)) return;
      if (other.startVertex().equal(other.endVertex())) return this;
      if (this.startVertex().equal(this.endVertex())) return other;
      if (this.toString() === other.toString() || this.toString() === other.toNegitiveString()) return this;
    }

    this.copy = () => new Line2d(this.startVertex().copy(), this.endVertex().copy());

    this.combine = (other) => {
      if (!(other instanceof Line2d)) return;
      const clean = this.clean(other);
      if (clean) return clean;
      if (approximate.neqAbs(this.slope(), other.slope(), 1000)) return;
      const otherNeg = other.negitive();
      const posEq = approximate.eq(this.y(other.x()), other.y(), 1000) &&
                    approximate.eq(this.x(other.y()), other.x(), 1000);
      const negEq = approximate.eq(this.y(otherNeg.x()), otherNeg.y(), 1000) &&
                    approximate.eq(this.x(otherNeg.y()), otherNeg.x(), 1000);
      if (!posEq && !negEq) return;
      const v1 = this.startVertex();
      const v2 = this.endVertex();
      const ov1 = other.startVertex();
      const ov2 = other.endVertex();
      if (!this.withinSegmentBounds(ov1) && !this.withinSegmentBounds(ov2)) return;
      const vs = [v1, v2, ov1, ov2].sort(Vertex2d.sort);
      const combined = new Line2d(vs[0], vs[vs.length - 1]);
      return approximate.eq(this.radians(), combined.radians(), 1000) ? combined : combined.negitive();
    }

    this.trimmed = (distance, both) => {
      if ((typeof distance) !== 'number' || distance === 0) throw new Error('distance (arg1) must be of type number && a non-zero value');
      const trimBack = distance < 0;
      distance = Math.abs(distance);
      const halfLen = this.length() / 2;
      const halfNewLen = halfLen - distance;
      const midPoint = this.midpoint();
      const frontRads = this.radians();
      const backRads = frontRads + Math.PI;
      let xOffsetFront, yOffsetFront, xOffsetBack, yOffsetBack;
      if (both) {
        xOffsetFront = halfNewLen * Math.cos(frontRads);
        yOffsetFront = halfNewLen * Math.sin(frontRads);
        xOffsetBack = halfNewLen * Math.cos(backRads);
        yOffsetBack = halfNewLen * Math.sin(backRads);
      } else if (trimBack) {
        xOffsetFront = halfLen * Math.cos(frontRads);
        yOffsetFront = halfLen * Math.sin(frontRads);
        xOffsetBack = halfNewLen * Math.cos(backRads);
        yOffsetBack = halfNewLen * Math.sin(backRads);
      } else {
        xOffsetFront = halfNewLen * Math.cos(frontRads);
        yOffsetFront = halfNewLen * Math.sin(frontRads);
        xOffsetBack = halfLen * Math.cos(backRads);
        yOffsetBack = halfLen * Math.sin(backRads);
      }
      const sv = this.startVertex();
      const ev = this.endVertex();
      const startVertex = {x: midPoint.x() - xOffsetBack, y: midPoint.y() - yOffsetBack};
      const endVertex = {x: midPoint.x() - xOffsetFront, y: midPoint.y() - yOffsetFront};
      const line = new Line2d(startVertex, endVertex);
      return approximate.eq(line.radians(), this.radians()) ? line : line.negitive();
    }

    this.move = (center) => {
      const mouseLocation = new Vertex2d(center);
      const perpLine = this.perpendicular(undefined, mouseLocation);
      const interX = this.findIntersection(perpLine);
      const diffLine = new Line2d(interX, mouseLocation);
      const rads = diffLine.radians();
      const xDiff = Math.cos(rads);
      const yDiff = Math.sin(rads);
      const sv = this.startVertex();
      const newStart = {x: sv.x() + xDiff, y: sv.y() + yDiff};
      const ev = this.endVertex();
      const newEnd = {x: ev.x() + xDiff, y: ev.y() + yDiff};
      this.startVertex().point().x = newStart.x;
      this.startVertex().point().y = newStart.y;
      this.endVertex().point().x = newEnd.x;
      this.endVertex().point().y = newEnd.y;
    };

    this.negitive = () => new Line2d(this.endVertex(), this.startVertex());
    this.toString = () => `${this.startVertex().toString()} => ${this.endVertex().toString()}`;
    this.toNegitiveString = () => `${this.endVertex().toString()} => ${this.startVertex().toString()}`;
  }
}
Line2d.reusable = true;
Line2d.startAndTheta = (startVertex, theta, dist) => {
  dist ||= 100;
  startVertex = new Vertex2d(startVertex);
  const end = {
    x: startVertex.x() + dist * Math.cos(theta),
    y: startVertex.y() +dist*Math.sin(theta)
  };
  return new Line2d(startVertex.point(), end);
}
Line2d.instance = (startV, endV, group) => {
  const line = Lookup.instance(Line2d.name);
  line.lookupGroup(group);
  line.startVertex(new Vertex2d(startV)).lookupGroup(group);
  line.endVertex(new Vertex2d(endV)).lookupGroup(group);
  return line;
}

Line2d.trendLine = (...points) => {
  const center = Vertex2d.center(...points);
  let maxArr = [];
  for (let index = 0; index < points.length; index += 1) {
    const obj = {};
    obj.point = new Vertex2d(points[index]);
    obj.distance = obj.point.distance(center);
    if (maxArr[0] === undefined || maxArr[0].distance < obj.distance) {
      maxArr = [obj].concat(maxArr);
    } else if (maxArr[1] === undefined || maxArr[1].distance < obj.distance) {
      maxArr = [maxArr[0], obj].concat(maxArr);
    }
  }
  const line = new Line2d(maxArr[0].point, maxArr[1].point);
  console.log(`trendLine: ${points}\n\t${line}\n\t${center}` );
  return line;
}

Line2d.vertices = (lines) => {
  const verts = {};
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const sv = line.startVertex();
    const ev = line.endVertex();
    verts[sv.toString()] = sv;
    verts[ev.toString()] = ev;
  }
  return Object.values(verts);
}

Line2d.consolidate = (...lines) => {
  const lineMap = {};
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const slope = Math.abs(line.slope());
    if (!Number.isNaN(slope)) {
      if (lineMap[slope] === undefined) lineMap[slope] = [];
      lineMap[slope].push(line);
    }
  }
  const keys = Object.keys(lineMap);
  let minList = [];
  for (let lIndex = 0; lIndex < keys.length; lIndex += 1) {
    const list = lineMap[keys[lIndex]];
    for (let tIndex = 0; tIndex < list.length; tIndex += 1) {
      let target = list[tIndex];
      for (let index = 0; index < list.length; index += 1) {
        if (index !== tIndex) {
          const combined = target.combine(list[index]);
          if (combined) {
            const lowIndex = index < tIndex ? index : tIndex;
            const highIndex = index > tIndex ? index : tIndex;
            list.splice(highIndex, 1);
            list[lowIndex] = combined;
            target = combined;
            tIndex--;
            break;
          }
        }
      }
    }
    minList = minList.concat(lineMap[keys[lIndex]]);
  }

  return minList;
}

new Line2d();

module.exports = Line2d;
