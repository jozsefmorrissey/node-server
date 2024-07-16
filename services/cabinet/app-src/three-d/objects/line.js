
const Vector3D = require('./vector');
const Vertex3D = require('./vertex');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line');
const Matrix = require('./matrix.js');
const FixedValue = require('./fixed-value');
const ToleranceMap = require('../../../../../public/js/utils/tolerance-map.js');
const tol = .00000001;
const Tolerance = require('../../../../../public/js/utils/tolerance.js');
const withinTol = new Tolerance(tol).within;
const withinHundreth = new Tolerance(.01).within;

const zero = (val) => {
  if (withinTol(val, 0)) return 0
  return val;
}

class Line3D {
  constructor(startVertex, endVertex) {
    if (endVertex === undefined && startVertex instanceof Vector3D) {
      endVertex = startVertex;
      startVertex = new Vertex3D();
    }
    if (startVertex === undefined || endVertex === undefined) throw new Error('Lines must have a start and an end point');
    this.startVertex = new Vertex3D(startVertex);
    this.endVertex = new Vertex3D(endVertex);

    Object.defineProperty(this, '0', {
      get: () => this.startVertex,
      set: (val) => this.startVertex = val
    });
    Object.defineProperty(this, '1', {
      get: () => this.endVertex,
      set: (val) => this.endVertex = val
    });
    const instance = this;

    this.clone = () => {
      const clone = new Line3D(this.startVertex.clone(), this.endVertex.clone());
      clone[0].DIRECTIONAL = this[0].DIRECTIONAL;
      clone[1].DIRECTIONAL = this[1].DIRECTIONAL;
      return clone;
    }

    this.isLine = () => this[0].DIRECTIONAL === true && this[1].DIRECTIONAL === true;
    this.isSegment = () => this[0].DIRECTIONAL !== true && this[1].DIRECTIONAL !== true;
    this.isDirectional = () => this.isDirectional.anti() ^ this.isDirectional.co();
    this.isDirectional.co = () => this[0].DIRECTIONAL !== true && this[1].DIRECTIONAL === true;
    this.isDirectional.anti = () => this[1].DIRECTIONAL !== true && this[0].DIRECTIONAL === true;
    this.directional = (before, after) => (this[0].DIRECTIONAL = before ? true : false) &
                        (this[1].DIRECTIONAL = after ? true : false) & undefined;

    this.invert = (condition) => {
      if (condition === undefined || condition) {
        const temp = [this.startVertex.x, this.startVertex.y, this.startVertex.z];
        this.startVertex.x = this.endVertex.x;
        this.startVertex.y = this.endVertex.y;
        this.startVertex.z = this.endVertex.z;
        this.endVertex.x = temp[0];
        this.endVertex.y = temp[1];
        this.endVertex.z = temp[2];
      }
    }

    this.negitive = () => new Line3D(this.endVertex, this.startVertex);
    this.equals = (other, tolerance) => {
      if (this.startVertex && this.endVertex && other instanceof Line3D) {
        return this.startVertex.equals(other.startVertex, tolerance) && this.endVertex.equals(other.endVertex, tolerance) ||
            this.startVertex.equals(other.endVertex, tolerance) && this.endVertex.equals(other.startVertex, tolerance);
      }
      return false;
    }
    this.vector = () => {
      let i = this.endVertex.x - this.startVertex.x;
      let j = this.endVertex.y - this.startVertex.y;
      let k = this.endVertex.z - this.startVertex.z;
      return new Vector3D(i,j,k);
    };

    this.translate = (vector) => {
      this.startVertex.translate(vector);
      this.endVertex.translate(vector);
    }

    this.finite = (limit) => this.startVertex.finite(limit) && this.endVertex.finite(limit);

    this.isPoint = () => this.startVertex.equals(this.endVertex);

    // this.on = (vertex, tolerance) => {
    //   tolerance ||= .01;
    // }

    const setCoef = (index, obj, t) => {
      let offset = ((index + 1) % 3);
      let coord = String.fromCharCode(offset + 120);
      let coef = String.fromCharCode(offset + 97);
      if (withinTol(instance.endVertex[coord], instance.startVertex[coord]))
        obj[coef] = new FixedValue(instance.startVertex[coord]);
      else
        obj[coef] = (instance.endVertex[coord] - instance.startVertex[coord]) / t;
    }

    this.equation = () => {
      const returnValue = {};
      for (let i = 0; i < 3; i++) {
        let coord = String.fromCharCode(i + 120);
        let t = this.endVertex[coord] - this.startVertex[coord];
        if (t !== 0) {
          setCoef(i, returnValue, t);
          setCoef(i + 1, returnValue, t);
          setCoef(i + 2, returnValue, t);
          break;
        }
      }
      if (returnValue.a === undefined) throw new Error('This Line is a point... I think...');
      return returnValue;
    }

    this.toString = (accuracy) => {
      return this.toDrawString(null, accuracy);
    }
    this.toNegitiveString = () => `${new String(this.endVertex)} => ${new String(this.startVertex)}`;
    this.toDrawString = (color, accuracy) => {
      let brackets
      if (this.isLine()) brackets = ['(', ')'];
      else if (this.isSegment()) brackets = ['[', ']'];
      else if (this.isDirectional.anti()) brackets = ['(', ']'];
      else brackets = ['[', ')'];
      color ||= '';
      const valueStr = `${this.startVertex.toString(accuracy)}, ${this.endVertex.toString(accuracy)}`;
      return color + brackets[0] + valueStr + brackets[1];
    }

    this.midpoint = () => new Vertex3D(
      (this.endVertex.x +this.startVertex.x) / 2,
      (this.endVertex.y +this.startVertex.y) / 2,
      (this.endVertex.z +this.startVertex.z) / 2
    );

    this.centerOn = (newMidpoint) =>
      this.translate(new Vertex3D(newMidpoint).minus(this.midpoint()));

    this.viewFromVector = (vector) => Line3D.viewFromVector([this], vector)[0];

    function resize(length, fromStartVertex) {
      if ((typeof length) === 'number') {
        const unitVec = this.vector().unit();
        if (fromStartVertex !== undefined) {
          if (fromStartVertex === true) {
            instance.endVertex.positionAt(instance.startVertex.translate(unitVec.scale(length), true));
          } else {
            instance.startVertex.positionAt(instance.endVertex.translate(unitVec.scale(length), true));
          }
        } else {
          const halfLenMag = length/2;
          const halfDistVec = unitVec.scale(halfLenMag);
          const mp = instance.midpoint();
          instance.startVertex.positionAt(mp);
          instance.startVertex.translate(halfDistVec.inverse());
          instance.endVertex.positionAt(mp);
          instance.endVertex.translate(halfDistVec);
        }
      }
      return instance.vector().magnitude();
    }
    this.length = resize;

    this.fromStart = (distance) => this.startVertex.translate(this.vector().unit().scale(distance), true);
    this.fromEnd = (distance) => this.endVertex.translate(this.vector().unit().scale(distance), true);

    this.adjustLength = (change, fromStartVertex) => {
      if ((typeof change) !== 'number' || change === 0) return;
      const unitVec = this.vector().unit();
      if (fromStartVertex !== undefined) {
        if (fromStartVertex === true) {
          this.startVertex.translate(unitVec.scale(change));
        } else {
          this.endVertex.translate(unitVec.scale(change));
        }
      } else {
        const halfChangeMag = change/2;
        const halfDistVec = unitVec.scale(halfChangeMag);
       this.startVertex.translate(halfDistVec.inverse());
       this.endVertex.translate(halfDistVec);
      }
    }

    this.polarize = (vertex) => {
      vertex ||= {x:0, y:0, z:0}
      if (this.startVertex.distance(vertex) > this.endVertex.distance(vertex)) {
        const temp = this.startVertex;
        this.startVertex = this.endVertex;
        this.endVertex = temp;
      }
      return this;
    }

    this.connect = (other, segment) => {
      if (other instanceof Vertex3D) return this.connect.vertex(other, segment);
      if (other instanceof Line3D) {
        if (segment !== false) return this.connect.line.segment(other);
        return this.connect.line(other);
      }
      throw new Error(`Trying to connect unkownObject '${other.constructor.name}'`);
    };

    const connect = (line1, line2, l1TrueSegmentFalseDirectional, l2TrueSegmentFalseDirectional) => {
      const l1State = tsfdState(l1TrueSegmentFalseDirectional);
      const l2State = tsfdState(l1TrueSegmentFalseDirectional);
      let intersection = line1.intersection(line2);
      if (intersection && l1State === CONN_STATES.FULL && l2State === CONN_STATES.FULL)
        return new Line3D(intersection, intersection);
      if (!intersection) intersection = line1.intersection.overlap(line2, true);
      if (!intersection) intersection = Vertex3D.center(line1[0], line1[1], line2[0], line2[1]);
      let conn = line1.connect.vertex(intersection, l1TrueSegmentFalseDirectional);
      let prevDist = conn.length();
      conn = line2.connect(conn[0], l2TrueSegmentFalseDirectional);
      conn = line1.connect(conn[0], l1TrueSegmentFalseDirectional);
      for (let index = 0; !withinTol(prevDist, conn.length()) && index < 5; index++) {
        prevDist = conn.length();
        conn = line2.connect.vertex(conn[0], l2TrueSegmentFalseDirectional);
        conn = line1.connect.vertex(conn[0], l1TrueSegmentFalseDirectional);
        if (index === 4)
          throw new Error('Why is connection continueing to change length???');
      }
      return conn;
    }

    this.connect.line = (other) =>
      // Line3D.intersectingLine(this, other);
      connect(this, other);


    this.connect.line.segment = (other, both) =>
      // Line3D.intersectingLine(this, other, false, true, true, both, both);
      connect(this, other, true, both === true ? true : null);

    this.connect.line.directional = (other, both) =>
      // Line3D.intersectingLine(this, other, false, true, false, both, false);
      connect(this, other, false, both === true ? false : null);


    this.connect.vertex = (vertex, trueSegmentFalseDirectional) => {
      const state = tsfdState(trueSegmentFalseDirectional);
      const tsfd = trueSegmentFalseDirectional;
      const perp = this.perpendicular(vertex);
      const fullLine = tsfd !== true && tsfd !== false;
      if (state === CONN_STATES.FULL) return perp;
      const vertOnLine = perp[0];
      const within = this.within(vertOnLine);
      if (within === true) return perp;
      if (within === 'AFTER' && state === CONN_STATES.DIR) return perp;
      const closest = vertOnLine.distance(this[0]) < vertOnLine.distance(this[1]) ? this[0] : this[1];
      perp.startVertex = closest;
      return perp;
    }

    this.distance = (other, notSegment) => {
      if (other instanceof Line3D && other.isPoint()) return this.distance(other[0]);
      if (this.isPoint()) return other.distance(this[0]);
      if (other instanceof Vertex3D) return this.connect(other).length();
      if (notSegment) return this.connect(other).length();
      return this.connect.line.segment(other, true).length();
    }
    this.intersection = (other) => {
      const connector = Line3D.connect(this, other);
      if (connector && withinTol(connector.length(), 0)) return connector.startVertex;
      return null;
    }

    const halfAtValues = (l1, l2, attr, int, xAttr, yAttr) => {
      if(!Number.isNaN(int[attr])) return;
      const pInfo1 = l1[xAttr](int[xAttr]) || l1[yAttr](int[yAttr]);
      const pInfo2 = l2[xAttr](int[xAttr]) || l2[yAttr](int[yAttr]);
      if(pInfo1 === null || pInfo2 === null) return;
      const v1 = pInfo1.vertex[attr];
      const v2 = pInfo2.vertex[attr];
      int[attr] = (v1 + v2) / 2;
    }
    const twoDintValues = (l1, l2, int, xAttr, yAttr) => {
      if (Number.isFinite(int[xAttr] + int[yAttr])) return;
      const l12d = l1.to2D(xAttr, yAttr);
      const l22d = l2.to2D(xAttr, yAttr);
      let int2d = l12d.findIntersection(l22d);
      if (int2d) {
        if (int2d === Number.POSITIVE_INFINITY) {
          int2d = l1.midpoint().to2D(xAttr, yAttr);
        }
        int[xAttr] = int2d.x();
        int[yAttr] = int2d.y();
      }
    }

    this.intersection.overlap = (other, trueClosestFalseFurthest) => {
      const tcff = trueClosestFalseFurthest;
      const ints = [
        this.intersection.overlap.xy(other),
        this.intersection.overlap.yz(other),
        this.intersection.overlap.xz(other)
      ].filter(Vertex3D.uniqueFilter());
      if (ints.length === 0) return null;
      if (tcff !== true && tcff !== false) return ints;
      const test = (c, d) => tcff === true ? c.dist < d : c.dist > d;
      let targetInfo;
      for (let index = 0; index < ints.length; index++) {
        const int = ints[index];
        const dist = this.distance(int) + other.distance(int);
        if (!targetInfo || test(targetInfo, dist)) {
          if (targetInfo && withinHundreth(dist, targetInfo.dist))
            console.warn('I thought this was extremely unlikely, you may want to look into why multple intersections are the nearly identical disances without being the same point');
          targetInfo = {dist, int};
        }
      }
      return targetInfo.int;
    }

    const overlapIntersection  = (l1, attr, xAttr, yAttr) => (l2) => {
      const int = new Vertex3D(NaN, NaN, NaN);
      twoDintValues(l1, l2, int, xAttr, yAttr);
      if ([int.x, int.y, int.z].filter(v => Number.isNaN(v)).length > 1) {
        twoDintValues(l1, l2, int, xAttr, yAttr);
      }
      halfAtValues(l1, l2, attr, int, xAttr, yAttr);
      return int.finite() ? int : null;
    }
    this.intersection.overlap.xy = overlapIntersection(this, 'z', 'x', 'y');
    this.intersection.overlap.yz = overlapIntersection(this, 'x', 'y', 'z');
    this.intersection.overlap.xz = overlapIntersection(this, 'y', 'x', 'z');

    this.x = (x) => {
      const vec = this.vector().unit();
      const t = (x - this.startVertex.x)/vec.i();
      x = this.startVertex.x + vec.i()*t;
      const y = this.startVertex.y + vec.j()*t;
      const z = this.startVertex.z + vec.k()*t;
      const vertex = new Vertex3D(x,y,z);
      return vertex.finite() ? {vertex, t} : null;
    }
    this.y = (y) => {
      const vec = this.vector().unit();
      const t = (y - this.startVertex.y)/vec.j();
      const x = this.startVertex.x + vec.i()*t;
      y = this.startVertex.y + vec.j()*t;
      const z = this.startVertex.z + vec.k()*t;
      const vertex = new Vertex3D(x,y,z);
      return vertex.finite() ? {vertex, t} : null;
    }
    this.z = (z) => {
      const vec = this.vector().unit();
      const t = (z - this.startVertex.z)/vec.k();
      const x = this.startVertex.x + vec.i()*t;
      const y = this.startVertex.y + vec.j()*t;
      z = this.startVertex.z + vec.k()*t;
      const vertex = new Vertex3D(x,y,z);
      return vertex.finite() ? {vertex, t} : null;
    }

    this.within = (vertex) => {
      vertex = new Vertex3D(vertex);
      const onLine = this.x(vertex.x) || this.y(vertex.y) || this.z(vertex.z);
      if (!onLine || !onLine.vertex.equals(vertex)) return false;
      if (onLine.t < -tol) return 'BEFORE';
      if (this.startVertex.distance(onLine.vertex) > this.length() + tol) return 'AFTER';
      return true;
    }

    this.intersection.segment = (other, both) => {
      const connector = this.connect.line.segment(other, both);
      if (connector && withinTol(connector.length(), 0)) return connector.startVertex;
      return null;
    }

    this.intersection.directional = (other, both) => {
      const connector = this.connect.line.directional(other, both);
      if (connector && withinTol(connector.length(), 0)) return connector.startVertex;
      return null;
    }

    this.pointAtDistance = (distance) => {
      const point =this.startVertex.copy();
      const unitVec = this.vector().unit();
      point.translate(unitVec.scale(distance));
      return point;
    }

    // this.mirror = (degrees, vertices) => {
    //   const axis =
    //   for (let index = 0; index < vertices.length; index++) {
    //     CSG.ArbitraryRotate(vert, degrees, axis);
    //   }
    // }

    this.rotate = (rotation, center) => {
      center ||= this.midpoint();
     this.startVertex.rotate(rotation, center);
     this.endVertex.rotate(rotation, center);
     return this;
    }

    this.reverseRotate = (rotation, center) => {
      center ||= this.midpoint();
     this.startVertex.reverseRotate(rotation, center);
     this.endVertex.reverseRotate(rotation, center);
     return this;
    }

    this.positiveVectorLine = () =>
      this.vector().positive() ? this : this.negitive();

    this.to2D = (x,y) => Line3D.to2D([this], x, y)[0];

    // Ensures returnLine startVertex is closer to trendSetter endVertex.
    // Get In Line
    this.acquiescent = (trendSetter) => {
      if (!(trendSetter instanceof Line3D)) return this;
      const endDist = trendSetter.endVertex.distance(this.endVertex);
      const startDist = trendSetter.endVertex.distance(this.startVertex);
      const shouldReverse = endDist > startDist;
      if (shouldReverse) return this.negitive();
      return this.clone();
    }

    this.isParrelle = (other) => {
      const vect = this.vector().positiveUnit();
      const oVect = (other instanceof Vector3D ? other : other.vector()).positiveUnit();
      return withinTol(vect.i(), oVect.i()) && withinTol(vect.j(), oVect.j()) &&
              withinTol(vect.k(), oVect.k());
    }

    this.acquies = (trendSetter) => {
      const acLine = this.acquiescent(trendSetter);
      const temp = [this.startVertex.x, this.startVertex.y, this.startVertex.z];
      this.startVertex.x = acLine.endVertex.x;
      this.startVertex.y = acLine.endVertex.y;
      this.startVertex.z = acLine.endVertex.z;
      this.endVertex.x = temp[0];
      this.endVertex.y = temp[1];
      this.endVertex.z = temp[2];
    }

    /**
      this = (A => D => C)
      vertex = B
      D=A+t(C-A)
      [(A-B) + t(C-A)]*(C-A)=0
      t=((B-A)*(C-A))/((C-A)*(C-A))
    **/
    this.perpendicular = (vertex) => {
      if (vertex) {
        const A = this.startVertex.vector();
        const C = this.endVertex.vector();
        const B = vertex.vector();
        const C_A = C.minus(A);
        const t = B.minus(A).dot(C_A)/C_A.dot(C_A);
        const D = A.add(C_A.scale(t));
        return new Line3D(D, vertex);
      } else {
        let other;
        const vector = this.vector();
        const i = vector.i(); const j = vector.j(); const k = vector.k();
        const option1Mag = k*k+j*j;
        const option2Mag = k*k+i*i;
        const option3Mag = j*j+i*i;
        if (option1Mag > option2Mag && option1Mag > option3Mag) {
          other = new Vector3D(0, k, -j);
        } else if (option2Mag > option3Mag) {
          other = new Vector3D(-k, 0, i);
        } else {
          other = new Vector3D(-j, i, 0);
        }

        return new Line3D(this.midpoint(), other);
      }
    }

    this.combineOrder = (other) => Line3D.combineOrder(this, other);
  }
}

Line3D.vertices = (linesOverts, true4startfalse4end) => {
  const verts = [];
  const includeBoth = true4startfalse4end !== true && true4startfalse4end !== false;
  const includeStart = includeBoth || true4startfalse4end === true;
  const includeEnd = includeBoth || true4startfalse4end === false;
  for (let index = 0; index < linesOverts.length; index += 1) {
    if (linesOverts[index] instanceof Line3D) {
      if (includeStart) verts.push(linesOverts[index][0].copy());
      if (includeEnd) verts.push(linesOverts[index][1].copy());
    } else {
      verts.push(linesOverts[index]);
    }
  }
  return verts;
}

Line3D.vertices1 = (lines) => {
  const verts = [];
  for (let index = 0; index < lines.length; index += 1) {
    verts.push(lines[index].endVertex.copy());
  }
  return verts;
}

Line3D.adjustVertices = (vert1, vert2, change, fromStartVertex) => {
  const line = new Line3D(vert1, vert2);
  line.adjustLength(change, fromStartVertex);
}

Line3D.adjustDistance = (vert1, vert2, distance, fromStartVertex) => {
  const line = new Line3D(vert1, vert2);
  line.length(distance, fromStartVertex);
}

Line3D.startAndVector = (startVertex, offsetVector) => {
  const endVertex = startVertex.translate(offsetVector, true);
  return new Line3D(startVertex, endVertex);
}

Line3D.to2D = (lines, x, y) => {
  const lines2d = [];
  for (let index = 0; index < lines.length; index++) {
    const startV = lines[index].startVertex.to2D(x, y);
    const endV = lines[index].endVertex.to2D(x, y);
    lines2d.push(new Line2d(startV, endV));
  }
  return lines2d;
}

Line3D.thetaBetween = (line1, line2, viewFrom, acute) => {
  const x = line1.vector().unit();
  const z = viewFrom;
  const y = z.crossProduct(x);
  const rotz = Line3D.coDirectionalRotations([x,y,z]);
  const clone1 = line1.clone();
  const clone2 = line2.clone();
  const origin = new Vertex3D();
  rotz.forEach(rot => {
    clone1.rotate(rot, origin);
    clone2.rotate(rot, origin);
  });

  const l12d = clone1.to2D();
  const l22d = clone2.to2D();
  return acute === true ? l12d.acute(l22d) : (acute === false ? l12d.obtuse(l22d) : l12d.thetaBetween(l22d));
}

Line3D.fromVector = (vector, startVertex, rotation) => {
  const sv = new Vertex3D(startVertex);
  const ev = sv.translate(vector, true)
  const line = new Line3D(sv, ev);
  if (rotation) line.rotate(rotation);
  return line;
}

Line3D.viewFromVector = (lines, vector) => {
  const orthoLines = [];
  for (let p = 0; p < lines.length; p++) {
    const startVert = lines[p].startVertex;
    const endVert = lines[p].endVertex;
    const orthoVerts = Vertex3D.viewFromVector([startVert, endVert], vector);
    orthoLines.push(new Line3D(orthoVerts[0], orthoVerts[1]));
  }
  return orthoLines;
}


Line3D.reverse = (list) => {
  let reversed = [];
  for (let index = list.length - 1; index > -1; index--) {
    reversed.push(list[index].negitive());
  }
  return reversed;
}

Line3D.centerFurthestFrom = (vertex, list) => {
  let furthest;
  for (let index = 1; index < list.length; index++) {
    const line = list[index];
    const dist = list[index].midpoint().distance(vertex);
    if (!furthest || furthest.dist < dist) furthest = {line, dist};
  }
  return closest;
}

Line3D.centerClosestTo = (vertex, list) => {
  let closest;
  for (let index = 1; index < list.length; index++) {
    const line = list[index];
    const dist = list[index].midpoint().distance(vertex);
    if (!closest || closest.dist > dist) closest = {line, dist};
  }
  return closest.line;
}

Line3D.endpointClosestTo = (vertex, list) => {
  let closest;
  for (let index = 0; index < list.length; index++) {
    const line = list[index];
    const sdist = list[index].endVertex.distance(vertex);
    const edist = list[index].startVertex.distance(vertex);
    const dist = sdist < edist ? sdist : edist;
    if (!closest || closest.dist > dist) closest = {line, dist};
  }
  return closest.line;
}

Line3D.sharedEndpoint = (...lines) => {
  const vertices = Line3D.vertices(lines);
  if (vertices.length === 2) return vertices;
  for (let index = 0; index < vertices.length; index++) {
    const vertex = vertices[index];
    let existsInAll = true;
    for (let lIndex = 0; existsInAll && lIndex > lines.length; lIndex++) {
      const line = lines[lIndex];
      const startEq = line.startVertex.equals(vertex);
      const endEq = line.endVertex.equals(vertex);
      existsInAll = startEq || endEq;
    }
    if (existsInAll) return vertex;
  }
  return null;
}

const unitLine = (vectOline) => {
  const vector = vectOline instanceof Line3D ? vectOline.vector() : vectOline;
  return Line3D.fromVector(vector.unit());
}

function get2dLines(ortho1, ortho2, pivot) {
  if (pivot === 'x')
    return Line3D.to2D([ortho1, ortho2], 'z', 'y');
  if (pivot === 'y')
    return Line3D.to2D([ortho1, ortho2], 'z', 'x');
  if (pivot === 'z')
    return Line3D.to2D([ortho1, ortho2], 'x', 'y');
}

const pivotVectors = {x: new Vector3D(1,0,0), y: new Vector3D(0,1,0), z: new Vector3D(0,0,1)};
function determineRotation(unitLine, target, pivot, reverse) {
  const pivotVec = pivotVectors[pivot];
  const orthoLine = Line3D.viewFromVector([unitLine], pivotVec)[0];
  const orthoTar = Line3D.viewFromVector([target], pivotVec)[0];
  const twoDlines = get2dLines(orthoLine, orthoTar, pivot);
  if (!twoDlines[0].isPoint() && !twoDlines[1].isPoint()) {
    const degrees = Math.toDegrees(twoDlines[0].radianDifference(twoDlines[1]));
    if (degrees !== 0 && degrees !== 360) {
      const rotation = {};
      rotation[pivot] = reverse ? degrees : -degrees;
      return rotation;
    }
  }
}

const revPivots = ['z', 'y', 'x'];
const pivots = ['x', 'y', 'z'];
const checkAllAreParrelle = (align, alignTo) => {
  let equal = true;
  for (let index = 0; index < align.length; index++) {
    if (!align[index].isParrelle(alignTo[index])) equal = false;
  }
  return equal;
}
function determinRotations(align, alignTo, reverse) {
  align = align.map(l => l.clone());
  const rotations = [];
  let cycles = 0;
  let keepGoing = true;
  let lastRotation;
  const center = new Vertex3D();//.center(Line3D.vertices(align));
  let axisCannotBeEqual;
  while (keepGoing && cycles++ < 7) {
    for (let aIndex = 0; aIndex < align.length; aIndex++) {
      const unitLine = align[aIndex];
      const targetLine = alignTo[aIndex];
      const rotationLength = rotations.length;
      for (let index = 0; index < pivots.length; index++) {
        const pivot = (reverse ? revPivots : pivots)[index];
        const rotation = determineRotation(unitLine, targetLine, pivot, reverse);
        axisCannotBeEqual = Object.equals(lastRotation, rotation);
        if (rotation && !axisCannotBeEqual) {
          align = align.map(l => reverse ? l.reverseRotate(rotation, center) : l.rotate(rotation, center));
          rotations.push(rotation);
          lastRotation = rotation;
        }
      }
      keepGoing = rotations.length !== rotationLength;
    }
  }

  if (axisCannotBeEqual)
    console.warn('Axis cannot be equal: try to create conditions where they can');
  // if (!checkAllAreParrelle(align, alignTo))
  //   throw new Error("This shouldn't happen");

  return rotations.length > 0 ? rotations : null;
}

const defaultAlignVectors = [
  new Vector3D(1,0,0),
  new Vector3D(0,1,0),
  new Vector3D(0,0,1)
]

Line3D.coDirectionalRotations = (align, alignTo, reverse) => {
  if (alignTo == null) alignTo = defaultAlignVectors;
  if (!Array.isArray(align)) align = [align];
  if (!Array.isArray(alignTo)) alignTo = [alignTo];
  if (align.length != alignTo.length) throw new Error('The same number of vectors must be in align and alignTo');
  align = align.map(unitLine);
  alignTo = alignTo.map(unitLine);
  if (align.equals(alignTo) === true) {
    return [];
  }

  let rotations = determinRotations(align, alignTo, reverse);
  if (!reverse || rotations.length > 3) return rotations;
  const combine = {x: 0, y: 0, z:0};
  rotations.forEach(r => {
    combine.x += r.x ? r.x : 0;
    combine.y += r.y ? r.y : 0;
    combine.z += r.z ? r.z : 0;
  })
  return combine;
}

Line3D.combineOrder = (line1, line2) => {
  const unitVec1 = line1.vector().unit();
  let unitVec2 = line2.vector().unit();
  if (!unitVec1.equals(unitVec2)) {
    line2 = line2.negitive();
    unitVec2 = line2.vector().unit();
    if (!unitVec1.equals(unitVec2)) return null;
  }
  const verts = [line1.startVertex, line1.endVertex,line2.startVertex, line2.endVertex];
  verts.sort(Vertex3D.sortByCenter(Vertex3D.center(...verts)));
  verts.sort(Vertex3D.sortByCenter(verts[verts.length - 1]));
  let longest = new Line3D(verts[0], verts[verts.length - 1]);
  const shorterBy = line1.length() + line2.length() - longest.length();
  if (zero(shorterBy) < 0) return null;
  if (!unitVec1.equals(longest.vector().unit())) longest = longest.negitive();
  verts.sort(Vertex3D.sortByCenter(longest.startVertex));
  let first = new Line3D(verts[0], verts[1]);
  let second = new Line3D(verts[0], verts[2]);
  if (!((unitVec1.equals(first.vector().unit()) || first.isPoint()) &&
      (unitVec1.equals(second.vector().unit()) || second.isPoint()))) return null;
  verts.shorterBy = shorterBy;
  return verts;
}

Line3D.combine = (lines) => {
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const lineI = lines[i];
      const lineJ = lines[j];
      const combineOrder = lineI.combineOrder(lineJ);
      if (combineOrder) {
        lineI.startVertex.positionAt(combineOrder[0]);
        lineI.endVertex.positionAt(combineOrder[combineOrder.length - 1]);
        lines.splice(j, 1);
        j--;
      }
    }
  }
  return lines;
}

Line3D.bestPole = (lines, tolerance) => {
  tolerance ||= tol;
  const tolmap = new ToleranceMap({'vector.positiveUnit.i': tolerance,
                                  'vector.positiveUnit.j': tolerance,
                                  'vector.positiveUnit.k': tolerance});
  tolmap.addAll(lines);
  const center = Vertex3D.center(...Line3D.vertices(lines));
  let maxDist = 0;
  for (let ldex = 0; ldex < lines.length; ldex ++) {
    const sDist = lines[ldex].startVertex.distance(center);
    const eDist = lines[ldex].endVertex.distance(center);
    if (sDist > maxDist) maxDist = sDist;
    if (eDist > maxDist) maxDist = eDist;
  }

  let poleVector = new Vector3D(0,0,0);
  tolmap.forEachSet(set => {
    let positive = new Vector3D(0,0,0);
    let negitive = new Vector3D(0,0,0);
    set.forEach(line => {
      const vector = line.vector();
      if (vector.unit().equals(vector.positiveUnit())) {
        positive = positive.add(vector);
      } else {
        negitive = negitive.add(vector);
      }
    });
    if (negitive.magnitude() > positive.magnitude()) {
      poleVector = poleVector.add(negitive);
    } else {
      poleVector = poleVector.add(positive);
    }
  });

  return new Vertex3D(poleVector.inverse().unit().scale(maxDist).add(center.vector()));
}

Line3D.averageLine = (lines, pole) => {
  const startPoint = {x: 0, y:0, z:0};
  const endPoint = {x: 0, y:0, z:0};
  pole ||= Line3D.bestPole(lines);
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].clone().polarize(pole);
    startPoint.x += line.startVertex.x / lines.length;
    startPoint.y += line.startVertex.y / lines.length;
    startPoint.z += line.startVertex.z / lines.length;
    endPoint.x += line.endVertex.x / lines.length;
    endPoint.y += line.endVertex.y / lines.length;
    endPoint.z += line.endVertex.z / lines.length;
  }
  return new Line3D(startPoint, endPoint);
}

Line3D.vectorSorter = (vector, center) => {
  center ||= new Vertex3D(0,0,0);
  vector ||= new Vector3D(0,1,0);
  return (line1, line2) => {
    const line1dot = vector.dot(new Line3D(center, line1.midpoint()).vector());
    const line2dot = vector.dot(new Line3D(center, line2.midpoint()).vector());
    return line2dot - line1dot;
  }
}

Line3D.vectorSort = (lines, vector, center) => {
  lines.sort(Line3D.vectorSorter(vector, center));
}

Line3D.radialSorter = (center, vector) => {
  vector ||= new Vector3D(0,0,-1);
  return (line1, line2) => {
    const line12d = line1.viewFromVector(vector).to2D('x', 'y');
    const line22d = line2.viewFromVector(vector).to2D('x', 'y');
    const center2D = Vertex3D.viewFromVector([center], vector)[0].to2D('x','y');
    line1.invert(!line12d.clockwise(center2D));
    line2.invert(!line22d.clockwise(center2D));
    const mp12d = line12d.midpoint();
    const mp22d = line22d.midpoint();
    const mp1isCenter = mp12d.equals(center2D);
    const mp2isCenter = mp22d.equals(center2D);
    if (mp1isCenter && !mp2isCenter) {
      if (mp22d.equals(mp12d)) return
      const direction = line12d.isLeft(mp22d) ? 1 : -1;
      return direction * mp12d.distance(mp22d);
    }
    if (mp2isCenter && !mp1isCenter) {
      const direction = line22d.isLeft(mp12d) ? -1 : 1;
      return direction * mp22d.distance(mp12d);
    }
    const radial1 = new Line2d(center2D, mp12d);
    const radial2 = new Line2d(center2D, mp22d);
    const radianDiff = radial2.radians() - radial1.radians();
    if (!Math.modTolerance(radianDiff, 0, 2*Math.PI, .00001)) return radianDiff;
    const radians = radial1.radians();
    return mp22d.distance(center2D) - mp12d.distance(center2D)
  }
}

Line3D.radialSort = (lines, center, vector) => {
  lines.sort(Line3D.radialSorter(center, vector));
}

Line3D.distanceSort = (target, segment) => (l1,l2) => {
  const ds1 = l1.distance(target, segment);
  const ds2 = l2.distance(target, segment);
  return ds1 - ds2;
}

Line3D.parrelleSets = (lines, tolerance) => {
  tolerance ||= tol;
  const tolmap = new ToleranceMap({'vector.positiveUnit.i': tolerance,
                                  'vector.positiveUnit.j': tolerance,
                                  'vector.positiveUnit.k': tolerance});
  tolmap.addAll(lines);
  const groups = tolmap.group().sortByAttr('0.length', true);
  groups.forEach(set => set.sortByAttr('length', true));
  return groups;
}

Line3D.shortest = (startVertexOLines, ...endVerts) => {
  if (Array.isArray(startVertexOLines)) {
    const lines = startVertexOLines;
    let shortest = lines[0];
    for (let index = 1; index < lines.length; index++) {
      if (lines[index].length() < shortest.length()) shortest = lines[index];
    }
    return shortest;
  }
  const startVertex = startVertexOLines;
  let shortest = new Line3D(startVertex, endVerts[0]);
  for (let index = 1; index < endVerts.length; index++) {
    const curr = new Line3D(startVertex, endVerts[index]);
    if (curr.length() < shortest.length()) shortest = curr;
  }
  return shortest;
}

Line3D.longest = (mixAndMatch, ...vertsOlines) => {
  let lines = vertsOlines;
  if (mixAndMatch !== true && mixAndMatch !== false) lines.push(mixAndMatch);
  if (mixAndMatch === true) {
    const verts = Line3D.vertices(lines);
    lines = [];
    verts.forEach((v,i) => verts.forEach((v2, j) => i !== j && lines.push(new Line3D(v, v2))));
  }
  let longest;
  for (let i = 1; i < lines.length; i++) {
    const curr = lines[index];
    if (!longest || curr.length() > longest.length()) longest = curr;
  }
  return longest;
}

Line3D.from2D = (lines2d) =>
  lines2d.map(l => new Line3D([l[0].x(), l[0].y(), 0], [l[1].x(), l[1].y(), 0]));

module.exports = Line3D;




let PolyLine3D, Plane;

function parrellePointLine(line1, line2) {
  const vect1 = line1.vector();
  const vect2 = line2.vector();
  let closest = {dist: Number.MAX_SAFE_INTEGER};
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const vert1 = i === 0 ? line1.startVertex : line1.endVertex;
      const vert2 = j === 0 ? line2.startVertex : line2.endVertex;
      const dist = vert1.distance(vert2);
      if (dist < closest.dist) closest = {dist, vert1, vert2};
    }
  }
  let conn = line1.connect(closest.vert2, true);
  conn = line2.connect(conn[0], true);
  return conn;
}

// Stole from https://stackoverflow.com/a/28701387
// Thank You, Alexandre Giordanelli
Line3D.intersectingLine = (line1, line2, clampAll, clampA0, clampA1, clampB0, clampB1) => {
  if(PolyLine3D === undefined) {
    PolyLine3D = require('./poly-line');
    Plane = require('plane');
  }
  line1 = line1.clone();line2 = line2.clone();
  var sameDir = line1.vector().sameDirection(line2.vector());
  if (!sameDir) {
    line2 = line2.negitive();
    const temp = clampB0;
    clampB0 = clampB1;
    clampB1 = temp;
  }

  const a0 = line1.startVertex; const a1 = line1.endVertex;
  const b0 = line2.startVertex; const b1 = line2.endVertex;
  const a0eq = a0.equals(b0) || a0.equals(b1);
  const b0eq = b0.equals(a0) || b0.equals(a1);
    //Given two lines defined by numpy.array pairs (a0,a1,b0,b1)
    //Return distance, the two closest points, and their average

    clampA0 = clampAll || clampA0 || false;
    clampA1 = clampAll || clampA1 || false;
    clampB0 = clampAll || clampB0 || false;
    clampB1 = clampAll || clampB1 || false;
    a0.clamp = clampA0;a1.clamp = clampA1;b0.clamp = clampB0;b1.clamp = clampB1;

    //Calculate denomitator
    var A = a1.minus(a0);
    var B = b1.minus(b0);
    var _A = A.unit();
    var _B = B.unit();
    var cross = _A.crossProduct(_B);
    var denom = Math.pow(cross.magnitude(), 2);

    //If denominator is 0, lines are parallel: Calculate distance with a projection and evaluate clamp edge cases
    if (denom == 0){
        var d0 = _A.dot(b0.minus(a0));
        var d = _A.scale(d0).add(a0).minus(b0).magnitude();

        //If clamping: the only time we'll get closest points will be when lines don't overlap at all. Find if segments overlap using dot products.
        if(clampA0 || clampA1 || clampB0 || clampB1){
            var d1 = _A.dot(b1.minus(a0));

            //Is segment B before A?
            if(d0 <= 0 && 0 >= d1){
                if(clampA0 == true && clampB1 == true){
                    if(Math.abs(d0) < Math.abs(d1)){
                        return new Line3D(b0, a0);
                    }
                    return new Line3D(b1, a0);
                }
            }
            //Is segment B after A?
            else if(d0 >= A.magnitude() && A.magnitude() <= d1){
                if(clampA1 == true && clampB0 == true){
                    if(Math.abs(d0) < Math.abs(d1)){
                        return new Line3D(b0, a1);
                    }
                    return new Line3D(b1, a1);
                }
            }

        }


        if (!sameDir) {
          line2 = line2.negitive();
          const temp = clampB0;
          clampB0 = clampB1;
          clampB1 = temp;
        }
        //If clamping is off, or segments overlapped, we have infinite results, just return position.
        return new PolyLine3D(line1, line2, clampAll, clampA0, clampA1, clampB0, clampB1);
    }

    var t = b0.minus(a0);
    var det0 = new Matrix([t.toArray(), _B.toArray(), cross.toArray()]).transpose().determinate();
    var det1 = new Matrix([t.toArray(), _A.toArray(), cross.toArray()]).transpose().determinate();

    const answer = t.toArray();
    const m = new Matrix([[_A.i(), -_B.i()],
                          [_A.j(), -_B.j()],
                          [_A.k(), -_B.k()]]);
    const Ts = m.solve(t.toArray());


    var t0 = Ts[0][0];//det0 / denom;
    var t1 = Ts[1][0];//det1 / denom;

    var pA = _A.scale(t0).add(a0);
    var pB = _B.scale(t1).add(b0);

    // const plane = new Plane(line1.startVertex, line1.endVertex, line2.startVertex);
    // if (plane.valid() && !plane.within(line2.endVertex)) {
    //   return parrellePointLine(line1, line2);
    // }

    //Clamp results to line segments if needed
    console.log([line1, line2, new Vertex3D(pA), new Vertex3D(pB), a0, a1, b0, b1].map(v => v.toDrawString ? v.toDrawString() : v.toString()).join('\n'));
    if(clampA0 || clampA1 || clampB0 || clampB1){
        if (clampA0 && line1.within(pA) === 'BEFORE') {
          pA = a0;
          const perpEnd = line2.connect(pA).startVertex;
          pB = Line3D.shortest(pA, perpEnd, b0, b1).endVertex;
        } else if(clampA1 && line1.within(pA) === 'AFTER') {
          pA = a1;
          const perpEnd = line2.connect(pA).startVertex;
          pB = Line3D.shortest(pA, perpEnd, b0, b1).endVertex;
        } else if(clampB0 && line2.within(pB) === 'BEFORE') {
          pB = b0;
          const perpEnd = line2.connect(pB).startVertex;
          pA = Line3D.shortest(pB, perpEnd, a0, a1).endVertex;
        } else if(clampB1 && line2.within(pB) === 'AFTER') {
          pB = b1;
          const perpEnd = line2.connect(pB).startVertex;
          pA = Line3D.shortest(pB, perpEnd, a0, a1).endVertex;
        }
    }

    if (line1.intersection(line2) === null) {

    }

    return new Line3D(pA, pB);
}

const CONN_STATES = {FULL: 0, DIR: 1, SEG: 2}
const tsfdState = (tsfd) => tsfd === false ? CONN_STATES.DIR : (tsfd === true ? CONN_STATES.SEG : CONN_STATES.FULL);

const EPSILON = 1e-5;
Line3D.connect = (line1, line2) => {
  if (line1.isParrelle(line2)) return line2.connect.vertex(line1.midpoint());
  const p1 = line1[0]; const p2 = line1[1];
  const p3 = line2[0]; const p4 = line2[1];

  const p13 = new Vertex3D(); const p43 = new Vertex3D(); const p21 = new Vertex3D();
  p13.x = p1.x - p3.x;
  p13.y = p1.y - p3.y;
  p13.z = p1.z - p3.z;
  p43.x = p4.x - p3.x;
  p43.y = p4.y - p3.y;
  p43.z = p4.z - p3.z;
  if (Math.abs(p43.x) < EPSILON && Math.abs(p43.y) < EPSILON && Math.abs(p43.z) < EPSILON)
    return null;
  p21.x = p2.x - p1.x;
  p21.y = p2.y - p1.y;
  p21.z = p2.z - p1.z;
  if (Math.abs(p21.x) < EPSILON && Math.abs(p21.y) < EPSILON && Math.abs(p21.z) < EPSILON)
    return null;

  const d1343 = p13.x * p43.x + p13.y * p43.y + p13.z * p43.z;
  const d4321 = p43.x * p21.x + p43.y * p21.y + p43.z * p21.z;
  const d1321 = p13.x * p21.x + p13.y * p21.y + p13.z * p21.z;
  const d4343 = p43.x * p43.x + p43.y * p43.y + p43.z * p43.z;
  const d2121 = p21.x * p21.x + p21.y * p21.y + p21.z * p21.z;

  const denom = d2121 * d4343 - d4321 * d4321;
  if (Math.abs(denom) < EPSILON)
    return null;
  const numer = d1343 * d4321 - d1321 * d4343;

  const mua = numer / denom;
  const mub = (d1343 + d4321 * mua) / d4343;

  const pa = new Vertex3D();
  const pb = new Vertex3D();
  pa.x = p1.x + mua * p21.x;
  pa.y = p1.y + mua * p21.y;
  pa.z = p1.z + mua * p21.z;
  pb.x = p3.x + mub * p43.x;
  pb.y = p3.y + mub * p43.y;
  pb.z = p3.z + mub * p43.z;

  return new Line3D(pa, pb);
}
