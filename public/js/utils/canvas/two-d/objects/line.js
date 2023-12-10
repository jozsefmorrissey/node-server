
const Vertex2d = require('./vertex');
const Circle2d = require('./circle');
const ToleranceMap = require('../../../tolerance-map.js');
const Tolerance = require('../../../tolerance.js');
const tol = .001;
const withinTol = Tolerance.within(tol);

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

    Object.defineProperty(this, '0', {
      get: this.startVertex,
      set: this.startVertex
    });
    Object.defineProperty(this, '1', {
      get: this.endVertex,
      set: this.endVertex
    });

    this.mirrorPoints = (points) => {
      for (let index = 0; index < points.length; index++) {
        const point = points[index];
        const perpLine = this.perpendicular(1000, point);
        const closestPoint = this.closestPointOnLine(perpLine.endVertex());
        const intersectLine = new Line2d(point, closestPoint);
        const dist = intersectLine.length() * 2;
        const rads = intersectLine.radians();
        const mirrored = Line2d.startAndTheta(point, rads, dist).endVertex();
        point.point(mirrored.point());
      }
    }

    this.mirrorX = (points) => {
      const endVertex = this.startVertex().translate(0, 10, true);
      const mirror = new Line2d(this.startVertex(), endVertex);
      mirror.mirrorPoints([this.startVertex(), this.endVertex()]);
    }
    this.mirrorY = (points) => {
      const endVertex = this.startVertex().translate(10, 0, true);
      const mirror = new Line2d(this.startVertex(), endVertex);
      mirror.mirrorPoints([this.startVertex(), this.endVertex()]);
    }

    this.rise = () => endVertex.y() - startVertex.y();
    this.run = () =>  endVertex.x() - startVertex.x();

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

    this.isVertical = () => this.slope() > 1000;
    this.isHorizontal = () => Math.abs(this.slope()) < .001;

    this.withinDirectionalBounds = (point, limit) => {
      point = new Vertex2d(point);
      const withinLimit = limit === undefined || (limit > point.y() && limit > point.x());
      if (withinLimit && this.withinSegmentBounds(point)) return true;
      const offsetPoint = Line2d.startAndTheta(point, this.radians(), .0000001).endVertex();
      if (this.startVertex().distance(point) > this.startVertex().distance(offsetPoint)) return false;
      return withinLimit;
    }

    this.withinSegmentBounds = (pointOline) => {
      let isWithin = false;
      let path = -1;
      if (pointOline instanceof Line2d) {
        const l = pointOline
        const slopeEqual = withinTol(this.slope(), l.slope());
        const c = l.midpoint();
        const xBounded = c.x() < this.maxX() + tol && c.x() > this.minX() - tol;
        const yBounded = c.y() < this.maxY() + tol && c.y() > this.minY() - tol;
        if (slopeEqual && xBounded && yBounded) {
          isWithin = true;
          path = 0
        } else {
          path = 1;
          isWithin = this.withinSegmentBounds(l.startVertex()) || this.withinSegmentBounds(l.endVertex()) ||
                l.withinSegmentBounds(this.startVertex()) || l.withinSegmentBounds(this.endVertex());
        }
      } else {
        path = 2;
        let point = new Vertex2d(pointOline);
        isWithin = this.minX() - tol < point.x() && this.minY() - tol < point.y() &&
          this.maxX() + tol > point.x() && this.maxY() + tol > point.y();
      }
      return isWithin;
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

    this.translate = (line) => {
      const xOffset = line.endVertex().x() - line.startVertex().x();
      const yOffset = line.endVertex().y() - line.startVertex().y();
      this.startVertex().translate(xOffset, yOffset);
      this.endVertex().translate(xOffset, yOffset);
      return this;
    }

    this.length = (value) => {
      value = Number.parseFloat(value);
      if (!Number.isNaN(value) && value !== 0) {
        const sv = this.startVertex();
        const x = value * Math.cos(this.radians()) + sv.x();
        const y = value * Math.sin(this.radians()) + sv.y();
        this.endVertex().point({x,y});
      }
      const a = this.endVertex().x() - this.startVertex().x();
      const b = this.endVertex().y() - this.startVertex().y();
      return Math.sqrt(a*a + b*b);
    }

    function getSlope(v1, v2) {
      return Line2d.getSlope(v1.x(), v1.y(), v2.x(), v2.y());
    }

    function getB(x, y, slope) {
      if (slope === 0) return y;
      else if (Math.abs(slope) === Infinity) {
        if (instance.startVertex().x() === 0) return 0;
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

    this.bisector = (other, dist) => {
      const intersection = this.findIntersection(other);
      if (!intersection) return null;
      if (intersection === Infinity) return this.clone();
      const negAcquiesed = other.acquiescent(this).negitive();
      const radians = (this.radians() + negAcquiesed.radians()) / 2;
      const bisector = Line2d.startAndTheta(intersection, radians, dist);
      const bev = bisector.endVertex();
      const startDist = this.startVertex().distance(intersection);
      const endDist = this.endVertex().distance(intersection);
      const furthestVertId = startDist > endDist ? 'startVertex' : 'endVertex';

      const negBisector = Line2d.startAndTheta(intersection, radians + Math.PI, dist);
      const dist1 = bisector.endVertex().distance(this[furthestVertId]()) +
                    bisector.endVertex().distance(negAcquiesed[furthestVertId]());
      const dist2 = negBisector.endVertex().distance(this[furthestVertId]()) +
                    negBisector.endVertex().distance(negAcquiesed[furthestVertId]());
      return dist1 < dist2 ? bisector : negBisector;
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

    this.acute = (other) => {
      const rads = Math.mod(Math.abs(this.radians() + 2*Math.PI - other.radians()) + 2*Math.PI, 2*Math.PI);
      return rads < Math.PI ? rads : 2*Math.PI - rads;
    }

    this.clockwise = (center) => {
      center ||= new Vertex2d(0,0);
      const radial1 = new Line2d(center, this.startVertex());
      const radial2 = new Line2d(center, this.endVertex());
      return withinTol(radial1.acute(radial2), radial2.thetaBetween(radial1));
    }

    this.yIntercept = () => getB(this.startVertex().x(), this.startVertex().y(), this.slope());
    this.slope = () => getSlope(this.startVertex(), this.endVertex());
    this.y = (x) => {
      if (x === undefined) x = this.startVertex().x();
      const slope = this.slope();
      if (slope === Infinity) return Infinity;
      if (slope === 0) return this.startVertex().y();
      return  (this.slope()*x + this.yIntercept());
    }

    this.x = (y) => {
      if (y === undefined) y = this.startVertex().y();
      const slope = this.slope();
      if (slope === Infinity) return this.startVertex().x();
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
      const y = this.y(vertex.x());
      return (withinTol(y, vertex.y()) || Math.abs(y) === Infinity) && this.withinSegmentBounds(vertex);
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

    this.closestVertex = (vertex) => {
      const sv = this.startVertex()
      const ev = this.endVertex()
      return sv.distance(vertex) < ev.distance(vertex) ? sv : ev;
    }
    this.furthestVertex = (vertex) => {
      const sv = this.startVertex()
      const ev = this.endVertex()
      return sv.distance(vertex) > ev.distance(vertex) ? sv : ev;
    }

    const leftRightTol = .000001;
    function rightLeftInfo(vertex) {
      const closestPoint = instance.closestPointOnLine(vertex);
      const perp = instance.perpendicular(vertex.distance(closestPoint)/2, closestPoint, true);
      const distStart = vertex.distance(perp.startVertex());
      const distEnd = vertex.distance(perp.endVertex());
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
        const startDir = this.direction(vertOline.startVertex());
        const endDir = this.direction(vertOline.endVertex());
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
        // return new Line2d(right.endVertex(), left.endVertex());
        return new Line2d(left.endVertex(), right.endVertex());
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
      this.startVertex().rotate(radians, pivot);
      this.endVertex().rotate(radians, pivot);
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
        if (this.startVertex().x() === line.startVertex().x()) return Infinity;
        return false;
      }

      if (withinTol(line.radians(), this.radians()) &&
              withinTol(line.yIntercept(), this.yIntercept())) {
        return Infinity;
        // return Vertex2d.center(line.startVertex(), this.startVertex(), line.endVertex(), this.endVertex());
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
      } else if (slope === 0) {
        y = this.startVertex().y();
        x = line.x(y);
      } else if (lineSlope === 0) {
        y = line.startVertex().y();
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
          if (this.isPoint()) return this.startVertex();
          if (line.isPoint()) return line.startVertex();
          const acqui = line.alignRadially(this);
          const startEqual = acqui.startVertex().equals(this.startVertex);
          const endEqual = acqui.endVertex().equals(this.startVertex);
          if ((startEqual && endEqual) || !(startEqual && endEqual)) return Infinity;
          const acquiEndIsOn = this.isOn(acqui.endVertex()) || acqui.isOn(this.endVertex());
          if (startEqual) return acquiEndIsOn ? Infinity : this.startVertex();
          const acquiStartIsOn = this.isOn(acqui.startVertex()) || acqui.isOn(this.startVertex());
          if (endEqual) return acquiStartIsOn ? Infinity : this.endVertex();
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
        const dist1 = startVertex.distance(other);
        const dist2 = endVertex.distance(other);
        return dist1 > dist2 ? dist2 : dist1;
      }
      if (other instanceof Line2d) {
        if (this.findSegmentIntersection(other, true)) return 0;
        const dist1 = this.distance(other.startVertex(), segment);
        const dist2 = this.distance(other.endVertex(), segment);
        const dist3 = other.distance(this.startVertex(), segment);
        const dist4 = other.distance(this.endVertex(), segment);
        return Math.min(...[dist1,dist2,dist3,dist4].filter((d) => Number.isFinite(d)));
      }
    }

    this.minX = () => this.startVertex().x() < this.endVertex().x() ?
                        this.startVertex().x() : this.endVertex().x();
    this.minY = () => this.startVertex().y() < this.endVertex().y() ?
                        this.startVertex().y() : this.endVertex().y();
    this.maxX = () => this.startVertex().x() > this.endVertex().x() ?
                        this.startVertex().x() : this.endVertex().x();
    this.maxY = () => this.startVertex().y() > this.endVertex().y() ?
                        this.startVertex().y() : this.endVertex().y();
    this.withinLineBounds = (vertex) => {
      if (this.slope() > consideredInfinity)
        return vertex.x() > this.startVertex().x() - tol && vertex.x() < this.startVertex().x() + tol;
      if (this.slope() === 0)
        return vertex.y() > this.startVertex().y() - tol && vertex.y() < this.startVertex().y() + tol;
      return true;
    }
    this.angle = () => {
      return Math.toDegrees(this.radians());
    }
    this.radians = () => {
      const deltaX = this.endVertex().x() - this.startVertex().x();
      const deltaY = this.endVertex().y() - this.startVertex().y();
      return Math.atan2(deltaY, deltaX);
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
      let targetPoint = perpLine.startVertex();
      if (distance < 0) targetPoint = perpLine.endVertex();
      const radians = this.radians();
      const halfLine1 = Line2d.startAndTheta(targetPoint, radians, length/2);
      const halfLine2 = Line2d.startAndTheta(targetPoint, radians, length/-2);
      const parrelle = halfLine1.combine(halfLine2);
      return Math.abs(parrelle.radians() - this.radians()) < Math.PI12 ? parrelle : parrelle.negitive();
    }

    this.isParrelle = (other) => {
      return Math.modTolerance(this.radians(), other.radians(), Math.PI, tol);
    }

    this.radianDifference = (other) => {
      const rads = this.radians();
      const otherRads = other.radians();
      let diff = Math.difference(rads, otherRads);
      diff = Math.mod(diff + Math.PI, Math.PI * 2) - Math.PI;
      if (diff > Math.PI / 2 ) {
        return Math.PI * 2 - diff;
      }
      if (diff < Math.PI/-2 ) {
        return Math.PI * 2 + diff;
      }
      return diff;
    }

    this.equals = (other) => {
      if (!(other instanceof Line2d)) return false;
      if (other === this) return true;
      const forwardEq = this.startVertex().equals(other.startVertex()) && this.endVertex().equals(other.endVertex());
      const backwardEq = this.startVertex().equals(other.endVertex()) && this.endVertex().equals(other.startVertex());
      return forwardEq || backwardEq;
    }


    const withinPointTol = Tolerance.within(.1);
    this.isPoint = () => withinPointTol(this.length(), 0);
    this.clean = (other) => {
      if (!(other instanceof Line2d)) return;
      if (other.startVertex().equals(other.endVertex())) return this;
      if (this.startVertex().equals(this.endVertex())) return other;
      if (this.toString() === other.toString() || this.toString() === other.toNegitiveString()) return this;
      if (this.isPoint()) return other;
      if (other.isPoint()) return this;
    }

    this.copy = () => new Line2d(this.startVertex().copy(), this.endVertex().copy());

    this.combine = (other) => {
      if (!(other instanceof Line2d)) return;
      const clean = this.clean(other);
      if (clean) return clean;
      if (!withinTol(this.slope(), other.slope())) return;
      const otherNeg = other.negitive();
      const outputWithinTol = withinTol(this.y(other.x()), other.y(other.x())) &&
                    withinTol(this.x(other.y()), other.x(other.y()));
      if (!outputWithinTol) return;
      const v1 = this.startVertex();
      const v2 = this.endVertex();
      const ov1 = other.startVertex();
      const ov2 = other.endVertex();
      if (!this.withinSegmentBounds(other)) {
        const dist = this.distance(other);
        if (dist < tol) {
          console.warn('distance is incorrect:', dist);
          this.distance(other);
          this.withinSegmentBounds(other);
        }
        return;
      }
      // Fix sort method
      const vs = Vertex2d.sortByMax([v1, v2, ov1, ov2]);
      const combined = new Line2d(vs[0], vs[vs.length - 1]);
      return withinTol(this.radians(), combined.radians()) ? combined : combined.negitive();
    }

    this.isEndpoint = (vertex) => this.startVertex().equals(vertex) || this.endVertex().equals(vertex);
    this.sortVerticies = (vertices) =>
      vertices.sort((v1,v2) => this.startVertex().distance(v1) - this.startVertex().distance(v2))

    this.slice = (lines) => {
      if (this.isPoint()) return null;
      const intersections = {};
      for (let index = 0; index < lines.length; index++) {
        if (!lines[index].equals(this)) {
          const intersect = this.findSegmentIntersection(lines[index], true);
          if (intersect && !this.isEndpoint(intersect)) {
            intersections[intersect.toString()] = intersect;
          }
        }
      }

      const list = Object.values(intersections);
      this.sortVerticies(list);
      if (list.length === 0) return null;
      const fractured = [];
      let prevVert = this.startVertex().copy();
      for (let index = 0; index < list.length; index++) {
        const currVert = list[index];
        const line = new Line2d(prevVert, currVert);
        if (!line.isPoint()) {
          fractured.push(line);
          prevVert = currVert;
        } else {
          console.log('point?');
        }
      }
      const lastLine = new Line2d(prevVert, this.endVertex().copy());
      if (!lastLine.isPoint()) fractured.push(lastLine);
      return fractured;
    }

    this.scale = (scale , doNotModify) => {
      if (doNotModify) return this.clone().scale(scale);
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
      const sv = this.startVertex();
      const ev = this.endVertex();
      const startVertex = {x: midPoint.x() - xOffsetBack, y: midPoint.y() - yOffsetBack};
      const endVertex = {x: midPoint.x() - xOffsetFront, y: midPoint.y() - yOffsetFront};
      const line = new Line2d(startVertex, endVertex);
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
      const sv = this.startVertex();
      const newStart = {x: sv.x() + xDiff, y: sv.y() + yDiff};
      const ev = this.endVertex();
      const newEnd = {x: ev.x() + xDiff, y: ev.y() + yDiff};
      this.startVertex().point().x = newStart.x;
      this.startVertex().point().y = newStart.y;
      this.endVertex().point().x = newEnd.x;
      this.endVertex().point().y = newEnd.y;
    };

    // Ensures returnLine startVertex is closer to trendSetter endVertex.
    // Get In Line
    this.acquiescent = (trendSetter) => {
      if (!(trendSetter instanceof Line2d)) return this;
      const shouldReverse = trendSetter.endVertex().distance(this.endVertex()) <
                            trendSetter.endVertex().distance(this.startVertex());
                            return shouldReverse ? this.negitive() : this.clone();
    }

    this.alignRadially = (trendSetter) => {
      if (!(trendSetter instanceof Line2d)) return this;
      const shouldReverse = this.radianDifference(trendSetter) > Math.PI;
      return shouldReverse ? this.negitive() : this.clone();
    }

    this.invert = (condition) => {
      if (condition === undefined || condition) {
        const temp = this.startVertex().point();
        this.startVertex().point(this.endVertex().point());
        this.endVertex().point(temp);
      }
    }

    this.negitive = () => new Line2d(this.endVertex(), this.startVertex());
    this.toString = () => `[${this.startVertex().toString()} , ${this.endVertex().toString()}]`;
    this.toInfoString = () => `slope: ${this.slope()}\n` +
                        `angle: ${this.angle()}\n` +
                        `segment: ${this.toString()}`;
    this.toNegitiveString = () => `[${this.endVertex().toString()}, ${this.startVertex().toString()}]`;
    this.approxToString = () => `[${this.startVertex().approxToString()}, ${this.endVertex().approxToString()}]`;
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

const distanceObj = (line, trendLine) => ({
  line: line.acquiescent(trendLine),
  distance: line.distance(vertex),
  deltaRad: trendLine.radianDifference(line.radians())
});

Line2d.radialSorter = (center) => {
  return (line1, line2) => {
    line1.invert(!line1.clockwise(center));
    line2.invert(!line2.clockwise(center));
    const mp1 = line1.midpoint();
    const mp2 = line2.midpoint();
    const mp1isCenter = mp1.equals(center);
    const mp2isCenter = mp2.equals(center);
    if (mp1isCenter && !mp2isCenter) {
      const direction = line1.isLeft(mp2) ? 1 : -1;
      return direction * mp1.distance(mp2);
    }
    if (mp2isCenter && !mp1isCenter) {
      const direction = line2.isLeft(mp1) ? -1 : 1;
      return direction * mp2.distance(mp1);
    }
    const radial1 = new Line2d(center, mp1);
    const radial2 = new Line2d(center, mp2);
    const radianDiff = radial2.radians() - radial1.radians();
    if (!Math.modTolerance(radianDiff, 0, 2*Math.PI, .00001)) return radianDiff;
    const radians = radial1.radians();
    return mp2.distance(center) - mp1.distance(center)
  }
}

Line2d.radialSort = (lines, center) => {
  center ||= Vertex2d.center(Line2d.vertices(lines));
  lines.sort(Line2d.radialSorter(center));
}

Line2d.vertices = (lines) => {
  const verts = {};
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const sv = line.startVertex();
    const ev = line.endVertex();
    verts[sv.id()] = sv;
    verts[ev.id()] = ev;
  }
  return Object.values(verts);
}

Line2d.center = (lines) => Vertex2d.center(Line2d.vertices(lines));

Line2d.rotate = (lines, radians, pivot) => lines.forEach(l => l.rotate(radians, pivot));

Line2d.consolidate = (...lines) => {
  const tolMap = new ToleranceMap({'slope': `+${tol}`});
  const lineMap = {};
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].isPoint()) {
      if (Number.isNaN(lines[index].slope())) {
        console.log('here');
        lines[index].slope();
      }
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
          const combined = target.combine(matches[mIndex]);
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

const distLine = (line, vertex, index) => {
  return {line, distance: line.distance(vertex), index};
}
Line2d.isolateFurthestLine = (vertex, lines) => {
  let retLines = [];
  let max = distLine(lines[0], vertex, index);
  for (let index = 1; index < lines.length; index++) {
    let curr = distLine(lines[index], vertex, index);
    if (curr.distance > max.distance) {
      retLines = retLines.slice(0, max.index)
                  .concat([max.line]).concat(retLines.slice(max.index));
      max = curr;
    } else retLines.push(curr.line);
  }
  return {line: max.line, lines: retLines};
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
    tolAttrs['startVertex.x'] = tol;
    tolAttrs['startVertex.y'] = tol;
  }
  if (both || startEndBoth === false) {
    tolAttrs['endVertex.x'] = tol;
    tolAttrs['endVertex.y'] = tol;
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
    str += `${color}[${l.startVertex().toString()},${l.endVertex().toString()}],`;
  });
  return str.substr(0, str.length - 1);
}

Line2d.toApproxDrawString = (lines, ...colors) => {
  let str = '';
  lines.forEach((l,i) => {
    color = colors[i%colors.length] || '';
    str += `${color}[${l.startVertex().approxToString()},${l.endVertex().approxToString()}],`;
  });
  return str.substr(0, str.length - 1);
}

Line2d.toString = (lines) => {
  let str = '';
  for (let index = 0; index < lines.length; index++) {
    str += `[${lines[index].startVertex().toString()}, ${lines[index].endVertex().toString()}],`;
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
  const tolmap = new ToleranceMap({'radians.positive': tolerance});
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

Line2d.mirror = (lines) => {
  return Vertex2d.mirror(Line2d.vertices(lines));
}

Line2d.distanceSort = (target) => (l1,l2) => {
  const ds1 = target.distance(l1.startVertex());
  const ds2 = target.distance(l2.startVertex());
  const de1 = target.distance(l1.endVertex());
  const de2 = target.distance(l2.endVertex());
  return (ds1 < de1 ? ds1 : de1) - (ds2 < de2 ? ds2 : de2);
}

const perpInterSectDist = (line, vertex, other, perpendicular) => {
  if (perpendicular) line = line.perpendicular(null, vertex);
  const intersection = other.findSegmentIntersection(line);
  const dist = intersection ? vertex.distance(intersection) : null;
  return {intersection, dist, vertex, line, other};
}

function polarize(line, center) {
  const sl = new Line2d(center,line.startVertex());
  const el = new Line2d(center,line.startVertex());
  if (Math.mod(sl.radians() - el.radians(), Math.PI/2) > 0) line.invert();
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
  const offset = {x: center.x() - currCenter.x(), y: center.y() - currCenter.y()};
  Line2d.translate(lines, offset);
  return offset;
}

Line2d.sorter = (center, degreesOstartpoint) => (l1, l2) => {
  let degrees = degreesOstartpoint;
  if (degrees instanceof Vertex2d) degrees = new Line2d(center.clone(), degreesOstartpoint).degrees();
  polarize(l1, center);
  polarize(l2, center);
  let line1 = new Line2d(center.clone(), l1.midpoint());
  let line2 = new Line2d(center.clone(), l2.midpoint());
  if (degrees) {
    const rads = -Math.toRadians(degrees);
    line1.rotate(rads, center);
    line2.rotate(rads, center);
  }
  return line2.degrees() - line1.degrees();
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
      perpInterSectDist(lov1, lov1.startVertex(), lov2),
      perpInterSectDist(lov1, lov1.endVertex(), lov2),
      perpInterSectDist(lov2, lov2.startVertex(), lov1),
      perpInterSectDist(lov2, lov2.endVertex(), lov1),

      perpInterSectDist(lov1, lov1.startVertex(), lov2, true),
      perpInterSectDist(lov1, lov1.endVertex(), lov2, true),
      perpInterSectDist(lov2, lov2.startVertex(), lov1, true),
      perpInterSectDist(lov2, lov2.endVertex(), lov1, true)
    ];
    const best = list.sortByAttr('dist').filter(obj => obj.dist !== null)[0];
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
