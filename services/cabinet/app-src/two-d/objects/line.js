
const approximate = require('../../../../../public/js/utils/approximate.js');
const Vertex2d = require('./vertex');
const Circle2d = require('./circle');

class Line2d {
  constructor(startVertex, endVertex) {
    startVertex = new Vertex2d(startVertex);
    endVertex = new Vertex2d(endVertex);
    const instance = this;

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
      return approximate.lteq(this.minX(), point.x()) && approximate.lteq(this.minY(), point.y()) &&
            approximate.gteq(this.maxX(), point.x()) && approximate.gteq(this.maxY(), point.y());
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
      if (Number.isNaN(value)) {
        const a = this.endVertex().x() - this.startVertex().x();
        const b = this.endVertex().y() - this.startVertex().y();
        return Math.sqrt(a*a + b*b);
      } else {
        reconsileLength(value);
        return value;
      }
    }

    function getSlope(v1, v2) {
      const y1 = v1.y();
      const y2 = v2.y();
      const x1 = v1.x();
      const x2 = v2.x();
      return approximate(y2 - y1) / approximate(x2 - x1);
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

    this.maxDem = () => this.y() > this.x() ? this.y() : this.x();
    this.minDem = () => this.y() < this.x() ? this.y() : this.x();

    this.closestPointOnLine = (vertex, segment) => {
      vertex = (vertex instanceof Vertex2d) ? vertex : new Vertex2d(vertex);
      const perpLine = this.perpendicular(vertex);
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
    this.perpendicular = (vertex, distance) => {
      vertex = new Vertex2d(vertex) || this.midpoint();
      const posOffset = distance !== undefined ? distance/2 : 1000;
      const negOffset = -1 * posOffset;
      const slope = this.slope();
      if (slope === 0) {
        return new Line2d({x: vertex.x(), y: vertex.y() + posOffset}, {x: vertex.x(), y: vertex.y() + negOffset});
      }
      if (Math.abs(slope) === Infinity || Number.isNaN(slope)) {
        return new Line2d({x: posOffset + vertex.x(), y: vertex.y()}, {x: negOffset + vertex.x(), y: vertex.y()});
      }

      const slopeInverse = -1/slope;
      const b = getB(vertex.x(), vertex.y(), slopeInverse);
      const startVertex = {x: getX(posOffset, slopeInverse, b), y: posOffset};
      const endVertex = {x: getX(negOffset, slopeInverse, b), y: negOffset};
      const line = new Line2d(startVertex, endVertex);
      return line;
    }
    this.findIntersection = (line, segment) => {
      const slope = this.slope();
      const lineSlope = line.slope();
      let x, y;
      if (!Number.isFinite(slope)) {
        x = this.startVertex().x();
        y = line.y(x);
      } else if (!Number.isFinite(lineSlope)) {
        y = line.startVertex().y();
        x = line.x(y);
      } else {
        x = newX(slope, lineSlope, this.yIntercept(), line.yIntercept());
        y = this.y(x);
      }
      const intersection = {x,y};
      if (segment !== true) return intersection;
      if (this.withinSegmentBounds(intersection) && line.withinSegmentBounds(intersection)) {
        return intersection;
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
    this.angle = (value) => {
      if (value) this.radians(value);
      return Math.toDegrees(this.radians());
    }
    this.radians = () => {
      const deltaX = this.endVertex().x() - this.startVertex().x();
      const deltaY = this.endVertex().y() - this.startVertex().y();
      return approximate(Math.atan2(deltaY, deltaX));
    }

    this.clean = (other) => {
      if (!(other instanceof Line2d)) return;
      if (other.startVertex().equal(other.endVertex())) return this;
      if (this.startVertex().equal(this.endVertex())) return other;
      if (this.toString() === other.toString() || this.toString() === other.toNegitiveString()) return this;
    }

    this.combine = (other) => {
      if (!(other instanceof Line2d)) return;
      const clean = this.clean(other);
      if (clean) return clean;
      if (Math.abs(this.slope()) !== Math.abs(other.slope())) return;
      const otherNeg = other.negitive();
      const posEq = (this.y(other.x()) === other.y() && this.x(other.y()) === other.x());
      const negEq = (this.y(otherNeg.x()) === otherNeg.y() && this.x(otherNeg.y()) === otherNeg.x());
      if (!posEq && !negEq) return;
      const v1 = this.startVertex();
      const v2 = this.endVertex();
      const ov1 = other.startVertex();
      const ov2 = other.endVertex();
      if (!this.withinSegmentBounds(ov1) && !this.withinSegmentBounds(ov2)) return;
      const vs = [v1, v2, ov1, ov2].sort(Vertex2d.sort);
      const combined = new Line2d(vs[0], vs[vs.length - 1]);
      return combined;
    }

    this.move = (center) => {
      const mouseLocation = new Vertex2d(center);
      const perpLine = this.perpendicular(mouseLocation);
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
Line2d.startAndTheta = (startvertex, theta) => {
  const end = {x: dist * Math.cos(theta), y: dist*Math.sin(theta)};
  return new Line(startVertex.point(), end);
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
      for (let index = 1 + tIndex; index < list.length; index += 1) {
        const combined = target.combine(list[index]);
        if (combined) {
          list.splice(index, 1);
          list[tIndex] = combined;
          target = combined;
          index--;
        }
      }
    }
    minList = minList.concat(lineMap[keys[lIndex]]);
  }

  return minList;
}

new Line2d();

module.exports = Line2d;
