
const Vertex2d = require('./vertex');
const Circle2d = require('./circle');
const ToleranceMap = require('../../../tolerance-map.js');
const Tolerance = require('../../../tolerance.js');
const tol = .001;
const withinTol = Tolerance.within(tol);

class Line2d {
  constructor(startVertex, endVertex) {
    if (startVertex instanceof Line2d) return startVertex;
    if (Array.isArray(startVertex)) {
      endVertex = startVertex[1];
      startVertex = startVertex[0];
    }
    startVertex = new Vertex2d(startVertex);
    endVertex = new Vertex2d(endVertex);
    const measureTo = [];
    const instance = this;

    function svFunc(newVertex) {
      if (newVertex instanceof Vertex2d) {
        startVertex = newVertex;
      }
      return startVertex;
    }
    function evFunc(newVertex) {
      if (newVertex instanceof Vertex2d) {
        endVertex = newVertex;
      }
      return endVertex;
    }

    Object.defineProperty(this, '0', {
      get: svFunc,
      set: svFunc
    });
    Object.defineProperty(this, '1', {
      get: evFunc,
      set: evFunc
    });

    this.mirrorPoints = (points) => {
      for (let index = 0; index < points.length; index++) {
        const point = points[index];
        const perpLine = this.perpendicular(1000, point);
        const closestPoint = this.closestPointOnLine(perpLine[1]);
        const intersectLine = new Line2d(point, closestPoint);
        const dist = intersectLine.length() * 2;
        const rads = intersectLine.radians();
        const mirrored = Line2d.startAndTheta(point, rads, dist)[1];
        point.point(mirrored.point());
      }
    }

    this.mirrorX = (points) => {
      const ev = this[0].translate(0, 10, true);
      const mirror = new Line2d(this[0], ev);
      mirror.mirrorPoints([this[0], this[1]]);
    }
    this.mirrorY = (points) => {
      const ev = this[0].translate(10, 0, true);
      const mirror = new Line2d(this[0], ev);
      mirror.mirrorPoints([this[0], this[1]]);
    }

    this.rise = () => this[1].y - this[0].y;
    this.run = () =>  this[1].x - this[0].x;

    function changeLength(value) {
      const circle = new Circle2d(value, instance[0]);
      const points = circle.intersections(instance);
      const dist0 = instance[1].distance(points[0]);
      const dist1 = instance[1].distance(points[1]);
      if (dist1 < dist0) {
        instance[1].point(points[1]);
      } else {
        instance[1] = points[0];
      }
    }

    this.isVertical = () => this.slope() > 1000;
    this.isHorizontal = () => Math.abs(this.slope()) < .001;

    this.withinDirectionalBounds = (point, limit) => {
      point = new Vertex2d(point);
      const withinLimit = limit === undefined || (limit > point.y && limit > point.x);
      if (withinLimit && this.withinSegmentBounds(point)) return true;
      const offsetPoint = Line2d.startAndTheta(point, this.radians(), .0000001)[1];
      if (this[0].distance(point) > this[0].distance(offsetPoint)) return false;
      return withinLimit;
    }

    this.withinSegmentBounds = (pointOline) => {
      let isWithin = false;
      let path = -1;
      if (pointOline instanceof Line2d) {
        const l = pointOline
        const slopeEqual = withinTol(this.slope(), l.slope());
        const c = l.midpoint();
        const xBounded = c.x < this.maxX() + tol && c.x > this.minX() - tol;
        const yBounded = c.y < this.maxY() + tol && c.y > this.minY() - tol;
        if (slopeEqual && xBounded && yBounded) {
          isWithin = true;
          path = 0
        } else {
          path = 1;
          isWithin = this.withinSegmentBounds(l[0]) || this.withinSegmentBounds(l[1]) ||
                l.withinSegmentBounds(this[0]) || l.withinSegmentBounds(this[1]);
        }
      } else {
        path = 2;
        let point = new Vertex2d(pointOline);
        isWithin = this.minX() - tol < point.x && this.minY() - tol < point.y &&
          this.maxX() + tol > point.x && this.maxY() + tol > point.y;
      }
      return isWithin;
    }


    function reconsileLength (newLength) {
      const moveVertex = instance[1];
      const nextLine = moveVertex.nextLine()
      if (nextLine === undefined) changeLength(newLength);

      const vertex1 = nextLine[1];
      const circle1 = new Circle2d(nextLine.length(), vertex1);
      const vertex2 = instance[0];
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

    this.translate = (line, doNotModify) => {
      const target = doNotModify ? this.clone() : this;
      const xOffset = line[1].x - line[0].x;
      const yOffset = line[1].y - line[0].y;
      target[0].translate(xOffset, yOffset);
      target[1].translate(xOffset, yOffset);
      return target;
    }

    this.length = (value) => {
      value = Number.parseFloat(value);
      if (!Number.isNaN(value) && value !== 0) {
        const sv = this[0];
        const x = value * Math.cos(this.radians()) + sv.x;
        const y = value * Math.sin(this.radians()) + sv.y;
        this[1].point({x,y});
      }
      const a = this[1].x - this[0].x;
      const b = this[1].y - this[0].y;
      return Math.sqrt(a*a + b*b);
    }

    function getSlope(v1, v2) {
      return Line2d.getSlope(v1.x, v1.y, v2.x, v2.y);
    }

    function getB(x, y, slope) {
      if (slope === 0) return y;
      else if (Math.abs(slope) === Infinity) {
        if (instance[0].x === 0) return 0;
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
      const x = (this[1].x + this[0].x)/2;
      const y = (this[1].y + this[0].y)/2;
      return new Vertex2d({x,y});
    }

    this.bisector = (other, dist) => {
      const intersection = this.findIntersection(other);
      if (!intersection) return null;
      if (intersection === Infinity) return this.clone();
      const negAcquiesed = other.acquiescent(this).negitive();
      const radians = (this.radians() + negAcquiesed.radians()) / 2;
      const bisector = Line2d.startAndTheta(intersection, radians, dist);
      const bev = bisector[1];
      const startDist = this[0].distance(intersection);
      const endDist = this[1].distance(intersection);
      const furthestVertId = startDist > endDist ? '0' : '1';

      const negBisector = Line2d.startAndTheta(intersection, radians + Math.PI, dist);
      const dist1 = bisector[1].distance(this[furthestVertId]) +
                    bisector[1].distance(negAcquiesed[furthestVertId]);
      const dist2 = negBisector[1].distance(this[furthestVertId]) +
                    negBisector[1].distance(negAcquiesed[furthestVertId]);
      return dist1 < dist2 ? bisector : negBisector;
    }

    this.closestEnds = (other) => {
      const tsv = this[0];
      const osv = other[0];
      const tev = this[1];
      const oev = other[1];

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
      // return Math.mod(Math.abs(this.radians() + 2*Math.PI - other.radians()) + 2*Math.PI, 2*Math.PI);
      if (!(other instanceof Line2d)) throw new Error('Cannot calculate thetaBetween if arg1 is not an instanceof Line2d');
      let theta;
      let theta1 = this.radians();
      let closestEnds = this.closestEnds(other);
      if (closestEnds.indexOf(this[0]) !== -1) {
        theta1 += Math.PI;
      }
      let theta2 = other.radians();
      if (closestEnds.indexOf(other[0]) !== -1) {
        theta2 += Math.PI;
      }

      if (theta1 > theta2) {
        theta = theta2 - theta1 + Math.PI * 2;
      } else {
        theta = theta2 - theta1;
      }
      return theta % (2 * Math.PI)
    }

    this.acute = (other) => this.radians.difference(other);
    this.obtuse = (other) => 2*Math.PI - this.acute(other);

    this.clockwise = (center) => {
      center ||= new Vertex2d(0,0);
      const radial1 = new Line2d(center, this[0]);
      const radial2 = new Line2d(center, this[1]);
      return withinTol(radial1.acute(radial2), radial2.thetaBetween(radial1));
    }

    this.yIntercept = () => getB(this[0].x, this[0].y, this.slope());
    this.slope = () => getSlope(this[0], this[1]);
    this.y = (x) => {
      if (x === undefined) x = this[0].x;
      const slope = this.slope();
      if (slope === Infinity) return Infinity;
      if (slope === 0) return this[0].y;
      return  (this.slope()*x + this.yIntercept());
    }

    this.x = (y) => {
      if (y === undefined) y = this[0].y;
      const slope = this.slope();
      if (slope === Infinity) return this[0].x;
      if (slope === 0) {
        return Infinity;
      }
      return (y - this.yIntercept())/slope;
    }

    this.isOn = (vertexOvertices) => {
      if (Array.isArray(vertexOvertices)) {
        const vertices = vertexOvertices;
        const liesOn = [];
        for (let index = 0; index < vertices.length; index += 1) {
          if (this.isOn(vertices[index])) {
            liesOn.push(vertices[index]);
          }
        }
        liesOn.sort(Vertex2d.sort);
        return liesOn;
      }
      const vertex = vertexOvertices;
      const y = this.y(vertex.x);
      return (withinTol(y, vertex.y) || Math.abs(y) === Infinity) && this.withinSegmentBounds(vertex);
    }

    this.measureTo = (verts) => {
      if (Array.isArray(verts)) {
        verts = this.liesOn(verts);
        measureTo.concatInPlace(verts);
      }
      return measureTo;
    }

    this.maxDem = () => this.y > this.x ? this.y : this.x;
    this.minDem = () => this.y < this.x ? this.y : this.x;

    this.closestPointOnLine = (vertex, segment) => {
      vertex = (vertex instanceof Vertex2d) ? vertex : new Vertex2d(vertex);
      const perpLine = this.perpendicular(undefined, vertex, true);
      const perpSlope = perpLine.slope();
      const slope = this.slope();
      let x, y;
      if (!Number.isFinite(slope)) {
        x = this[0].x;
        y = vertex.y;
      } else if (!Number.isFinite(perpSlope)) {
        x = vertex.x;
        y = this[0].y;
      } else {
        x = newX(slope, perpSlope, this.yIntercept(), perpLine.yIntercept());
        y = this.y(x);
      }
      const closestPoint = new Vertex2d({x, y});
      if (!segment || this.withinSegmentBounds(closestPoint)) return closestPoint;
      return false;
    }

    this.closestVertex = (vertex) => {
      const sv = this[0]
      const ev = this[1]
      return sv.distance(vertex) < ev.distance(vertex) ? sv : ev;
    }
    this.furthestVertex = (vertex) => {
      const sv = this[0]
      const ev = this[1]
      return sv.distance(vertex) > ev.distance(vertex) ? sv : ev;
    }

    const leftRightTol = .000001;
    function rightLeftInfo(vertex) {
      const closestPoint = instance.closestPointOnLine(vertex);
      const perp = instance.perpendicular(vertex.distance(closestPoint)/2, closestPoint, true);
      const distStart = vertex.distance(perp[0]);
      const distEnd = vertex.distance(perp[1]);
      return {distStart, distEnd, inconclusive: Math.abs(distStart - distEnd) < leftRightTol};
    }
    function isRight(info) {
      return !info.inconclusive && info.distStart < info.distEnd;
    }
    this.isRight = (vertex) => isRight(rightLeftInfo(vertex));
    this.isLeft = (vertex) => {
      const info = rightLeftInfo(vertex);
      return !info.inconclusive && info.distStart > info.distEnd;
    }
    this.direction = (vertOline) => {
      if (vertOline instanceof Vertex2d) {
        const info = rightLeftInfo(vertOline);
        return info.inconclusive ? 'on' : (isRight(info) ? 'right' : 'left');
      } else if (vertOline instanceof Line2d) {
        const startDir = this.direction(vertOline[0]);
        const endDir = this.direction(vertOline[1]);
        if (startDir === 'on' || endDir === 'on' || startDir !== endDir) return 'across';
        return startDir;
      }
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
        // return new Line2d(right[1], left[1]);
        return new Line2d(left[1], right[1]);
        // return right.combine(left);
      }
      return Line2d.startAndTheta(mp, rotated.radians(), distance);
    }

    this.perpendicular.connect = (vertex) => {
      const perpLine = this.perpendicular(null, vertex);
      const intersection = perpLine.findIntersection(this);
      return new Line2d(intersection, vertex);
    }

    this.rotate = (radians, pivot) => {
      pivot ||= this.midpoint();
      this[0].rotate(radians, pivot);
      this[1].rotate(radians, pivot);
      return this;
    }

    this.vertical = () => this.slope() === Infinity;


    const consideredInfinity = 1000000000;
    const NaNfinity = (x,y) => Number.NaNfinity(x,y) ||
                                Math.abs(x) > consideredInfinity ||
                                Math.abs(y) > consideredInfinity;
    this.findIntersection = (line) => {
      if (this.slope() === 0 && line.slope() === 0) {
        if (this.yIntercept() === line.yIntercept()) return Infinity;
        return false;
      }

      if (this.vertical() && line.vertical()) {
        if (this[0].x === line[0].x) return Infinity;
        return false;
      }

      if (withinTol(line.radians(), this.radians()) &&
              withinTol(line.yIntercept(), this.yIntercept())) {
        return Infinity;
        // return Vertex2d.center(line[0], this[0], line[1], this[1]);
      }
      const slope = this.slope();
      const lineSlope = line.slope();
      let x, y;
      if (!Number.isFinite(slope)) {
        x = this[0].x;
        y = line.y(x);
      } else if (!Number.isFinite(lineSlope)) {
        x = line[0].x;
        y = this.y(x);
      } else if (slope === 0) {
        y = this[0].y;
        x = line.x(y);
      } else if (lineSlope === 0) {
        y = line[0].y;
        x = this.x(y);
      } else {
        x = newX(slope, lineSlope, this.yIntercept(), line.yIntercept());
        y = this.y(x);
      }
      if (NaNfinity(x,y)) return false;
      if (!Line2d.withinLineBounds(new Vertex2d(x,y), this, line)) {
        console.warn('intersection malfunction');
      }

      return new Vertex2d({x,y});
    }

    this.findDirectionalIntersection = (line, limit) => {
      const intersection = this.findIntersection(line);
      if (intersection === Infinity) return Infinity;
      if (intersection && this.withinDirectionalBounds(intersection, limit)) return intersection;
      return false;
    }

    this.findSegmentIntersection = (line, both) => {
      const intersection = this.findIntersection(line);
      if (!intersection) return false;
      if (intersection === Infinity) {
        if (this.withinSegmentBounds(line)) {
          if (this.isPoint()) return this[0];
          if (line.isPoint()) return line[0];
          const acqui = line.alignRadially(this);
          const startEqual = acqui[0].equals(this[0]);
          const endEqual = acqui[1].equals(this[0]);
          if ((startEqual && endEqual) || !(startEqual && endEqual)) return Infinity;
          const acquiEndIsOn = this.isOn(acqui[1]) || acqui.isOn(this[1]);
          if (startEqual) return acquiEndIsOn ? Infinity : this[0];
          const acquiStartIsOn = this.isOn(acqui[0]) || acqui.isOn(this[0]);
          if (endEqual) return acquiStartIsOn ? Infinity : this[1];
          throw new Error('This shouldnt happen 12/03/23');
        }
        return false;
      }
      if (!both && this.withinSegmentBounds(intersection)) {
        return intersection;
      }
      if (this.withinSegmentBounds(intersection) && line.withinSegmentBounds(intersection)) {
        return intersection;
      }
      return false;
    }

    this.distance = (other, segment) => {
      segment = segment === false ? false : true;
      if (other instanceof Vertex2d) {
        const point =  this.closestPointOnLine(other, segment);
        if (point) return point.distance(other);
        const dist1 = this[0].distance(other);
        const dist2 = this[1].distance(other);
        return dist1 > dist2 ? dist2 : dist1;
      }
      if (other instanceof Line2d) {
        if (this.findSegmentIntersection(other, true)) return 0;
        const dist1 = this.distance(other[0], segment);
        const dist2 = this.distance(other[1], segment);
        const dist3 = other.distance(this[0], segment);
        const dist4 = other.distance(this[1], segment);
        return Math.min(...[dist1,dist2,dist3,dist4].filter((d) => Number.isFinite(d)));
      }
    }

    this.minX = () => this[0].x < this[1].x ?
                        this[0].x : this[1].x;
    this.minY = () => this[0].y < this[1].y ?
                        this[0].y : this[1].y;
    this.maxX = () => this[0].x > this[1].x ?
                        this[0].x : this[1].x;
    this.maxY = () => this[0].y > this[1].y ?
                        this[0].y : this[1].y;
    this.withinLineBounds = (vertex) => {
      if (this.slope() > consideredInfinity)
        return vertex.x > this[0].x - tol && vertex.x < this[0].x + tol;
      if (this.slope() === 0)
        return vertex.y > this[0].y - tol && vertex.y < this[0].y + tol;
      return true;
    }
    this.angle = () => {
      return Math.toDegrees(this.radians());
    }
    this.radians = () => {
      const deltaX = this[1].x - this[0].x;
      const deltaY = this[1].y - this[0].y;
      return Math.atan2(deltaY, deltaX);
    }

    const radianAddSub = (multiplier) => (otherOrads) => {
      const otherRads = otherOrads instanceof Line2d ? otherOrads.radians() : otherOrads;
      return Math.mod(Math.abs(this.radians() + 2*Math.PI + multiplier*otherRads) + 2*Math.PI, 2*Math.PI);
    }
    this.radians.add = radianAddSub(1);
    this.radians.sub = radianAddSub(-1);
    this.radians.abs = (otherOrads) => Math.abs(this.radians.add(otherOrads));
    this.radians.difference = (otherOrads) => {
      const rads = this.radians();
      const otherRads = otherOrads instanceof Line2d ? otherOrads.radians() : otherOrads;
      let diff = Math.difference(rads, otherRads);
      diff = Math.mod(diff + Math.PI, Math.PI * 2) - Math.PI;
      return diff;
    }

    this.radians.positive = () => Math.mod(this.radians(), Math.PI, tol);
    this.degrees = () => Math.toDegrees(this.radians());

    // Positive returns right side.
    this.parrelle = (distance, midpoint, length) => {
      if (distance === 0) return this.copy();
      if ((typeof distance) !== 'number') throw new Error('distance (arg1) must be of type number && a non-zero value');
      length ||= this.length();
      midpoint ||= this.midpoint();
      const perpLine = this.perpendicular(distance * 2, midpoint, true);
      let targetPoint = perpLine[0];
      if (distance < 0) targetPoint = perpLine[1];
      const radians = this.radians();
      const halfLine1 = Line2d.startAndTheta(targetPoint, radians, length/2);
      const halfLine2 = Line2d.startAndTheta(targetPoint, radians, length/-2);
      const parrelle = halfLine1.combine(halfLine2);
      return Math.abs(parrelle.radians() - this.radians()) < Math.PI12 ? parrelle : parrelle.negitive();
    }

    this.isParrelle = (other) => {
      return Math.modTolerance(this.radians(), other.radians(), Math.PI, tol);
    }

    this.equals = (other) => {
      if (!(other instanceof Line2d)) return false;
      if (other === this) return true;
      return this[0].equals(other[0]) && this[1].equals(other[1]);
    }

    this.equivalent = (other) => this.equals(other) || this.equals(other.negitive());

    const withinPointTol = Tolerance.within(.001);
    this.isPoint = () => withinPointTol(this.length(), 0);
    this.clean = (other) => {
      if (!(other instanceof Line2d)) return;
      if (other[0].equals(other[1])) return this;
      if (this[0].equals(this[1])) return other;
      if (this.toString() === other.toString() || this.toString() === other.toNegitiveString()) return this;
      if (this.isPoint()) return other;
      if (other.isPoint()) return this;
    }

    this.copy = () => {
      const l = new Line2d(this[0].copy(), this[1].copy());
      l.label = this.label;
      return l;
    }

    this.combine = (other, tolerance, notSegment) => {
      if (!(other instanceof Line2d)) return;
      const clean = this.clean(other);
      if (clean) return clean;
      if (!withinTol(this.slope(), other.slope())) return;
      const otherNeg = other.negitive();
      const outputWithinTol = withinTol(this.y(other.x()), other.y(other.x())) &&
	                    withinTol(this.x(other.y()), other.x(other.y()));
      if (!outputWithinTol) return;
      const v1 = this[0];
      const v2 = this[1];
      const ov1 = other[0];
      const ov2 = other[1];
      if (notSegment !== true && !this.withinSegmentBounds(other)) {
        return;
      }
      // Fix sort method
      const vs = Vertex2d.sortByMax([v1, v2, ov1, ov2]);
      const combined = new Line2d(vs[0], vs[vs.length - 1]);
      return withinTol(this.radians(), combined.radians()) ? combined : combined.negitive();
    }

    this.isEndpoint = (vertex) => this[0].equals(vertex) || this[1].equals(vertex);
    this.sortVerticies = (vertices) =>
      vertices.sort((v1,v2) => this[0].distance(v1) - this[0].distance(v2))

    this.slice = (lines) => {
      if (this.isPoint()) return null;
      lines = lines.filter(l => !withinTol(this.radians.difference(l), 0));
      const intersections = {};
      for (let index = 0; index < lines.length; index++) {
        if (!this.isParrelle(lines[index])) {
          const intersect = this.findSegmentIntersection(lines[index], true);
          if (intersect instanceof Vertex2d && !this.isEndpoint(intersect)) {
            intersections[intersect.toString()] = intersect;
          }
        }
      }

      const list = Object.values(intersections);
      this.sortVerticies(list);
      if (list.length === 0) return null;
      const fractured = [];
      let prevVert = this[0].copy();
      for (let index = 0; index < list.length; index++) {
        const currVert = list[index];
        const line = new Line2d(prevVert, currVert);
        if (!line.isPoint()) {
          fractured.push(line);
          prevVert = currVert;
        }
      }
      const lastLine = new Line2d(prevVert, this[1].copy());
      if (!lastLine.isPoint()) fractured.push(lastLine);
      return fractured;
    }

    this.scale = (scale , doNotModify) => {
      if (doNotModify === true) return this.clone().scale(scale);
      this[0].scale(scale);
      this[1].scale(scale);
      return this;
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
      const sv = {x: midPoint.x - xOffsetBack, y: midPoint.y - yOffsetBack};
      const ev = {x: midPoint.x - xOffsetFront, y: midPoint.y - yOffsetFront};
      const line = new Line2d(sv, ev);
      return withinTol(line.radians(), this.radians()) ? line : line.negitive();
    }

    this.move = (center) => {
      const mouseLocation = new Vertex2d(center);
      const perpLine = this.perpendicular(undefined, mouseLocation);
      const interX = this.findIntersection(perpLine);
      const diffLine = new Line2d(interX, mouseLocation);
      const rads = diffLine.radians();
      const xDiff = Math.cos(rads)*diffLine.length();
      const yDiff = Math.sin(rads)*diffLine.length();
      const sv = this[0];
      const newStart = {x: sv.x + xDiff, y: sv.y + yDiff};
      const ev = this[1];
      const newEnd = {x: ev.x + xDiff, y: ev.y + yDiff};
      this[0].x = newStart.x;
      this[0].y = newStart.y;
      this[1].x = newEnd.x;
      this[1].y = newEnd.y;
    };

    // Ensures returnLine startVertex is closer to trendSetter endVertex.
    // Get In Line
    this.acquiescent = (trendSetter) => {
      if (!(trendSetter instanceof Line2d)) return this;
      const shouldReverse = trendSetter[1].distance(this[1]) <
                            trendSetter[1].distance(this[0]);
                            return shouldReverse ? this.negitive() : this.clone();
    }

    this.alignRadially = (trendSetter) => {
      if (!(trendSetter instanceof Line2d)) return this;
      const shouldReverse = this.radians.abs(trendSetter) > Math.PI;
      return shouldReverse ? this.negitive() : this.clone();
    }

    this.invert = (condition) => {
      if (condition === undefined || condition) {
        const sv = this[0].clone();
        const ev = this[1].clone();
        this[0].point(ev.point());
        this[1].point(sv.point());
      }
    }

    this.clone = this.copy;

    this.negitive = () => new Line2d(this[1], this[0]);
    this.toString = (percision) => `[${this[0].toString(percision)} , ${this[1].toString(percision)}]`;
    this.toInfoString = () => `slope: ${this.slope()}\n` +
                        `angle: ${this.angle()}\n` +
                        `segment: ${this.toString()}`;
    this.toNegitiveString = () => `[${this[1].toString()}, ${this[0].toString()}]`;
  }
}

Line2d.reusable = true;
Line2d.startAndTheta = (startVertex, theta, dist) => {
  dist ||= 100;
  startVertex = new Vertex2d(startVertex);
  const end = {
    x: startVertex.x + dist * Math.cos(theta),
    y: startVertex.y +dist*Math.sin(theta)
  };
  return new Line2d(startVertex.point(), end);
}
Line2d.instance = (startV, endV, group) => {
  const line = Lookup.instance(Line2d.name);
  line.lookupGroup(group);
  (line[0] = new Vertex2d(startV)).lookupGroup(group);
  (line[1] = new Vertex2d(endV)).lookupGroup(group);
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

const distanceObj = (line, trendLine) => ({
  line: line.acquiescent(trendLine),
  distance: line.distance(vertex),
  deltaRad: trendLine.radians.difference(line)
});

Line2d.vertices = (lines) => {
  const verts = {};
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const sv = line[0];
    const ev = line[1];
    verts[sv.id()] = sv;
    verts[ev.id()] = ev;
  }
  return Object.values(verts);
}

Line2d.center = (lines) => Vertex2d.center(Line2d.vertices(lines));

Line2d.rotate = (lines, radians, pivot) => lines.forEach(l => l.rotate(radians, pivot));

Line2d.consolidate = (lines, tolerance, notSegment) => {
  tolerance ||= tol;
  const tolMap = new ToleranceMap({'slope()': `+.001`, 'yIntercept()': tolerance});
  const lineMap = {};
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].isPoint()) {
      tolMap.add(lines[index]);
    }
  }
  let minList = [];
  const combinedKeys = {};
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const matches = tolMap.matches(line);
    const mapId = tolMap.tolerance().boundries(line);
    if (!combinedKeys[mapId]) {
      combinedKeys[mapId] = true;
      let lastIndex;
      for (let tIndex = 0; tIndex < matches.length; tIndex += 1) {
        let target = matches[tIndex];
        let found = false;
        for (let mIndex = tIndex + 1; mIndex < matches.length; mIndex += 1) {
          const combined = target.combine(matches[mIndex], tolerance, notSegment);
          if (combined) {
            found = true;;
            const m = matches[mIndex];
            matches.splice(mIndex, 1);
            matches[tIndex] = combined;
            target = combined;
            mIndex = tIndex;
          }
        }
        if (found) tIndex--;
      }
      minList = minList.concat(matches);
    }
  }

  const strMap = {};
  minList = minList.filter((l) => {
    const str = l.toString();
    if (strMap[str]) return false;
    return strMap[str] = true;
  });
  return minList;
}

Line2d.unique = (lines) => {
  const tolMap = new ToleranceMap({'slope()': `+.001`});
  tolMap.addAll(lines);
  const unique = [];
  const sets = tolMap.group();
  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    unique.push(set[0]);
    for (let j = 1; j < set.length; j++) {
      const target = set[j];
      let add = true;
      for (let k = 0; k < unique.length; k++) {
        add &&= target.combine(unique[k], null, true) === undefined;
      }
      if (add) unique.push(target);
    }
  }
  return unique;
}

const within = Tolerance.within(.00001);
Line2d.favored = (trendLine,lines) => {
  if (lines.length < 2) return lines[0].acquiescent(trendLine);
  const best = distanceObj(lines[0], trendLine);
  for (let index = 1; index < lines.length; index++) {
    const curr = distanceObj(line[index], trendLine);
    const closer = within(curr.distance, best.distance) || curr.distance < best.distance;
    const straighter = within(curr.deltaRad, best.deltaRad) || curr.deltaRad < best.deltaRad;
    if (straighter && closer) best = curr;
  }
  return best.line;
}

Line2d.withinLineBounds = (vertex, ...lines) => {
  for (let index = 0; index < lines.length; index++) {
    if (!lines[index].withinLineBounds(vertex)) return false;
  }
  return true;
}

const vertDistObj = (line, vertex, index) => {
  const dist0 = line[0].distance(vertex);
  const dist1 = line[1].distance(vertex);
  if (dist0 > dist1) return {line, index, furthest: line[0], distance: dist0};
  else return {line, index, furthest: line[1], distance: dist1};
}
const centerThetaDiff = (vertex, vertDistObj) => {
  const vertToFur = new Line2d(vertex, vertDistObj.furthest);
  vertDistObj.acute = vertToFur.acute(vertDistObj.line);
}

Line2d.isolateFurthestLine = (vertex, lines) => {
  let max = vertDistObj(lines[0], vertex, 0);
  centerThetaDiff(vertex, max);
  for (let index = 1; index < lines.length; index++) {
    let curr = vertDistObj(lines[index], vertex, index);
    if (curr.distance > max.distance ||
          (curr.furthest.equals(max.furthest) && max.acute < curr.acute)) {
      max = curr;
      centerThetaDiff(vertex, max);
    }
  }
  return max.line;
}

Line2d.getSlope = function(x1, y1, x2, y2) {
  const slope = (y2 - y1) / (x2 - x1);
  if (Number.NaNfinity(slope) || slope > 10000 || slope < -10000) return Infinity;
  if (slope > -0.00001 && slope < 0.00001) return 0;
  return slope;
}

Line2d.toleranceMap = (tol, startEndBoth, lines) => {
  tol ||= .01;
  lines ||= [];
  const tolAttrs = {};
  const both = startEndBoth !== true && startEndBoth !== false;
  if (both || startEndBoth === true) {
    tolAttrs['0.x'] = tol;
    tolAttrs['0.y'] = tol;
  }
  if (both || startEndBoth === false) {
    tolAttrs['1.x'] = tol;
    tolAttrs['1.y'] = tol;
  }
  const map = new ToleranceMap(tolAttrs);
  for (let index = 0; index < lines.length; index++) {
    map.add(lines[index]);
    if (!both) map.add(lines[index].negitive());
  }
  return map;
}

Line2d.sliceAll = (lines) => {
  const fractured = [];
  for (let index = 0; index < lines.length; index++) {
    const sliced = lines[index].slice(lines);
    if (sliced) fractured.concatInPlace(sliced);
    else fractured.push(lines[index]);
  }
  return fractured;
}

Line2d.toDrawString = (lines, ...colors) => {
  let str = '';
  lines.forEach((l,i) => {
    color = colors[i%colors.length] || '';
    str += `${color}[${l[0].toString()},${l[1].toString()}],`;
  });
  return str.substr(0, str.length - 1);
}

Line2d.toString = (lines) => {
  let str = '';
  for (let index = 0; index < lines.length; index++) {
    str += `[${lines[index][0].toString()}, ${lines[index][1].toString()}],`;
  }
  return str.substring(0, str.length - 1);
}

const pathReg = /\[.*?\]/g;
const vertRegStr = "\\(([0-9]*(\\.[0-9]*|)),\\s*([0-9]*(\\.[0-9]*|))\\)";
const vertReg = new RegExp(vertRegStr);
const vertRegG = new RegExp(vertRegStr, 'g');

function sectionFromString(str, lines) {
  const vertStrs = str.match(vertRegG);
  let prevVert;
  const verts = vertStrs.map((str) => {
    const match = str.match(vertReg);
    const currVert = new Vertex2d(Number.parseFloat(match[1]), Number.parseFloat(match[3]));
    if (prevVert) lines.push(new Line2d(prevVert, currVert));
    prevVert = currVert;
  });
  return prevVert;
}

Line2d.parrelleSets = (lines, tolerance) => {
  tolerance ||= tol;
  const tolmap = new ToleranceMap({'slope': `+${tolerance}`});
  tolmap.addAll(lines);
  const groups = tolmap.group().sortByAttr('length').reverse();
  return groups;
}

Line2d.fromString = (str) => {
  const lines = [];
  const sections = str.match(pathReg) || [str];
  let prevVert;
  for (let index = 0; index < sections.length; index++) {
    prevVert = sectionFromString(sections[index], lines);
  }
  return lines;
}

Object.class.register(Line2d, '1', '0', 'label');

Line2d.fromJson = (json) => {
  const svJson = json[0] || json.startVertex;
  const sv = new Vertex2d(svJson.point || svJson);
  const evJson = json[1] || json.endVertex;
  const ev = new Vertex2d(evJson.point || evJson);
  const line = new Line2d(sv, ev);
  line.label = json.label;
  return line;
}

Line2d.mirror = (lines) => {
  return Vertex2d.mirror(Line2d.vertices(lines));
}

Line2d.endpointDistanceSort = (target) => (l1,l2) => {
  const ds1 = target.distance(l1[0]);
  const ds2 = target.distance(l2[0]);
  const de1 = target.distance(l1[1]);
  const de2 = target.distance(l2[1]);
  return (ds1 < de1 ? ds1 : de1) - (ds2 < de2 ? ds2 : de2);
}

Line2d.distanceSort = (target, segment) => (l1,l2) => {
  if (target instanceof Line2d) {
    return target.distance(l1, segment) - target.distance(l2, segment);
  }
  return l1.distance(target, segment) - l2.distance(target, segment);
}


const perpInterSectDist = (line, vertex, other, perpendicular) => {
  if (perpendicular) line = line.perpendicular(null, vertex);
  const intersection = other.findSegmentIntersection(line);
  const dist = intersection ? vertex.distance(intersection) : null;
  return {intersection, dist, vertex, line, other};
}

function polarize(line, center, ccw) {
  ccw ||= false;
  const sl = new Line2d(center,line[0]);
  const el = new Line2d(center, line[1]);
  const invert = (invert) => invert === ccw && line.invert();
  if (el.degrees() > 270 && sl.degrees() >= 0 && sl.degrees() < 90) invert(false);
  else if (sl.degrees() > 270 && el.degrees() >= 0 && el.degrees() < 90) invert(true);
  else invert(sl.degrees() - el.degrees() < 0);
}


Line2d.translate = (lines, offset) => {
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    line[0].translate(offset.x, offset.y);
    line[1].translate(offset.x, offset.y);
  }
}

Line2d.centerOn = (lines, center) => {
  center = new Vertex2d(center);
  const currCenter = Vertex2d.center(Line2d.vertices(lines));
  const offset = {x: center.x - currCenter.x, y: center.y - currCenter.y};
  Line2d.translate(lines, offset);
  return offset;
}

Line2d.radialSorter = (center, ccw, degreesOstartpoint) => {
  let degrees = degreesOstartpoint;
  if (degrees instanceof Vertex2d) degrees = new Line2d(center.clone(), degreesOstartpoint).degrees();
  if (!Number.isFinite(degrees)) degrees = 0;
  const rads = -Math.toRadians(degrees);
  return (l1, l2) => {
    const isL1 = l1 instanceof Line2d;
    const isL2 = l2 instanceof Line2d;
    if (isL1) polarize(l1, center, ccw);
    if (isL2) polarize(l2, center, ccw);
    let line1 = new Line2d(center.clone(), isL1 ? l1.midpoint() : l1.clone());
    let line2 = new Line2d(center.clone(), isL2 ? l2.midpoint() : l2.clone());
    if (degrees) {
      line1.rotate(rads, center);
      line2.rotate(rads, center);
    }
    return !ccw ? line1.degrees() - line2.degrees() : line2.degrees() - line1.degrees();
  }
}

Line2d.radialSort = (linesOverts, ccw, center, degreesOstartpoint) => {
  center ||= Line2d.center(linesOverts);
  const sorter = Line2d.radialSorter(center, ccw, degreesOstartpoint);
  linesOverts.sort(sorter);
}

Line2d.between = (lineOvert1, lineOvert2) => {
  const lov1 = lineOvert1;
  const lov2 = lineOvert2;
  const isVert1 = lov1 instanceof Vertex2d;
  const isVert2 = lov2 instanceof Vertex2d;

  if (isVert1 && isVert2) {
    return new Line2d(lov1, lov2);
  }

  const isLine1 = lov1 instanceof Line2d;
  const isLine2 = lov2 instanceof Line2d;

  if (isLine1 && isLine2) {
    const list = [
      perpInterSectDist(lov1, lov1[0], lov2),
      perpInterSectDist(lov1, lov1[1], lov2),
      perpInterSectDist(lov2, lov2[0], lov1),
      perpInterSectDist(lov2, lov2[1], lov1),

      perpInterSectDist(lov1, lov1[0], lov2, true),
      perpInterSectDist(lov1, lov1[1], lov2, true),
      perpInterSectDist(lov2, lov2[0], lov1, true),
      perpInterSectDist(lov2, lov2[1], lov1, true)
    ];
    const best = list.filter(o => Number.isFinite(o.dist))
                      .sortByAttr('dist').filter(obj => obj.dist !== null)[0];
    if (best) return new Line2d(best.vertex, best.intersection);

    const intersection = lov1.findSegmentIntersection(lov2, true);
    if (intersection) return null;
    const closestEnds = lov1.closestEnds(lov2);
    return new Line2d(closestEnds[0], closestEnds[1]);
  }

  const vert = isVert1 ? lov1 : lov2;
  const line = isVert1 ? lov2 : lov1;
  const closest = line.closestPointOnLine(vert, true);
  return new Line2d(vert, closest);
}

new Line2d();

module.exports = Line2d;
