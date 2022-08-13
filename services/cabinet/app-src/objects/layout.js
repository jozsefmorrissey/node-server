
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const Measurement = require('../../../../public/js/utils/measurement.js');
const StateHistory = require('../../../../public/js/utils/services/state-history');
const approximate = require('../../../../public/js/utils/approximate.js');

const pushVertex = (x, y, arr) => {
  if (Number.isNaN(x) || Number.isNaN(y)) return;
  arr.push(Vertex2D.instance({x, y}));
}

function toRadians(angle) {
  return approximate((angle*Math.PI/180)%(2*Math.PI));
}

function toDegrees(rads) {
  return approximate(rads * 180/Math.PI % 360);
}

class Vertex2D extends Lookup {
  constructor(point, nextLine, prevLine) {
    if (point instanceof Vertex2D) return point;
    point = point || {x:0,y:0};
    super();
    if (nextLine) nextLine.startVertex(this);
    if (prevLine) prevLine.endVertex(this);
    Object.getSet(this, {point});
    this.nextLine = (newLine) => {
      if (newLine instanceof Line2D) nextLine = newLine;
      return nextLine;
    }
    this.prevLine = (newLine) => {
      if (newLine instanceof Line2D) prevLine = newLine;
      return prevLine;
    }
    const instance = this;
    this.move = (center) => {
      this.point(center);
      return true;
    };
    this.point = (newPoint) => {
      if (newPoint) this.x(newPoint.x);
      if (newPoint) this.y(newPoint.y);
      return point;
    }

    this.equal = (other) => approximate.eq(other.x(), this.x()) && approximate.eq(other.y(), this.y());
    this.x = (val) => {
      if ((typeof val) === 'number') point.x = approximate(val);
      return this.point().x;
    }
    this.y = (val) => {
      if ((typeof val) === 'number') this.point().y = approximate(val);
      return this.point().y;
    }
    function assignVertex(forward) {
      return (point, lineConst) => {
        const vertexGetter = forward ? instance.tex : instance.prevVertex;
        const lineGetter = forward ? instance.nextLine : instance.prevLine;
        if (point !== undefined) {
          const vertex = Vertex2D.instance(point);
          const origVertex = vertexGetter();
          if (origVertex instanceof Vertex2D) {
            lineConst = lineConst || Line2D;
            const line = forward ? new lineConst(vertex, origVertex) : new lineConst(origVertex, vertex);
            origVertex.lineGetter(line);
            vertex.lineGetter(line);
          } else {
            lineConst = lineConst || Line2D;
            const line = forward ? new lineConst(vertex, instance) : new lineConst(instance, vertex);
            lineGetter(line);
            const otherLineGetter = !forward ? vertex.nextLine : vertex.prevLine;
            otherLineGetter(line);
          }
        }
        const line = lineGetter();
        if (line === undefined) return undefined;
        return instance.nextLine().endVertex();
      };
    }

    const dummyFunc = () => true;
    this.forEach = (func, backward) => {
      let currVert = this;
      let lastVert;
      do {
        lastVert = currVert;
        func(currVert);
        currVert = backward ? currVert.prevVertex() : currVert.nextVertex();
      } while (currVert && currVert !== this);
      return currVert || lastVert;
    }

    this.verticies = () => {
      let list = [];
      const endVertex = this.forEach((vertex) => vertex && list.push(vertex));
      if (endVertex === this) return list;
      let reverseList = [];
      this.forEach((vertex) => reverseList.push(vertex), true);
      return reverseList.reverse().concat(list);
    }

    this.lines = () => {
      let list = [];
      const endVertex = this.forEach((vertex) =>
          vertex && vertex.nextLine() && list.push(vertex.nextLine()));
      if (endVertex === this) return list;
      let reverseList = [];
      this.forEach((vertex) =>
        vertex && vertex.prevLine() && reverseList.push(vertex.prevLine()), true);
      return reverseList.reverse().concat(list);
    }

    this.isEnclosed = () => {
      const start = this.forEach(dummyFunc, true);
      const end = this.forEach(dummyFunc);
      return start === end;
    }

    this.enclose = (lineConst) => {
      if (!this.isEnclosed()) {
        const start = this.forEach(dummyFunc, true);
        const end = this.forEach(dummyFunc, false);
        const newLine = new lineConst(end, start);
        start.prevLine(newLine);
        end.nextLine(newLine);
      }
    }
    this.prevVertex = (point, lineConst) => {
      if (point !== undefined) {
        const vertex = Vertex2D.instance(point);
        const origVertex = this.prevVertex();
        if (origVertex instanceof Vertex2D) {
          lineConst = lineConst || Line2D;
          const line = new lineConst(origVertex, vertex);
          origVertex.nextLine(line);
          vertex.prevLine(line);
        } else {
          lineConst = lineConst || Line2D;
          const line = new lineConst(vertex, instance);
          instance.prevLine(line);
          vertex.nextLine(line);
        }
      }
      const line = instance.prevLine();
      if (line === undefined) return undefined;
      return line.startVertex();
    };
    this.nextVertex = (point, lineConst) => {
      if (point !== undefined) {
        const vertex = Vertex2D.instance(point);
        const origVertex = this.nextVertex();
        const origLine = this.nextLine();
        if (origVertex instanceof Vertex2D) {
          lineConst = lineConst || Line2D;
          const line = new lineConst(vertex, origVertex);
          origVertex.prevLine(line);
          vertex.nextLine(line);
          vertex.prevLine(origLine);
          origLine.endVertex(vertex);
        } else {
          lineConst = lineConst || Line2D;
          const line = new lineConst(instance, vertex);
          instance.nextLine(line);
          vertex.prevLine(line);
        }
      }
      const line = instance.nextLine();
      if (line === undefined) return undefined;
      return line.endVertex();
    };
    this.center = (previousCount, nextCount) => {
      previousCount = previousCount || 0;
      nextCount = nextCount || 0;
      if (previousCount + nextCount === 0) return Vertex2D.center(...this.verticies());
      const verticies = {};
      verticies[this.id()] = this;
      let currVert = this.prevVertex();
      for (let index = 0; currVert && !verticies[currVert.id()] && index < previousCount; index += 1) {
        verticies[currVert.id()] = currVert;
        currVert = this.prevVertex();
      }
      currVert = this.nextVertex();
      for (let index = 0; currVert && !verticies[currVert.id()] && index < previousCount; index += 1) {
        verticies[currVert.id()] = currVert;
        currVert = this.nextVertex();
      }
      return Vertex2D.center(...Object.values(verticies));
    }
    this.distance = (vertex) => {
      vertex = (vertex instanceof Vertex2D) ? vertex : Vertex2D.instance(vertex);
      const xDiff = vertex.x() - this.x();
      const yDiff = vertex.y() - this.y();
      return Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
    }
    this.remove = () => {
      const prevLine = this.prevLine();
      const nextLine = this.nextLine();
      const nextVertex = this.nextVertex();
      prevLine.endVertex(nextVertex);
      nextVertex.prevLine(prevLine);
    }
    this.toString = () => `(${this.x()}, ${this.y()})`;
    const parentToJson = this.toJson;
    this.toJson = () => {
      const json = parentToJson();
      const nextLine = this.nextLine();
      const prevLine = this.prevLine();
      if (prevLine) json.prevLine = prevLine.id();
      if (nextLine) json.nextLine = nextLine.id();
      return json;
    };
    this.offset = (x, y) => {
      const copy = this.toJson();
      if (y !== undefined) copy.y += y;
      if (x !== undefined) copy.x += x;
      return Vertex2D.instance(copy);
    }

    this.point(point);
  }
}

Vertex2D.instance = (point, group) => {
  if (point instanceof Vertex2D) {
    point.lookupGroup(group);
    return point;
  }
  const inst = Lookup.instance(Vertex2D.name);
  inst.lookupGroup(group);
  inst.point(point);
  return inst;
}

Vertex2D.fromJson = (json) => {
  prevLine = json.prevLine && Lookup.get(json.prevLine);
  nextLine = json.nextLine && Lookup.get(json.nextLine);
  point = json.point;
  const vertex = Vertex2D.instance(point, nextLine, prevLine);
  vertex.id(json.id);
  return vertex;
}

Vertex2D.center = (...verticies) => {
  let x = 0;
  let y = 0;
  let count = 0;
  verticies.forEach((vertex) => {
      count++;
      x += vertex.x();
      y += vertex.y();
  });
  return Vertex2D.instance({x: x/count, y: y/count});
}

Vertex2D.reusable = true;
new Vertex2D();

class Circle2D extends Lookup {
  constructor(radius, center) {
    super();
    center = Vertex2D.instance(center);
    Object.getSet(this, {radius, center});
    // ( x - h )^2 + ( y - k )^2 = r^2
    const instance = this;
    // Stole the root code from: https://stackoverflow.com/a/37225895
    function lineIntersects (line, bounded) {
      line.p1 = line.startVertex();
      line.p2 = line.endVertex();
        var a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
        v1 = {};
        v2 = {};
        v1.x = line.p2.x() - line.p1.x();
        v1.y = line.p2.y() - line.p1.y();
        v2.x = line.p1.x() - instance.center.x();
        v2.y = line.p1.y() - instance.center.y();
        b = (v1.x * v2.x + v1.y * v2.y);
        c = 2 * (v1.x * v1.x + v1.y * v1.y);
        b *= -2;
        d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - instance.radius() * instance.radius()));
        if(isNaN(d)){ // no intercept
            return [];
        }
        u1 = (b - d) / c;  // these represent the unit distance of point one and two on the line
        u2 = (b + d) / c;
        retP1 = {};   // return points
        retP2 = {}
        ret = []; // return array
        if(!bounded || (u1 <= 1 && u1 >= 0)){  // add point if on the line segment
            retP1.x = line.p1.x() + v1.x * u1;
            retP1.y = line.p1.y() + v1.y * u1;
            ret[0] = retP1;
        }
        if(!bounded || (u2 <= 1 && u2 >= 0)){  // second add point if on the line segment
            retP2.x = line.p1.x() + v1.x * u2;
            retP2.y = line.p1.y() + v1.y * u2;
            ret[ret.length] = retP2;
        }
        return ret;
    }

    function circleIntersects(circle) {
      return Circle2D.intersectionOfTwo(instance, circle);
    }

    this.intersections = (input) => {
        if (input instanceof Circle2D) return circleIntersects(input);
        if (input instanceof Line2D) return lineIntersects(input);
        throw new Error(`Cannot find intersections for ${input.constructor.name}`);
    }
  }
}

// Ripped off from: https://stackoverflow.com/a/12221389
Circle2D.intersectionOfTwo = (circle0, circle1) => {
    const x0 = circle0.center().x();
    const y0 = circle0.center().y();
    const r0 = circle0.radius();

    const x1 = circle1.center().x();
    const y1 = circle1.center().y();
    const r1 = circle1.radius();
    var a, dx, dy, d, h, rx, ry;
    var x2, y2;

    /* dx and dy are the vertical and horizontal distances between
     * the circle centers.
     */
    dx = x1 - x0;
    dy = y1 - y0;

    /* Determine the straight-line distance between the centers. */
    d = Math.sqrt((dy*dy) + (dx*dx));

    /* Check for solvability. */
    if (d > (r0 + r1)) {
        /* no solution. circles do not intersect. */
        return [];
    }
    if (d < Math.abs(r0 - r1)) {
        /* no solution. one circle is contained in the other */
        return [];
    }

    /* 'point 2' is the point where the line through the circle
     * intersection points crosses the line between the circle
     * centers.
     */

    /* Determine the distance from point 0 to point 2. */
    a = ((r0*r0) - (r1*r1) + (d*d)) / (2.0 * d) ;

    /* Determine the coordinates of point 2. */
    x2 = x0 + (dx * a/d);
    y2 = y0 + (dy * a/d);

    /* Determine the distance from point 2 to either of the
     * intersection points.
     */
    h = Math.sqrt((r0*r0) - (a*a));

    /* Now determine the offsets of the intersection points from
     * point 2.
     */
    rx = -dy * (h/d);
    ry = dx * (h/d);

    /* Determine the absolute intersection points. */
    var xi = x2 + rx;
    var xi_prime = x2 - rx;
    var yi = y2 + ry;
    var yi_prime = y2 - ry;

    const list = [];
    pushVertex(xi, yi, list);
    pushVertex(xi_prime, yi_prime, list);
    return [{x: xi, y: yi}, {x: xi_prime, y: yi_prime}];
}

Circle2D.reusable = true;
Circle2D.instance = (radius, center) => {
  const inst = Lookup.instance(Circle2D.name);
  inst.radius(radius);
  inst.center(center);
  return inst;
}
new Circle2D();


class LineMeasurement2D extends Lookup {
  constructor(line, modificationFunction) {
    super();
    modificationFunction = modificationFunction || line.length;
    const offset = 10;
    this.line = () => line;
    this.I = (layer) => {
      layer = layer || 1;
      const termDist = (layer + 1) * offset;
      const measureDist = layer * offset;
      const startLine = line.perpendicular(line.startVertex(), termDist * 2);
      const endLine = line.perpendicular(line.endVertex(), termDist * 2);
      const startCircle = new Circle2D(measureDist, line.startVertex());
      const endCircle = new Circle2D(measureDist, line.endVertex());
      const startTerminationCircle = new Circle2D(termDist, line.startVertex());
      const endTerminationCircle = new Circle2D(termDist, line.endVertex());
      const startVerticies = startCircle.intersections(startLine);
      const endVerticies = endCircle.intersections(endLine);
      let inner, outer;
      if (startVerticies.length > 0 && endVerticies.length > 0) {
        const startTerminationVerticies = startTerminationCircle.intersections(startLine);
        const endTerminationVerticies = endTerminationCircle.intersections(endLine);
        let startTerminationLine, endTerminationLine, measurementLine;
        const center = Vertex2D.center.apply(null, line.startVertex().verticies());

        inner = new Line2D(startVerticies[1], endVerticies[1]);
        inner.startLine = new Line2D(line.startVertex(), startTerminationVerticies[1]);
        inner.endLine = new Line2D(line.endVertex(), endTerminationVerticies[1]);

        outer = new Line2D(startVerticies[0], endVerticies[0]);
        outer.startLine = new Line2D(line.startVertex(), startTerminationVerticies[0]);
        outer.endLine = new Line2D(line.endVertex(), endTerminationVerticies[0]);
        const furtherLine = (point) => LineMeasurement2D.furtherLine(inner, outer, point);
        const closerLine = (point) => LineMeasurement2D.furtherLine(inner, outer, point, true);
        return {inner, outer, furtherLine, closerLine};
      } else {
        return {};
      }
    }

    this.copy = (modFunc) => new LineMeasurement2D(line, modFunc);
    this.modificationFunction = (func) => {
      if ((typeof func) === 'function') modificationFunction = func;
      return modificationFunction;
    }

    this.display = () => new Measurement(line.length()).display();

    this.modify = (value) => modificationFunction(new Measurement(value, true).decimal());
  }
}

LineMeasurement2D.furtherLine = (inner, outer, point, closer) =>
    inner.midpoint().distance(point) > outer.midpoint().distance(point) ?
      (closer ? outer : inner) :
      (closer ? inner : outer);

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

class Plane2D extends Lookup {
  constructor(verticies) {
    super();
    this.getLines = () => {
      const lines = [];
      for (let index = 0; index < verticies.length; index += 1) {
        lines.push(new Line2D(verticies[index], verticies[(index + 1) % verticies.length]));
      }
      return lines;
    }
  }
}

Plane2D.getPlanes = (planes) => {
  const ps = [];
  planes.forEach((p) => ps.push(new Plane2D(p)));
  return ps;
}

class Plane3D extends Lookup {
  constructor(...verticies) {
    super();
    if (verticies.length < 3) throw new Error('A Plane3D cannot be constructed without 3 verticies');

  }
}


Plane2D.consolidatePolygons = (polygons) => {
  const consolidated = {top: {}, left: {}, front: {}};
  function group(g, poly) {

    map.xy[index].push({x: v.pos.x, y: v.pos.y, level: v.pos.z});
    map.xz[index].push({x: v.pos.x, y: v.pos.z, level: v.pos.y});
    map.yz[index].push({x: v.pos.y, y: v.pos.z, level: v.pos.x});
  }
  const map = {xy: [], xz: [], yz: []};
  polygons.forEach((p, index) => {
    map.xy.push([]);
    map.xz.push([]);
    map.yz.push([]);
    p.vertices.forEach((v) => {
      map.xy[index].push({x: v.pos.x, y: v.pos.y, level: v.pos.z});
      map.xz[index].push({x: v.pos.x, y: v.pos.z, level: v.pos.y});
      map.yz[index].push({x: v.pos.y, y: v.pos.z, level: v.pos.x});
    });
  });
  return map;
}



const vertexMap = {};
function getVertex(point, wall1, wall2) {
  const mapId = `${wall1.id()}->${wall2.id()}`;
  if (vertexMap[mapId] === undefined) {
    vertexMap[mapId] = new Layout2D.Vertex2D(point);
    wall1.startVertex(vertexMap[mapId]);
    wall2.endVertex(vertexMap[mapId]);
  }
  else vertexMap[mapId].point(point);
  return vertexMap[mapId];
}

const moveCount = 0;
class SnapLocation2D extends Lookup {
  constructor(parent, location, vertex, targetVertex, color, pairedWith) {
    super();
    Object.getSet(this, {location, vertex, targetVertex, color}, "parentId", "pairedWithId");
    const circle = new Circle2D(5, vertex);
    pairedWith = pairedWith || null;
    this.circle = () => circle;
    this.eval = () => this.parent()[location]();
    this.parent = () => parent;
    this.parentId = () => parent.id();
    this.pairedWithId = () => pairedWith && pairedWith.id();
    this.pairedWith = () => pairedWith;
    this.disconnect = () => {
      if (pairedWith === null) return;
      const wasPaired = pairedWith;
      pairedWith = null;
      wasPaired.disconnect();
    }
    this.pairWith = (otherSnapLoc) => {
      const alreadyPaired = otherSnapLoc === pairedWith;
      if (!alreadyPaired) {
        pairedWith = otherSnapLoc;
        otherSnapLoc.pairWith(this);
      }
    }

    this.forEachObject = (func, objMap) => {
      objMap = objMap || {};
      objMap[this.parent().id()] = this.parent();
      const locs = this.parent().snapLocations.paired();
      for (let index = 0; index < locs.length; index += 1) {
        const loc = locs[index];
        const connSnap = loc.pairedWith();
        if (connSnap) {
          const connObj = connSnap.parent();
          if (connObj && objMap[connObj.id()] === undefined) {
            objMap[connObj.id()] = connObj;
            connSnap.forEachObject(undefined, objMap);
          }
        }
      }
      if ((typeof func) === 'function') {
        const objs = Object.values(objMap);
        for (let index = 0; index < objs.length; index += 1) {
          func(objs[index]);
        }
      }
    };

    this.isConnected = (obj) => {
      let connected = false;
      this.forEachObject((connObj) => connected = connected || obj.id() === connObj.id());
      return connected;
    }

    this.rotate = (theta) => {
      this.forEachObject((obj) => obj.radians((obj.radians() + theta) % (2*Math.PI)));
    }

    let lastMove = 0;
    this.move = (vertexLocation, moveId) => {
      moveId = (typeof moveId) !== 'number' ? lastMove + 1 : moveId;
      if (lastMove === moveId) return;
      vertexLocation = Vertex2D.instance(vertexLocation);
      const parent = this.parent();
      const thisNewCenterLoc = this.parent()[location]({center: vertexLocation});
      parent.object().move({center: thisNewCenterLoc});
      lastMove = moveId;
      const pairedLocs = parent.snapLocations.paired();
      for (let index = 0; index < pairedLocs.length; index += 1) {
        const loc = pairedLocs[index];
        const paired = loc.pairedWith();
        const tarVertexLoc = this.parent()[loc.location()]().vertex();
        paired.move(tarVertexLoc, moveId);
      }
    }
    this.notPaired = () => pairedWith === null;

    this.instString = () => `${parent.id()}:${location}`;
    this.toString = () => `${this.instString()}=>${pairedWith && pairedWith.instString()}`;
    this.toJson = () => {
      const pw = pairedWith;
      if (pw === undefined) return;
      const json = [{
        location, objectId: parent.id()
      }, {
        location: pw.location(), objectId: pw.parent().id()
      }];
      const thisStr = this.toString();
      const pairStr = pw.toString();
      const uniqueId = thisStr < pairStr ? thisStr : pairStr;
      json.UNIQUE_ID = uniqueId;
      return json;
    }
  }
}

SnapLocation2D.fromJson = (json) => {
  console.log('jsoned it up!')
}

let activeLocations = [];
SnapLocation2D.active = (locs) => {
  if (Array.isArray(locs)) activeLocations = activeLocations.concat(locs);
  return activeLocations;
}
SnapLocation2D.clear = () => activeLocations = [];

class Snap2D extends Lookup {
  constructor(layout, object, tolerance) {
    super(object ? object.id() : undefined);
    Object.getSet(this, {object, tolerance}, 'layoutId');
    if (layout === undefined) return;
    const instance = this;
    let start = Vertex2D.instance();
    let end = Vertex2D.instance();

    this.layoutId = () => layout.id();
    this.radians = object.radians;
    this.angle = object.angle;
    this.x = object.x;
    this.y = object.y;
    this.height = object.height;
    this.width = object.width;
    this.onChange = object.onChange;

    const backLeft = new SnapLocation2D(this, "backLeft",  Vertex2D.instance(null),  'backRight', 'red');
    const backRight = new SnapLocation2D(this, "backRight",  Vertex2D.instance(null),  'backLeft', 'purple');
    const frontRight = new SnapLocation2D(this, "frontRight",  Vertex2D.instance(null),  'frontLeft', 'black');
    const frontLeft = new SnapLocation2D(this, "frontLeft",  Vertex2D.instance(null),  'frontRight', 'green');

    const backCenter = new SnapLocation2D(this, "backCenter",  Vertex2D.instance(null),  'backCenter', 'teal');
    const leftCenter = new SnapLocation2D(this, "leftCenter",  Vertex2D.instance(null),  'rightCenter', 'pink');
    const rightCenter = new SnapLocation2D(this, "rightCenter",  Vertex2D.instance(null),  'leftCenter', 'yellow');

    const snapLocations = [backCenter,leftCenter,rightCenter,backLeft,backRight,frontLeft,frontRight];
    function getSnapLocations(paired) {
      if (paired === undefined) return snapLocations;
      const locs = [];
      for (let index = 0; index < snapLocations.length; index += 1) {
        const loc = snapLocations[index];
        if (paired) {
          if (loc.pairedWith() !== null) locs.push(loc);
        } else if (loc.pairedWith() === null) locs.push(loc);
      }
      return locs;
    }

    this.snapLocations = getSnapLocations;
    this.snapLocations.notPaired = () => getSnapLocations(false);
    this.snapLocations.paired = () => getSnapLocations(true);
    this.snapLocations.rotate = backCenter.rotate;
    function resetVertices() {
      for (let index = 0; index < snapLocations.length; index += 1) {
        const snapLoc = snapLocations[index];
        instance[snapLoc.location()]();
      }
    }

    function centerMethod(snapLoc, widthMultiplier, heightMultiplier, position) {
      const vertex = snapLoc.vertex();
      // if (position === undefined && vertex.point() !== null) return vertex;
      const center = object.center();
      const rads = object.radians();
      const offsetX = object.width() * widthMultiplier * Math.cos(rads) -
                        object.height() * heightMultiplier * Math.sin(rads);
      const offsetY = object.height() * heightMultiplier * Math.cos(rads) +
                        object.width() * widthMultiplier * Math.sin(rads);

      if (position !== undefined) {
        const posCenter = Vertex2D.instance(position.center);
        return Vertex2D.instance({x: posCenter.x() + offsetX, y: posCenter.y() + offsetY});
      }
      const backLeftLocation = {x: center.x() - offsetX , y: center.y() - offsetY};
      vertex.point(backLeftLocation);
      return snapLoc;
    }

    this.frontCenter = (position) => centerMethod(frontCenter, 0, -.5, position);
    this.backCenter = (position) => centerMethod(backCenter, 0, .5, position);
    this.leftCenter = (position) => centerMethod(leftCenter, .5, 0, position);
    this.rightCenter = (position) => centerMethod(rightCenter, -.5, 0, position);

    this.backLeft = (position) => centerMethod(backLeft, .5, .5, position);
    this.backRight = (position) => centerMethod(backRight, -.5, .5, position);
    this.frontLeft = (position) =>  centerMethod(frontLeft, .5, -.5, position);
    this.frontRight = (position) => centerMethod(frontRight, -.5, -.5, position);

    function calculateMaxAndMin(closestVertex, furthestVertex, wall, position, axis) {
      const maxAttr = `max${axis.toUpperCase()}`;
      const minAttr = `min${axis.toUpperCase()}`;
      if (closestVertex[axis]() === furthestVertex[axis]()) {
        const perpLine = wall.perpendicular(undefined, 10);
        const externalVertex = !layout.within(perpLine.startVertex()) ?
                perpLine.endVertex() : perpLine.startVertex();
        if (externalVertex[axis]() < closestVertex[axis]()) position[maxAttr] = closestVertex[axis]();
        else position[minAttr] = closestVertex[axis]();
      } else if (closestVertex[axis]() < furthestVertex[axis]()) position[minAttr] = closestVertex[axis]();
      else position[maxAttr] = closestVertex[axis]();
    }

    function findWallSnapLocation(center) {
      const centerWithin = layout.within(center);
      let wallObj;
      layout.walls().forEach((wall) => {
        const point = wall.closestPointOnLine(center, true);
        if (point) {
          const wallDist = point.distance(center);
          const isCloser = (!centerWithin || wallDist < tolerance) &&
                          (wallObj === undefined || wallObj.distance > wallDist);
          if (isCloser) {
            wallObj = {point, distance: wallDist, wall};
          }
        }
      });
      if (wallObj) {
        const wall = wallObj.wall;
        const point = wallObj.point;
        center = point;
        const theta = wall.radians();
        let position = {center, theta};

        const backCenter = instance.backCenter({center, theta});
        const backLeftCenter = instance.backLeft({center: wall.startVertex(), theta});
        if (backCenter.distance(backLeftCenter) < object.maxDem() / 2) return object.move({center: backLeftCenter, theta});
        const backRightCenter = instance.backRight({center: wall.endVertex(), theta})
        if (backCenter.distance(backRightCenter) < object.maxDem() / 2) return object.move({center: backRightCenter,theta});

        return {center: backCenter, theta};
      }
    }

    function findObjectSnapLocation (center) {
      let snapObj;
      SnapLocation2D.active().forEach((snapLoc) => {
        const targetSnapLoc = instance[snapLoc.targetVertex()]();
        if (snapLoc.isConnected(instance) ||
            snapLoc.pairedWith() !== null || targetSnapLoc.pairedWith() !== null) return;
        const vertDist = snapLoc.vertex().distance(center);
        const vertCloser = (snapObj === undefined && vertDist < tolerance) ||
        (snapObj !== undefined && snapObj.distance > vertDist);
        if (vertCloser) snapObj = {snapLoc: snapLoc, distance: vertDist, targetSnapLoc};
      });
      if (snapObj) {
        const snapLoc = snapObj.snapLoc;
        let theta = snapLoc.parent().radians();
        const center = snapLoc.vertex();
        const funcName = snapLoc.targetVertex();
        if (funcName === 'backCenter') theta = (theta + Math.PI) % (2 * Math.PI);
        lastPotentalPair = [snapLoc, snapObj.targetSnapLoc];
        return {snapLoc, center: instance[funcName]({center, theta}), theta};
      }
    }

    let lastPotentalPair;
    this.setLastPotentialPair = (lpp) => lastPotentalPair = lpp;
    function checkPotentialPair() {
      if (!lastPotentalPair) return;
      const snap1 = lastPotentalPair[0];
      const snap2 = lastPotentalPair[1];
      snap1.eval();
      snap2.eval();
      if (!snap1.vertex().equal(snap2.vertex())) lastPotentalPair = null;
      return true;
    }

    this.potentalSnapLocation = () => checkPotentialPair() && lastPotentalPair && lastPotentalPair[0];
    this.pairWithLast = () => {
      lastPotentalPair && lastPotentalPair[0].pairWith(lastPotentalPair[1])
      lastPotentalPair = null;
    };
    this.move = (center) => {
      checkPotentialPair();
      const pairedSnapLocs = this.snapLocations.paired();
      resetVertices();
      if (pairedSnapLocs.length > 0) {
        const snapInfo = findObjectSnapLocation(center);
        if (snapInfo) {
          const obj = snapInfo.snapLoc.parent();
          if (snapInfo.theta !== undefined) {
            const theta = approximate(((snapInfo.theta + 2 * Math.PI) - this.object().radians()) % (2*Math.PI));
            snapInfo.theta = undefined;
            this.snapLocations.rotate(theta);
          }
          const snapLoc = snapInfo.snapLoc;
          const targetVertex = snapLoc.targetVertex();
          const targetSnapLoc = this[targetVertex]();
          lastPotentalPair = [targetSnapLoc, snapLoc];
          const vertexCenter = snapLoc.parent()[snapLoc.location()]().vertex();
          return targetSnapLoc.move(vertexCenter);
        }
        const snapLoc = pairedSnapLocs[0];
        return snapLoc.move(center);
      }
      const centerWithin = layout.within(center);
      let closest = {};
      const snapLocation = findObjectSnapLocation(center);
      const wallSnapLocation = findWallSnapLocation(center);
      if (snapLocation) {
        return object.move(snapLocation);
      } else if (!centerWithin || wallSnapLocation) {
        return object.move(wallSnapLocation);
      } else if (centerWithin) {
        return object.move({center});
      }
    };
  }
}

Snap2D.fromJson = (json) => {
  const layout = Layout2D.get(json.layoutId);
  const object = Object.fromJson(json.object);
  const snapObj = new Snap2D(layout, object, json.tolerance);
  snapObj.id(json.id);
  return snapObj;
}

class OnWall extends Lookup {
  constructor(wall, fromPreviousWall, fromFloor, height, width) {
    super();
    Object.getSet(this, {width, height, fromFloor, fromPreviousWall}, 'wallId');
    let start = Vertex2D.instance();
    let end = Vertex2D.instance();
    this.wallId = () => wall.id();
    this.endpoints2D = () => {
      const wallStartPoint = wall.startVertex();
      const dist = this.fromPreviousWall();
      const total = dist + this.width();
      const theta = wall.radians();
      const startPoint = {};
      startPoint.x = wallStartPoint.x() + dist * Math.cos(theta);
      startPoint.y = wallStartPoint.y() + dist * Math.sin(theta);
      start.point(startPoint);

      const endPoint = {};
      endPoint.x = (wallStartPoint.x() + total * Math.cos(theta));
      endPoint.y = (wallStartPoint.y() + total * Math.sin(theta));
      end.point(endPoint);

      return { start, end, toString: () => `${start.toString()} => ${end.toString()}`};
    }
    this.fromPreviousWall = (value) => {
      value = Number.parseFloat(value);
      if (!Number.isNaN(value)) fromPreviousWall = value;
      return fromPreviousWall;
    }
    this.fromNextWall = (value) => {
      value = Number.parseFloat(value);
      if (value) {
        this.fromPreviousWall(wall.length() - this.width() - value);
      }
      return wall.length() - this.width() - this.fromPreviousWall();
    }
    this.wall = () => wall;
    this.move = (center) => {
      const point = wall.closestPointOnLine(center);
      let distance = wall.startVertex().distance(point);
      const max = wall.length() - this.width();
      distance = distance < 0 ? 0 : distance;
      distance = distance > max ? max : distance;
      this.fromPreviousWall(distance);
    };
  }
}
OnWall.sort = (ow1, ow2) => ow1.fromPreviousWall() - ow2.fromPreviousWall();
OnWall.fromJson = (json) => {
  const cxtr = Lookup.decode(json.id).constructor;
  const wall = Lookup.get(json.wallId);
  const instance = new cxtr(wall, json.fromPreviousWall, json.fromFloor, json.height, json.width);
  instance.id(json.id);
  return instance;
}

class Door2D extends OnWall {
  constructor() {
    super(...arguments);
    this.width(this.width() || 91.44);
    this.height(this.height() || 198.12);
    this.fromPreviousWall(this.fromPreviousWall() || 150);
    this.fromFloor(this.fromFloor() || 0);
    let hinge = 0;
    Object.getSet(this, 'hinge');
    this.toString = () => `${this.id()}:${this.endpoints2D().toString()}:${hinge}`;
    this.remove = () => this.wall().removeDoor(this);
    this.hinge = (val) => val === undefined ? hinge :
      hinge = ((typeof val) === 'number' ? val : hinge + 1) % 5;
  }
}

Door2D.fromJson = (json) => {
  const inst = OnWall.fromJson(json);
  inst.hinge(json.hinge);
  return inst;
}

class Window2D extends OnWall {
  constructor(wall, fromPreviousWall, fromFloor, height, width) {
    width = width || 81.28;
    height = height || 91.44;
    fromFloor = fromFloor || 101.6;
    fromPreviousWall = fromPreviousWall || 20;
    super(wall, fromPreviousWall, fromFloor, height, width);
    this.remove = () => this.wall().removeWindow(this);
    this.toString = () => `${this.id()}:${this.endpoints2D().toString()}`;
  }
}

class Wall2D extends Line2D {
  constructor(startVertex, endVertex, height, windows, doors) {
    super(startVertex, endVertex);
    windows = windows || [];
    doors = doors || [];
    const wall = this;

    height = height || 243.84;
    Object.getSet(this, {height, windows, doors});
    this.copy = () => new Wall2D(this.length(), this.radians());
    this.windows = () => windows;
    this.addWindow = (fromPreviousWall) => windows.push(new Window2D(this, fromPreviousWall));
    this.doors = () => doors;
    this.addDoor = (fromPreviousWall) => doors.push(new Door2D(this, fromPreviousWall));
    this.verticies = () => {
      const verts = [this.startVertex()];
      const doorsAndWindows = doors.concat(windows);
      doorsAndWindows.sort(OnWall.sort);
      doorsAndWindows.forEach((onWall) => {
        const endpoints = onWall.endpoints2D();
        verts.push(endpoints.start);
        verts.push(endpoints.end);
      });
      verts.push(this.endVertex());
      return verts;
    }

    this.remove = () => {
        const prevWall = this.startVertex().prevLine();
        const nextLine = this.endVertex().nextLine();
        const startVertex = this.startVertex();
        nextLine.startVertex(startVertex);
        startVertex.nextLine(nextLine);
    }

    this.removeDoor = (door) => doors.splice(doors.indexOf(door), 1);
    this.removeWindow = (window) => windows.splice(windows.indexOf(window), 1);
  }
}
Wall2D.fromJson = (json) => {
  const doors = Object.fromJson(json.doors);
  const windows = Object.fromJson(json.windows);
  const height = json.height;
  const inst = new Wall2D(undefined, undefined, height, windows, doors);
  inst.id(json.id);
  return inst;
}

class Square2D extends Lookup {
  constructor(center, height, width, radians) {
    super();
    center = Vertex2D.instance(center);
    width = width === undefined ? 121.92 : width;
    height = height === undefined ? 60.96 : height;
    radians = radians === undefined ? 0 : radians;
    const instance = this;
    Object.getSet(this, {center, height, width, radians});
    const startPoint = Vertex2D.instance(null);

    const getterHeight = this.height;
    this.height = (v) => {
      notify(getterHeight(), v);
      return getterHeight(v);
    }
    const getterWidth = this.width;
    this.width = (v) => notify(getterWidth(), v) || getterWidth(v);

    const changeFuncs = [];
    this.onChange = (func) => {
      if ((typeof func) === 'function') {
        changeFuncs.push(func);
      }
    }

    let lastNotificationId = 0;
    function notify(currentValue, newValue) {
      if (changeFuncs.length === 0 || (typeof newValue) !== 'number') return;
      if (newValue !== currentValue) {
        const id = ++lastNotificationId;
        setTimeout(() => {
          if (id === lastNotificationId)
            for (let i = 0; i < changeFuncs.length; i++) changeFuncs[i](instance);
        }, 100);
      }
    }

    this.radians = (newValue) => {
      if (newValue !== undefined && !Number.isNaN(Number.parseFloat(newValue))) {
        notify(radians, newValue);
        radians = approximate(newValue);
      }
      return radians;
    };
    this.startPoint = () => {
      startPoint.point({x: center.x() - width / 2, y: center.y() - height / 2});
      return startPoint;
    }
    this.angle = (value) => {
      if (value !== undefined) this.radians(toRadians(value));
      return toDegrees(this.radians());
    }

    this.x = (val) => notify(this.center().x(), val) || this.center().x(val);
    this.y = (val) => notify(this.center().y(), val) || this.center().y(val);
    this.minDem = () => this.width() > this.height() ? this.width() : this.height();
    this.maxDem = () => this.width() > this.height() ? this.width() : this.height();

    this.shorterSideLength = () => this.height() < this.width() ? this.height() : this.width();
    this.move = (position, theta) => {
      const center = position.center instanceof Vertex2D ? position.center.point() : position.center;
      if (position.maxX !== undefined) center.x = position.maxX - this.offsetX();
      if (position.maxY !== undefined) center.y = position.maxY - this.offsetY();
      if (position.minX !== undefined) center.x = position.minX + this.offsetX();
      if (position.minY !== undefined) center.y = position.minY + this.offsetY();
      this.radians(position.theta);
      this.x(center.x);
      this.y(center.y);
      this.center().point(center);
      return true;
    };

    function centerMethod(widthMultiplier, heightMultiplier, position) {
      const center = instance.center();
      const rads = instance.radians();
      const offsetX = instance.width() * widthMultiplier * Math.cos(rads) -
                        instance.height() * heightMultiplier * Math.sin(rads);
      const offsetY = instance.height() * heightMultiplier * Math.cos(rads) +
                        instance.width() * widthMultiplier * Math.sin(rads);

      if (position !== undefined) {
        const posCenter = Vertex2D.instance(position.center);
        return Vertex2D.instance({x: posCenter.x() + offsetX, y: posCenter.y() + offsetY});
      }
      const backLeftLocation = {x: center.x() - offsetX , y: center.y() - offsetY};
      return Vertex2D.instance(backLeftLocation);
    }


    this.frontCenter = (position) => centerMethod(0, -.5, position);
    this.backCenter = (position) => centerMethod(0, .5, position);
    this.leftCenter = (position) => centerMethod(.5, 0, position);
    this.rightCenter = (position) => centerMethod(-.5, 0, position);

    this.backLeft = (position) => centerMethod(.5, .5, position);
    this.backRight = (position) => centerMethod(-.5, .5, position);
    this.frontLeft = (position) =>  centerMethod(.5, -.5, position);
    this.frontRight = (position) => centerMethod(-.5, -.5, position);

    this.offsetX = (negitive) => negitive ? this.width() / -2 : this.width() / 2;
    this.offsetY = (negitive) => negitive ? this.height() / -2 : this.height() / 2;

  }
}

function defSquare(center, layout) {
  return new Snap2D(layout, new Square2D(center), 30);
}

class Object2d extends Lookup {
  constructor(center, layout, payload) {
    super();
    center = Vertex2D.instance(center);
    Object.getSet(this, {payload,
      topview: defSquare(center, layout), bottomView: defSquare(center, layout),
      leftview: defSquare(center, layout), rightview: defSquare(center, layout),
      frontview: defSquare(center, layout), backView: defSquare(center, layout)
    });
  }
}

const ww = 500;
class Layout2D extends Lookup {
  constructor(startVertex, endVertex, objects, history) {
    super();
    objects = objects || [];
    Object.getSet(this, {objects});
    const initialized = startVertex !== undefined;

    function sortByAttr(attr) {
      function sort(obj1, obj2) {
        if (obj2[attr] === obj1[attr]) {
          return 0;
        }
        return obj2[attr] < obj1[attr] ? 1 : -1;
      }
      return sort;
    }

    const sortById = sortByAttr('id');
    this.toJson = () => {
      const objs = this.objects();
      const json = {verticies: [], walls: []};
      json.id = this.id();
      json.objects = Array.toJson(objs);
      startVertex.forEach((vert) => {
        json.verticies.push(vert.toJson());
        const nextLine = vert.nextLine();
        if (nextLine) json.walls.push(nextLine.toJson());
      });
      json.verticies.sort(sortById);
      json.walls.sort(sortById);
      json.objects.sort(sortById);
      const snapMap = {};
      objs.forEach((obj) => {
        const snapLocs = obj.topview().snapLocations.paired();
        snapLocs.forEach((snapLoc) => {
          const snapLocJson = snapLoc.toJson();
          if (snapMap[snapLocJson.UNIQUE_ID] === undefined) {
            snapMap[snapLocJson.UNIQUE_ID] = snapLocJson;
          }
        });
      });
      json.snapLocations = Object.values(snapMap);
      json._TYPE = this.constructor.name;
      return json;
    }

    this.push = (...points) => {
      points = Array.isArray(points) ? points : [points];
      points.forEach((point) => {
        if (startVertex === undefined) {
          startVertex = Vertex2D.instance(point);
          endVertex = startVertex;
        } else {
          endVertex = endVertex.nextVertex(point, Wall2D);
        }
      });
    }

    this.addObject = (id) => {
      const center = Vertex2D.center.apply(null, this.verticies())
      const obj = new Object2d(center, this);
      obj.id(id);
      this.objects().push(obj);
      return obj;
    }

    this.remove = (id) => {
      id = id instanceof Lookup ? id.id() : id;
      const idMap = {};
      const walls = this.walls();
      const wallCount = walls.length;
      walls.forEach((wall) => {
        idMap[wall.id()] = wall;
        idMap[wall.endVertex().id()] = wall.endVertex();
        wall.windows().forEach((window) => idMap[window.id()] = window);
        wall.windows().forEach((window) => idMap[window.id()] = window);
        wall.doors().forEach((door) => idMap[door.id()] = door);
      });
      const item = idMap[id];
      if (item === undefined) throw new Error(`Unknown id: ${id}`);
      if (wallCount < 3 && (item instanceof Wall2D || item instanceof Vertex2D))
          throw new Error('Cannot Remove any more verticies or walls');
      if (startVertex.id() === id) startVertex = startVertex.nextVertex();
      if (item instanceof Wall2D && item.endVertex().id() === startVertex.id())
          startVertex = startVertex.nextVertex();
      item.remove();
    }

    if (!initialized) this.push({x:0, y:0}, {x:ww, y:0}, {x:ww,y:ww}, {x:0,y:ww});
    startVertex.enclose(Wall2D);
    this.walls = () => startVertex.lines();
    this.verticies = () => startVertex.verticies();
    this.within = (vertex, print) => {
      vertex = vertex instanceof Vertex2D ? vertex.point() : vertex;
      if (!startVertex.isEnclosed()) return false;
      const endpoint = {x: 0, y: 0};
      this.verticies().forEach(vertex => {
        endpoint.x -= vertex.x();
        endpoint.y -= vertex.y();
      });
      const escapeLine = new Line2D(vertex, endpoint);
      const intersections = [];
      let onLine = false;
      const allIntersections = [];
      this.walls().forEach((wall) => {

        const intersection = wall.findIntersection(escapeLine, true);
        allIntersections.push(intersection);
        if (intersection) {
          const xEqual = approximate.eq(intersection.x, vertex.x);
          const yEqual = approximate.eq(intersection.y, vertex.y);
          if (xEqual && yEqual) onLine = true;
          intersections.push(intersection);
        }
      });

      return onLine || intersections.length % 2 === 1;
    }

    history = history instanceof StateHistory ? history : new StateHistory(this.toJson);
    this.history = () => history;
  }
}

Layout2D.fromJson = (json, history) => {
  Object.fromJson(json.walls);
  const verticies = [];
  for (let index = 0; index < json.verticies.length; index += 1) {
    const jsonVert = json.verticies[index];
    const vertex = Vertex2D.fromJson(jsonVert);
    verticies.push(vertex);
  }
  const layout = new Layout2D(verticies[0], verticies[verticies.length - 1], undefined, history);
  layout.id(json.id);
  layout.objects(Object.fromJson(json.objects));
  json.snapLocations.forEach((snapLocJson) => {
    const snapLoc1 = Lookup.get(snapLocJson[0].objectId)[snapLocJson[0].location]();
    const snapLoc2 = Lookup.get(snapLocJson[1].objectId)[snapLocJson[1].location]();
    snapLoc2.pairWith(snapLoc1);
  });

  layout.id(json.id);
  return layout;
}

new Layout2D();
new Object2d();
new Snap2D();
new Square2D();

Layout2D.Vertex2D = Vertex2D;
Layout2D.Wall2D = Wall2D;
Layout2D.Line2D = Line2D;
Layout2D.Plane2D = Plane2D;
Layout2D.Window2D = Window2D;
Layout2D.Square2D = Square2D;
Layout2D.Circle2D = Circle2D;
Layout2D.Object2d = Object2d;
Layout2D.Door2D = Door2D;
Layout2D.SnapLocation2D = SnapLocation2D;
Layout2D.LineMeasurement2D = LineMeasurement2D;
module.exports = Layout2D;
