const CSG = require('../../../../../public/js/utils/3d-modeling/csg.js');
const Vector3D = require('vector');
const Vertex3D = require('vertex');
const Matrix = require('matrix');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const approximate = require('../../../../../public/js/utils/approximate.js').new(1000000);
const withinTol = new (require('../../../../../public/js/utils/tolerance.js'))(.00000001).within;

function isDefined(...values) {
  for (let index = 0; index < values.length; index++) {
    if (values[index] === undefined) return false;
  }
  return true;
}

class Plane extends Array {
  constructor(...points) {
    super();
    // points = points.map(p => new Vertex3D(p).clone())
    let equation, normal, intercepts, axis;
    const instance = this;
    let equationDriven = false;
    if (Array.isArray(points[0])) points = points[0];
    if (isDefined(points[0], points[0].a, points[0].b, points[0].c, points[0].d)) {
      equation = points[0];
      equationDriven = true;
      points = [];
    }
    for (let index = 0; index < points.length; index++) {
      this[index] = new Vertex3D(points[index]);
    }

    this.indexOf = (point) => {
      for (let index = 0; index < points.length; index++) {
        if (this[index].equals(point)) return index;
      }
      return -1;
    }

    this.points = () => this.length > 2 ? this : generateEquationPoints(3);

    this.equivalent = (other) => {
      if (!(other instanceof Plane)) return false;
      const oPoints = other.points();
      for (let index = 0; index < oPoints.length; index++) {
        // const p = oPoints[index];
        // const thisZ = this.z(p.x, p.y);
        // if (!withinTol(thisZ, p.z)) return false;
        const thisEqn = this.equation();
        const otherEqn = other.equation();
        if (!withinTol(thisEqn.a, otherEqn.a)) return false;
        if (!withinTol(thisEqn.b, otherEqn.b))  return false;
        if (!withinTol(thisEqn.c, otherEqn.c))  return false;
      }
      return true;
    }

    this.XYrotation = () => {
      const eqn = this.equation();

      const a2b2 = eqn.a * eqn.a + eqn.b * eqn.b;
      const a2b2c2 = eqn.a * eqn.a + eqn.b * eqn.b + eqn.c * eqn.c;
      const roota2b2c2 = Math.sqrt(a2b2c2);
      const cos = eqn.c / roota2b2c2;
      const sin = Math.sqrt(a2b2 / a2b2c2);
      const u1 = eqn.b / Math.sqrt(a2b2);
      const u2 = - eqn.a / Math.sqrt(a2b2);

      const rotationMatrix = new Matrix([
        [cos+u1*u1*(1-cos), u1*u2*(1-cos),     u2*sin],
        [u1*u2*(1-cos),     cos+u2*u2*(1-cos), -u1*sin],
        [-u2*sin,           u1*sin,             cos],
      ])
      return rotationMatrix;
    }

    this.axis = () => {
      if (axis === undefined) {
        const z = this.normal();
        const x = z.getPerpendicular().unit();
        const y = z.crossProduct(x).unit();
        axis = {x,y,z};
      }
      return axis;
    }

    this.rotate = (rotation, center) => {
      center ||= this.center();
      for (let index = 0; index < this.length; index++) {
        this[index].rotate(rotation, center);
      }
      equation = normal = intercepts = axis = undefined;
    }

    this.matrixRotation = (rotationMatrix) => {
      const eqn = this.equation();
      const planeMatrix = new Matrix([[eqn.a], [eqn.b], [eqn.c]]);
      const planeMatrix2 = new Matrix([[eqn.a, eqn.b, eqn.c]]);
      return rotationMatrix.dot(planeMatrix);
    }

    this.reverseRotate = (rotation, center) => {
      center ||= this.center();
      for (let index = 0; index < this.length; index++) {
        this[index].reverseRotate(rotation, center);
      }
      equation = normal = intercepts = axis = undefined;
    }

    function conformToIntercepts(eqn, vertex) {
      if (points.length < 3) return vertex;
      if (eqn.a === 0 || eqn.b === 0 || eqn.c === 0) {
        const intercepts = instance.axisIntercepts();
        if (eqn.a === 0) vertex.x = intercepts.x;
        if (eqn.b === 0) vertex.y = intercepts.y;
        if (eqn.c === 0) vertex.z = intercepts.z;
      }
      return vertex;
    }

    this.x = (y,z, doNotConform) => {
      y ||= 0;
      z ||= 0;
      const eqn = this.equation();
      const x = (-eqn.b * y - eqn.c * z + eqn.d) / eqn.a
      return conformToIntercepts(eqn, new Vertex3D(x,y,z));
    }

    this.y = (x,z, doNotConform) => {
      x ||= 0;
      z ||= 0;
      const eqn = this.equation();
      const y = (-eqn.a * x - eqn.c * z + eqn.d) / eqn.b
      return conformToIntercepts(eqn, new Vertex3D(x,y,z));
    }

    this.z = (x,y, doNotConform) => {
      x ||= 0;
      y ||= 0;
      const eqn = this.equation();
      const z = (-eqn.b * y - eqn.a * x + eqn.d) / eqn.c;
      return conformToIntercepts(eqn, new Vertex3D(x,y,z));
    }


    this.axisIntercepts = () => {
      if (intercepts) return intercepts;
      const eqn = this.equation();
      const normal = this.normal().positiveUnit();
      if (normal.equals(Vector3D.i)) {
        return {
          x: points[0].x,
          y: points[0].x === 0 ? Infinity : NaN,
          z: points[0].x === 0 ? Infinity : NaN
        }
      } else if (normal.equals(Vector3D.j)) {
        return {
          y: points[0].y,
          x: points[0].y === 0 ? Infinity : NaN,
          z: points[0].y === 0 ? Infinity : NaN
        }
      } else if (normal.equals(Vector3D.k)) {
        return {
          z: points[0].z,
          x: points[0].z === 0 ? Infinity : NaN,
          y: points[0].z === 0 ? Infinity : NaN
        }
      }
      intercepts = {
        x: eqn.d/eqn.a,
        y: eqn.d/eqn.b,
        z: eqn.d/eqn.c
      }

      return intercepts;
    }

    this.equation = () => {
      if (equation) return equation;
      let systemOfEquations = Matrix.mapObjects(this.points(), ['x','y','z', 1]);

      try {
        const answer = systemOfEquations.rowEchelon(true);
        const returnValue = {
          a: answer[0][3],
          b: answer[1][3],
          c: answer[2][3],
          d: 1
        };
        return returnValue;
      } catch (e) {
        console.warn(e);
      }
    }

    this.equationEqualToZ = () => {
      const eqn = this.equation();
      const a = approximate;
      return `(${a(eqn.a)}x + ${a(eqn.b)}y + ${a(eqn.d)}) / ${a(eqn.c)}`;
    }

    function generateEquationPoints(count) {
      count ||= 3;
      const pts = [];
      let state = 0;
      let value = 100000;
      let tries = 0;
      while (pts.length < count) {
         let func = state === 0 ? instance.x : (state === 1 ? instance.y : instance.z);
         const coef1 = Math.floor(Math.random() * 10) * (Math.random() > .5 ? -1 : 1);
         const coef2 = Math.floor(Math.random() * 10) * (Math.random() > .5 ? -1 : 1);
         let point = func(value * coef1, value*coef2, true);
         if (!point.usless() && (pts.length === 0 || (pts.equalIndexOf(point)))) {
           pts.push(point);
         }
         value += 13 * tries;
         tries++;
         state = ++state % 3;
         if (tries > count * 3 + 1)
          throw new Error('Cant find points');
      }
      Vertex3D.vectorSort(pts, pts[0].minus(pts[1]).unit(), Vertex3D.center(pts));
      points.concatInPlace(pts);
      return pts;
    }

    function generateAxisPoints(count) {
      const axis = instance.axis();
      let vects = [axis.y, axis.x, axis.y.inverse(), axis.x.inverse()];
      while (vects.length < count) {
        for (let index = 0; index < vects.length && vects.length < count; index += 2) {
          const newVect = vects[index].add(vects[(index+1) % vects.length]).unit();
          vects = vects.slice(0,index+1).concat([newVect]).concat(vects.slice(index+1));
        }
      }


      const points = vects.map(v => new Vertex3D().translate(v.scale(100)));
      return points;
    }

    this.findPoints = (count) => {
      return generateAxisPoints(count);
    }

    this.within = (vertex) => {
      const normal = this.normal();
      const points = this.points();
      const plane = new Plane(points[0], points[1], vertex);
      if (!plane.valid()) return true;
      return plane.normal().equals(normal) || plane.normal().inverse().equals(normal);
    }

    this.parrelleTo = (axis) => {
      const pts = this.points();
      return approximate.eq(pts[0][axis], pts[1][axis], pts[2][axis]);
    }

    this.normal = () => {
      if (normal) return normal;
      const points = this.points();
      const vector1 = points[1].vector().minus(points[0]);
      const vector2 = points[2].vector().minus(points[0]);
      const normVect = vector1.crossProduct(vector2);
      normal = normVect.scale(1 / normVect.magnitude());
      return normal;
    }

    this.valid = () => !Number.isNaN(this.normal().magnitude());

    this.distance = (vertex) => {
      if (!(vertex instanceof Vertex3D)) throw new Error('Sorry... I only implemented this relitive to a Vertex3D');
      const v = vertex;
      const eqn = this.equation();
      const c = this.center();
      const num = Math.abs(eqn.a*(v.x-c.x)+eqn.b*(v.y-c.y)+eqn.c*(v.z-c.z));
      const denom = Math.sqrt(eqn.a*eqn.a+eqn.b*eqn.b+eqn.c*eqn.c);
      return num/denom;
    }

    this.center = () => Vertex3D.center.apply(null, this);

    const epsilon = 1e-6;
    function lineIntersection(line, segment, directional) {
      const vect0 = line.startVertex.vector();
      const vect1 = line.endVertex.vector();
      const planePoint = instance.points()[0];
      const planeNormal = instance.normal();
      let u = vect1.minus(vect0);
      let dot = planeNormal.dot(u);

      if (Math.abs(dot) > epsilon) {
        let w = vect0.minus(planePoint);
        let frac = -planeNormal.dot(w) / dot;
        u = u.scale(frac);
        const intersection = new Vertex3D(vect0.add(u));
        if (segment) {
          if (frac <= 1 && frac >= 0) return intersection;
          return null;
        }
        if (directional) {
          const endDist = line.endVertex.distance(intersection);
          const startDist = line.startVertex.distance(intersection);
          if (endDist > line.length() && endDist > startDist) return null;
        }
        return intersection;
      }

      return null;
    }

    this.intersection = {};

    this.intersection.line = (line) => lineIntersection(line);
    this.intersection.line.segment = (line) => lineIntersection(line, true);
    this.intersection.line.directional = (line) => lineIntersection(line, null, true);

    this.equals = (other) => {
      if (!Array.isArray(other) || this.length !== other.length) return false;
      const startIndex = this.indexOf(other[0]);
      if (startIndex === -1) return false;
      for (let index = startIndex; index < this.length + startIndex; index++) {
        const i = Math.mod(index, this.length);
        if (!this[i].equals(other[i])) return false;
      }
      return true;
    }

    this.toDrawString = (color) => {
      color ||= '';
      const verts = Array.from(this.findPoints(30));
      // Vertex3D.vectorSort(verts, verts[0].minus(verts[1]).unit());
      const arr = verts.map(v => `${color}${v.toString()}`);
      console.log(`${color}[${arr.join(',')}]`);
      return `${color}[${arr.join(',')}]`;
    }
  }
}

Plane.makePlane1MeetPlane2 = function (plane1, plane2, rotation) {
  const centerP1 = Vertex3D.center.apply(null, plane1);
  const rotated1 = new Plane(JSON.copy(plane1));
  const rotated2 = new Plane(JSON.copy(plane2));
  rotated1.reverseRotate(rotation, centerP1);
  rotated2.reverseRotate(rotation, centerP1);
  const center1 = Vertex3D.center.apply(null, rotated1);
  for (let index = 1; index < rotated1.length; index++)
    if (approximate.neq(rotated1[0].z, rotated1[index].z)) throw new Error('Invalid planeRotation: Rotation reversed should make all z coordinates equal to each other');
  const zValue = rotated1[0].z;
  const keep1 = [];
  const keep2 = [];
  const intersections = [];
  const plane2Line2d = new Line2d(rotated2[0], rotated2[1]).combine(new Line2d(rotated2[2], rotated2[3]));
  const p2l2Midpoint = plane2Line2d.midpoint();
  const len = rotated1.length;
  let keep = keep1;
  for (let index = 0; index < rotated1.length; index++) {
    rotated1[index] = new Vertex2d(rotated1[index]);
    const nextIndex = (index + 1) % len;
    const prevIndex = Math.mod(index - 1, len);
    const positiveLine = new Line2d(rotated1[nextIndex], rotated1[index]);
    const negativeLine = new Line2d(rotated1[prevIndex], rotated1[index]);
    const intersection1 = positiveLine.findDirectionalIntersection(plane2Line2d, 1000);
    const intersection2 = negativeLine.findDirectionalIntersection(plane2Line2d, 1000);
    if (intersections.length > 0) keep = keep2;
    if (!intersection1 && !intersection2) keep.push(rotated1[index]);
    else if (!intersection1) intersections.push(intersection2);
    else if (!intersection2) intersections.push(intersection1);
    else {
      const dist1 = p2l2Midpoint.distance(intersection1);
      const dist2 = p2l2Midpoint.distance(intersection2);
      intersections.push(dist1 > dist2 ? intersection1 : intersection2);
    }
  }
  const newPlaneRotated = keep1.concat(intersections).concat(keep2);
  for (let index = 0; index < newPlaneRotated.length; index++) {
    newPlaneRotated[index] = {
      x: newPlaneRotated[index].x(),
      y: newPlaneRotated[index].y(),
      z: zValue
    }
  }

  CSG.rotatePointsAroundCenter(rotation, newPlaneRotated, centerP1);
  return new Plane(...newPlaneRotated);
}

Plane.bisector = (p1, p2) => {
  const eq1 = p1.equation();
  const eq2 = p2.equation();

  const denom1 = Math.sqrt(eq1.a * eq1.a + eq1.b * eq1.b + eq1.c * eq1.c);
  const denom2 = Math.sqrt(eq2.a * eq2.a + eq2.b * eq2.b + eq2.c * eq2.c);

  const a1 = denom2*eq1.a;
  const b1 = denom2*eq1.b;
  const c1 = denom2*eq1.c;
  const d1 = denom2*eq1.d;

  const a2 = denom1*eq2.a;
  const b2 = denom1*eq2.b;
  const c2 = denom1*eq2.c;
  const d2 = denom1*eq2.d;

  const plane1 = new Plane({a: a1 + a2, b: b1 + b2, c: c1 + c2, d: d1 + d2});
  const plane2 = new Plane({a: a1 - a2, b: b1 - b2, c: c1 - c2, d: d1 - d2});

  const obtuse = (eq1.a*eq2.a + eq1.b*eq2.b + eq1.c*eq2.c) < 0
  if (obtuse) return {obtuse: plane1, accute: plane2};
  return {obtuse: plane2, accute: plane1};
}

Plane.fromPointNormal = (point, normal) => {
  normal = normal.unit();
  const fixed = [];
  const a = normal.i();
  const b = normal.j();
  const c = normal.k();
  const vectArray = normal.toArray();

  if (a===0 && b===0 && c===0) return;

  const x0 = point.x;
  const y0 = point.y;
  const z0 = point.z;
  const pointArray = [x0, y0, z0];
  let startIndex = 0;
  while (vectArray[startIndex] === 0) startIndex++;
  const get = (x,y) => {
    const ansI = startIndex;
    const aI = (startIndex + 1) % 3;
    const bI = (startIndex + 2) % 3;
    const answer = (vectArray[aI]*(x-pointArray[aI])+vectArray[bI]*(y-pointArray[bI])-vectArray[ansI]*pointArray[ansI])/-vectArray[ansI];
    const p = [];p[ansI] = answer;p[aI] = x;p[bI] = y;
    return new Vertex3D(...p);
  }
  // there is a chance that these three points will be colinear.... not likely and I have more important stuff to do.

  const point1 = get(13,677);
  const point2 = get(127,43);
  const point3 = get(107,563);
  return new Plane(point1, point2, point3);
}

module.exports = Plane;
