const CSG = require('../../../public/js/3d-modeling/csg.js');
const Vector3D = require('vector');
const Vertex3D = require('vertex');
const Matrix = require('matrix');
const Line2d = require('../../two-d/objects/line.js');
const Vertex2d = require('../../two-d/objects/vertex.js');
const approximate = require('../../../../../public/js/utils/approximate.js').new(1000000);

function isDefined(...values) {
  for (let index = 0; index < values.length; index++) {
    if (values[index] === undefined) return false;
  }
  return true;
}

class Plane extends Array {
  constructor(...points) {
    super();
    let equation;
    if (Array.isArray(points[0])) points = points[0];
    if (isDefined(points[0], points[0].a, points[0].b, points[0].c, points[0].d)) {
      equation = points[0];
    }
    for (let index = 0; index < points.length; index++) {
      this[index] = new Vertex3D(points[index]);
    }

    this.equation = () => this.length > 2 ? Plane.equation(this[0], this[1], this[2]) : equation;
    this.indexOf = (point) => {
      for (let index = 0; index < points.length; index++) {
        if (this[index].equals(point)) return index;
      }
      return -1;
    }

    this.points = () => this.length > 2 ? points.slice(0,3) : this.findPoints();

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

    this.rotate = (rotation, center) => {
      center ||= this.center();
      for (let index = 0; index < this.length; index++) {
        this[index].rotate(rotation, center);
      }
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
    }

    this.x = (y,z, vertex) => {
      y ||= 0;
      z ||= 0;
      const eqn = this.equation();
      const x = (eqn.b * y + eqn.c * z + eqn.d) / eqn.a
      if (x) return new Vertex3D(x,y,z);
      return x;
    }

    this.y = (x,z, vertex) => {
      x ||= 0;
      z ||= 0;
      const eqn = this.equation();
      const y = (eqn.a * x + eqn.c * z + eqn.d) / eqn.b
      if (y) return new Vertex3D(x,y,z);
      return y;
    }

    this.z = (x,y, vertex) => {
      x ||= 0;
      y ||= 0;
      const eqn = this.equation();
      const z = (eqn.b * y + eqn.a * x + eqn.d) / eqn.c;
      if (z) return new Vertex3D(x,y,z);
      return z;
    }

    this.equation = () => {
      if (equation && this.length < 3) return equation;
      const pts = this.points();
      const include = [];
      const constants = {};
      if (true || !this.parrelleTo('x')) include.push({axis: 'x', coef: 'a'});
      else constants['x'] = pts[0].x;
      if (true || !this.parrelleTo('y')) include.push({axis: 'y', coef: 'b'});
      else constants['y'] = pts[0].y;
      if (true || !this.parrelleTo('z')) include.push({axis: 'z', coef: 'c'});
      else constants['z'] = pts[0].z;

      const systemOfEquations = new Matrix(null, include.length, include.length);

      for (let i = 0; i < include.length; i++) {
        const point = pts[i];
        for (let j = 0; j < include.length; j++) {
          systemOfEquations[i][j] = point[include[j].axis];
        }
      }

      let r = systemOfEquations.remove(undefined, 2);
      let rr = r.remove(0);
      // console.log(rr.solve([1,1]));

      const answer = systemOfEquations.solve([1,1,1]);
      const returnValue = {a: 0, b: 0, c: 0, d: 1};
      for (let i = 0; i < include.length; i++) returnValue[include[i].coef] = answer[i][0];
      return returnValue;//{a: answer[0][0], b: answer[1][0], c: answer[2][0], d: 1};
    }

    this.equationEqualToZ = () => {
      const eqn = this.equation();
      const a = approximate;
      return `(${a(eqn.a)}x + ${a(eqn.b)}y + ${a(eqn.d)}) / ${a(eqn.c)}`;
    }

    this.findPoints = (count) => {
      count ||= 3;
      const limit = count * 3 + 11;
      const points = [];
      let state = 0;
      let value = 100000;
      while (points.length < count) {
         let func = state === 0 ? this.x : (state === 1 ? this.y : this.z);
         let point = value % 2 ? func(value * 2, value*-1, true) : func(value, value, true);
         if (!point.usless() && (points.length === 0 || (points.equalIndexOf(point)))) points.push(point);
         value += 13;
         state = ++state % 3;
         // if (value > limit) throw new Error('Cant find points');
      }
      return points;
    }

    this.parrelleTo = (axis) => {
      const pts = this.points();
      return approximate.eq(pts[0][axis], pts[1][axis], pts[2][axis]);
    }

    this.normal = () => {
      const points = this.findPoints();
      const vector1 = points[1].minus(points[0]);
      const vector2 = points[2].minus(points[0]);
      return vector1.crossProduct(vector2);
    }

    this.center = () => Vertex3D.center.apply(null, this);

    this.lineIntersection = (line) => {
      const eqn = this.equation();
      const lEqn = line.equation();
      const x0 = line.startVertex.x;
      const y0 = line.startVertex.y;
      const z0 = line.startVertex.z;

      const a1 = eqn.a;
      const b1 = eqn.b;
      const c1 = eqn.c;
      const d = eqn.d;

      const a2 = lEqn.a;
      const b2 = lEqn.b;
      const c2 = lEqn.c;

      const t = -(a1*x0+b1*y0+c1*z0-d)/(a1*a2+b1*b2+c1*c2);

      const x = x0+t*a2;
      const y = y0+t*b2;
      const z = z0+t*c2;
      return new Vertex3D(x,y,z);
    }

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

module.exports = Plane;
