
const Vertex2D = require('vertex');
const Circle2D = require('circle');
const LineMeasurement2D = require('line-measurement');

class Line2D  extends Lookup {
  constructor(startVertex, endVertex) {
    super();
    startVertex = Vertex2D.instance(startVertex);
    endVertex = Vertex2D.instance(endVertex);
    const instance = this;

    this.startVertex = (newVertex) => {
      if (newVertex instanceof Vertex2D) {
        startVertex = newVertex;
        startVertex.nextLine(this);
      }
      return startVertex;
    }
    this.endVertex = (newVertex) => {
      if (newVertex instanceof Vertex2D) {
        endVertex = newVertex;
        endVertex.prevLine(this);
      }
      return endVertex;
    }

    function changeLength(value) {
      const circle = new Circle2D(value, instance.startVertex());
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
      point = Vertex2D.instance(point);
      return approximate.lteq(this.minX(), point.x()) && approximate.lteq(this.minY(), point.y()) &&
            approximate.gteq(this.maxX(), point.x()) && approximate.gteq(this.maxY(), point.y());
    }


    function reconsileLength (newLength) {
      const moveVertex = instance.endVertex();
      const nextLine = moveVertex.nextLine()
      if (nextLine === undefined) changeLength(newLength);

      const vertex1 = nextLine.endVertex();
      const circle1 = new Circle2D(nextLine.length(), vertex1);
      const vertex2 = instance.startVertex();
      const circle2 = new Circle2D(newLength, vertex2);
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

    const measurement = new LineMeasurement2D(this);
    function getSlope(v1, v2) {
      const y1 = v1.y();
      const y2 = v2.y();
      const x1 = v1.x();
      const x2 = v2.x();
      return approximate(y2 - y1) / approximate(x2 - x1);
    }
    this.measurement = () => measurement;

    function getB(x, y, slope) {
        return y - slope * x;
    }

    function newX(m1, m2, b1, b2) {
      return (b2 - b1) / (m1 - m2);
    }

    function getY(x, slope, b) {return slope*x + b}
    function getX(y, slope, b) {return  (y - b)/slope}

    this.midpoint = () => {
      const x = (this.endVertex().x() + this.startVertex().x())/2;
      const y = (this.endVertex().y() + this.startVertex().y())/2;
      return Vertex2D.instance({x,y});
    }

    this.yIntercept = () => getB(this.startVertex().x(), this.startVertex().y(), this.slope());
    this.slope = () => getSlope(this.startVertex(), this.endVertex());
    this.y = (x) => {
      const slope = this.slope();
      return Math.abs(slope) === Infinity ? this.startVertex().y() : (this.slope()*x + this.yIntercept());
    }

    this.x = (y) => {
      const slope = this.slope();
      return Math.abs(slope) === Infinity ? this.startVertex().x() : (y - this.yIntercept())/slope;
    }

    this.maxDem = () => this.y() > this.x() ? this.y() : this.x();
    this.minDem = () => this.y() < this.x() ? this.y() : this.x();

    this.closestPointOnLine = (vertex, segment) => {
      vertex = (vertex instanceof Vertex2D) ? vertex : Vertex2D.instance(vertex);
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
      const closestPoint = Vertex2D.instance({x, y});
      if (!segment || this.withinSegmentBounds(closestPoint)) return closestPoint;
      return false;
    }

    this.inverseX = (y) => this.slope()*y + this.yIntercept();
    this.inverseY = (x) => (x-this.yIntercept())/this.slope();
    this.perpendicular = (vertex, distance) => {
      vertex = Vertex2D.instance(vertex) || this.midpoint();
      const posOffset = distance !== undefined ? distance/2 : 1000;
      const negOffset = -1 * posOffset;
      const slope = this.slope();
      if (slope === 0) {
        return new Line2D({x: vertex.x(), y: vertex.y() + posOffset}, {x: vertex.x(), y: vertex.y() + negOffset});
      }
      if (Math.abs(slope) === Infinity) {
        return new Line2D({x: posOffset + vertex.x(), y: vertex.y()}, {x: negOffset + vertex.x(), y: vertex.y()});
      }

      const slopeInverse = -1/slope;
      const b = getB(vertex.x(), vertex.y(), slopeInverse);
      const startVertex = {x: getX(posOffset, slopeInverse, b), y: posOffset};
      const endVertex = {x: getX(negOffset, slopeInverse, b), y: negOffset};
      const line = new Line2D(startVertex, endVertex);
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
      return toDegrees(this.radians());
    }
    this.radians = () => {
      const deltaX = this.endVertex().x() - this.startVertex().x();
      const deltaY = this.endVertex().y() - this.startVertex().y();
      return approximate(Math.atan2(deltaY, deltaX));
    }

    this.move = (center) => {
      const mouseLocation = Vertex2D.instance(center);
      const perpLine = this.perpendicular(mouseLocation);
      const interX = this.findIntersection(perpLine);
      const diffLine = new Line2D(interX, mouseLocation);
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
    this.toString = () => `${this.startVertex().toString()} => ${this.endVertex().toString()}`;
    this.toNegitiveString = () => `${this.endVertex().toString()} => ${this.startVertex().toString()}`;
  }
}
Line2D.reusable = true;
Line2D.startAndTheta = (startvertex, theta) => {
  const end = {x: dist * Math.cos(theta), y: dist*Math.sin(theta)};
  return new Line(startVertex.point(), end);
}
Line2D.instance = (startV, endV, group) => {
  const line = Lookup.instance(Line2D.name);
  line.lookupGroup(group);
  line.startVertex(Vertex2D.instance(startV)).lookupGroup(group);
  line.endVertex(Vertex2D.instance(endV)).lookupGroup(group);
  return line;
}
new Line2D();
