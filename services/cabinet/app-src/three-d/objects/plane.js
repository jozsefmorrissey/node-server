const CSG = require('../../../../../public/js/utils/3d-modeling/csg.js');
const Vertex3D = require('vertex');
const Vector3D = require('vector');
const Line3D = require('line');
const Matrix = require('matrix');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Tolerance = require('../../../../../public/js/utils/tolerance.js');
const withinTol = new Tolerance(.00001).within;

function isDefined(...values) {
  for (let index = 0; index < values.length; index++) {
    if (values[index] === undefined) return false;
  }
  return true;
}
const infinity = 1000000000;

class Plane extends Array {
  constructor(...points) {
    super();
    points = points.map(p => new Vertex3D(p).clone())
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
      points[index] = this[index];
    }

    this.indexOf = (point) => {
      for (let index = 0; index < points.length; index++) {
        if (this[index].equals(point)) return index;
      }
      return -1;
    }

    this.points = () => this.length > 2 ? Array.from(this) : generateEquationPoints(3);

    this.center = () => Vertex3D.center(this.points());

    this.equivalent = (other) => {
      if (!(other instanceof Plane)) return false;
      return this.normal().parrelle(other.normal());
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

    this.normals = () => {
      if (axis === undefined) {
        const z = this.normal();
        const x = z.getPerpendicular().unit();
        const y = z.crossProduct(x).unit();
        axis = {x,y,z};
      }
      return axis;
    }

    this.axis = () => {
      const point = this.point();
      const normals = this.normals();
      return {
        x: Line3D.fromVector(normals.x.scale(1000), point),
        y: Line3D.fromVector(normals.y.scale(1000), point),
        z: Line3D.fromVector(normals.z.scale(1000), point)
      }
    }

    this.rotate = (rotation, center) => {
      center ||= this.point();
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
      center ||= this.point();
      for (let index = 0; index < this.length; index++) {
        this[index].reverseRotate(rotation, center);
      }
      equation = normal = intercepts = axis = undefined;
    }

    function conformToIntercepts(eqn, vertex) {
      if (points.length < 3) return vertex;
      if (eqn.a === 0 || eqn.b === 0 || eqn.c === 0) {
        const intercepts = instance.axisIntercepts();
        if (eqn.a === 0 && !Number.isNaN(intercepts.x)) vertex.x = intercepts.x;
        if (eqn.b === 0 && !Number.isNaN(intercepts.y)) vertex.y = intercepts.y;
        if (eqn.c === 0 && !Number.isNaN(intercepts.z)) vertex.z = intercepts.z;
      }
      return vertex;
    }

    function concreat(attr, val1, val2) {
      const res = instance[attr](val1, val2);
      if (res.x === Infinity) res.x = 0;
      if (res.y === Infinity) res.y = 0;
      if (res.z === Infinity) res.z = 0;
      return res;
    }


    this.x = (y,z, doNotConform) => {
      y ||= 0;
      z ||= 0;
      const eqn = this.equation();
      const x = (-eqn.b * y - eqn.c * z + eqn.d) / eqn.a
      return conformToIntercepts(eqn, new Vertex3D(x,y,z));
    }
    this.x.concrete = (y, z) => concreat('x', y, z);

    this.y = (x,z, doNotConform) => {
      x ||= 0;
      z ||= 0;
      const eqn = this.equation();
      const y = (-eqn.a * x - eqn.c * z + eqn.d) / eqn.b
      return conformToIntercepts(eqn, new Vertex3D(x,y,z));
    }
    this.y.concrete = (x, z) => concreat('y', x, z);

    this.z = (x,y, doNotConform) => {
      x ||= 0;
      y ||= 0;
      const eqn = this.equation();
      const z = (-eqn.b * y - eqn.a * x + eqn.d) / eqn.c;
      return conformToIntercepts(eqn, new Vertex3D(x,y,z));
    }
    this.z.concrete = (x, y) => concreat('z', x, y);


    const isZero = (val) => withinTol(val, 0);
    const nanIt = (val) => val > infinity || val < -infinity ? NaN : val;
    this.axisIntercepts = () => {
      if (intercepts) return intercepts;
      // const point = this.points();
      const normal = this.normal().positiveUnit();
      if (normal.equals(Vector3D.i)) {
        intercepts = {
          x: points[0].x,
          y: isZero(points[0].x) ? Infinity : NaN,
          z: isZero(points[0].x) ? Infinity : NaN
        }
      } else if (normal.equals(Vector3D.j)) {
        intercepts = {
          y: points[0].y,
          x: isZero(points[0].y) ? Infinity : NaN,
          z: isZero(points[0].y) ? Infinity : NaN
        }
      } else if (normal.equals(Vector3D.k)) {
        intercepts = {
          z: points[0].z,
          x: isZero(points[0].z) ? Infinity : NaN,
          y: isZero(points[0].z) ? Infinity : NaN
        }
      } else {
        const eqn = this.equation();
        intercepts = {
          x: nanIt(eqn.d/eqn.a),
          y: nanIt(eqn.d/eqn.b),
          z: nanIt(eqn.d/eqn.c)
        }
      }


      return new Vertex3D(intercepts);
    }

    this.equation = (scale) => {
      if (equation) return equation;
      scale ||= 1;
      let systemOfEquations = Matrix.mapObjects(this.points(), ['x','y','z', scale]);

      try {
        const ans = systemOfEquations.rowEchelon(true);
        const returnValue = {
          a: ans[0][3],
          b: ans[1][3],
          c: ans[2][3],
          d: scale
        };
        return returnValue;
      } catch (e) {
        console.warn(e);
      }
    }

    this.equationEqualToZ = () => {
      const eqn = this.equation();
      const a = v => Math.roundTo(v, .0001);
      return `(${a(eqn.a)}x + ${a(eqn.b)}y + ${a(eqn.d)}) / ${a(eqn.c)}`;
    }

    function generateEquationPoints(count) {
      count ||= 3;
      const pts = [];
      let state = 0;
      let value = 1000000000;
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

    function generateAxisPoints(count, radius, center) {
      radius ||= 100;
      if(radius < 0) radius = infinity/2;
      const point = center || instance.center();
      const normals = instance.normals();
      let vects = [axis.y, axis.x, axis.y.inverse(), axis.x.inverse()];
      while (vects.length < count) {
        for (let index = 0; index < vects.length && vects.length < count; index += 2) {
          const newVect = vects[index].add(vects[(index+1) % vects.length]).unit();
          vects = vects.slice(0,index+1).concat([newVect]).concat(vects.slice(index+1));
        }
      }


      const points = vects.map(v => point.translate(v.scale(radius), true));
      Vertex3D.radialSort2D(points, normals.z, true);
      return points;
    }

    this.findPoints = (count, radius, center) => {
      return generateAxisPoints(count, radius, center);
    }

    // const vect1 = new Line3D(points[0], points[1]).vector();
    // const vect2 = new Line3D(points[1], vertex).vector();
    // const vect3 = new Line3D(points[0], vertex).vector();
    // let validPoints = [points[0], points[1], vertex];
    // if (isZero(vect2.magnitude())) validPoints = [points[0], points[2], vertex];
    // else if (isZero(vect3.magnitude())) validPoints = [points[1], points[2], vertex];
    // else if (vect1.parrelle(vect3) || vect2.parrelle(vect3)) validPoints = [points[0], points[2], vertex];

    this.within = (vertex) => {
      if (vertex instanceof Line3D) return this.within(vertex[0]) && this.within(vertex[1]);
      if (vertex.toString() === '(6.6,40.8142091868206,-46.6878584209772)') {
        console.log('here');
      }
      const normal = this.normal();
      const points = this.points();
      const plane = new Plane(points[0], points[1], vertex);
      if (!plane.valid()) return true;
      return plane.normal().equals(normal) || plane.normal().inverse().equals(normal);
    }

    this.parrelle = {};
    this.parrelle.axis = (axis) => {
      console.warn('I dont think this is used but method was outdated so removed on 14 Aug 2024');
    }
    this.parrelle.line = (line) => {
      const within = new Tolerance(line.length() / 100000).within;
      const startDist = this.connect.vertex(line[0]).length();
      const endDist = this.connect.vertex(line[1]).length();
      return within(startDist, endDist);
    }

    this.normal = () => {
      if (normal !== undefined) return normal;
      const points = this.points();
      const vector1 = points[1].vector().minus(points[0]);
      const vector2 = points[2].vector().minus(points[0]);
      const normVect = vector1.crossProduct(vector2);
      if (vector1.parrelle(vector2)) return (normal = new Vector3D(NaN,NaN,NaN));
      normal = normVect.scale(1 / normVect.magnitude());
      return normal;
    }

    this.valid = () => !Number.isNaN(this.normal().magnitude());

    this.distance = (vertex) =>
      this.connect.vertex(vertex).length();

    this.angle = {}
    this.angle.line = (line) => {
      if (this.normal().parrelle(line.vector())) return 90;
      const intersection = this.intersection.line(line);
      const startConn = this.connect.vertex(line[0]);
      const endConn = this.connect.vertex(line[1]);
      const furthest = startConn.length() > endConn.length() ? startConn : endConn;
      const vect1 = new Line3D(furthest[1], intersection).vector();
      const vect2 = new Line3D(furthest[0], intersection).vector();
      const angle = vect1.angle(vect2);
      return angle;
    }

    this.point = () => {
      if (this.length > 2) return Vertex3D.center.apply(null, this);
      const intercepts = this.axisIntercepts();
      let validIntercept;
      if (!Number.NaNfinity(intercepts.x)) validIntercept = new Vertex3D(intercepts.x, 0, 0);
      else if (!Number.NaNfinity(intercepts.y)) validIntercept = new Vertex3D(0, intercepts.y, 0);
      else if (!Number.NaNfinity(intercepts.z)) validIntercept = new Vertex3D(0, 0, intercepts.z);
      if (validIntercept) return validIntercept;
      console.warn('If your encountering an error this is likely to be where problems orignate');
      let xInt = this.x.concrete(0,0);
      let yInt = this.y.concrete(0,0);
      let zInt = this.z.concrete(0,0);

      const finite = xInt.finite() ? xInt : (yInt.finite() ? yInt : (zInt.finite() ? zInt : null));
      if (finite === null)
        throw new Error('Invalid Plane');
      return finite;
    };

    const epsilon = 1e-6;
    function lineIntersection(line, segment, directional) {
      const vect0 = line[0].vector();
      const vect1 = line[1].vector();
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
          const endDist = line[1].distance(intersection);
          const startDist = line[0].distance(intersection);
          if (endDist > line.length() && endDist > startDist) return null;
        }
        return intersection;
      }

      return instance.within(line) ? line : null;
    }

    this.intersection = (other) => {
      if(this.equals(other)) return this;
      if (other instanceof Line3D) return this.intersection.line(other);
      if (this.normal().parrelle(other.normal())) return null;
      let pointInfo;
      const points = Array.from(other.findPoints(3));
      const lines = points.map((p,i) => new Line3D(points[0], points[i]));
      for (let index = 1; index < lines.length; index++) {
        const connection = this.connect.line(lines[index]);
        if (connection && !pointInfo || pointInfo.dist < connection.length()) {
          pointInfo = {point: connection[0], dist: connection.length()};
        }
      }
      if (!pointInfo) return null;
      const vector = this.normal().crossProduct(other.normal()).unit();
      const line = Line3D.startAndVector(pointInfo.point, vector);
      line.adjustLength(1000);
      return line;
    };

    this.intersection.line = (line) => lineIntersection(line);
    this.intersection.line.segment = (line) => lineIntersection(line, true);
    this.intersection.line.directional = (line) => lineIntersection(line, null, true);

    this.connect = (to) => {
      if (to instanceof Vertex3D) return this.connect.vertex(to);
      if (to instanceof Line3D) return this.connect.line(to);
      if (to instanceof Plane) return this.intersection(to).midpoint();
      return to.connect(this);
    }
    this.connect.vertex = (vertex) => {
      const line = Line3D.fromVector(this.normal(), vertex);
      const planeInter = this.intersection.line(line);
      return new Line3D(planeInter, vertex);
    }
    this.connect.line = (line) => {
      const startOnPlane = this.connect.vertex(line[0])[0];
      const endOnPlane = this.connect.vertex(line[1])[0];
      return new Line3D(startOnPlane, endOnPlane).connect.line.segment(line, true);
    }

    let testV;
    const notOisInfinity = (v1,v2) => (Math.abs(v1) > infinity && Math.abs(v2) > infinity) ||
                                      (Math.abs(v1) < infinity && Math.abs(v2) < infinity);
    const testVert = (v, x, y, z) => (testV = this[x](v[y], v[z])) &&
                                  notOisInfinity(v[x], testV[x]);
    this.equals = (other) => {
      if (!Array.isArray(other) || this.length !== other.length) return false;
      const overt = other[0];
      const tvert = this.x(overt.y, overt.x);
      const withinPlane = testVert('x', 'y', 'z') &&
                          testVert('y', 'x', 'z') &&
                          testVert('z', 'x', 'y');
      return withinPlane;
    }

    this.toDrawString = (color, includeNormal, radius, points) => {
      color ||= '';
      const verts = Array.from(this.findPoints(points || 10, radius));
      const arr = verts.map(v => `${color}${v.toString()}`);
      if (!includeNormal) return `${color}[${arr.join(',')}]`;

      const start = Vertex3D.center(verts);
      const end = new Vertex3D(this.normal().scale(10).add(start));
      const normalStr = `[${start},${end})`;

      return `${color}${normalStr}\n${color}[${arr.join(',')}]`;

    }
  }
}

Plane.xy = new Plane([0,0,0], [10,0,0], [10,10,0]);
Plane.yz = new Plane([0,0,0], [0,10,0], [0,10,10]);
Plane.xz = new Plane([0,0,0], [10,0,0], [10,0,10]);

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

Plane.intersections = (...planes) => {
  const info = a = Array.fill(planes.length, () => ({lines: [], planes: []}));
  for (let i = 0; i < planes.length; i++) {
    for (let j = i + 1; j < planes.length; j++) {
      const line = planes[i].intersection(planes[j]);
      if (line) {
        if (line instanceof Line3D) {
          const nearest = line.connect(planes[i].center())[0];
          line.centerOn(nearest);
          line.length(infinity);
          info[i].lines.push(line) & info[j].lines.push(line);
          info[i].planes.push(planes[j]) & info[j].planes.push(planes[i]);
        } else
          console.warn('this is not a line', line);
      }
    }
  }
  return info;
}

Object.class.register(Plane);
Plane.toJson = (plane) => {
  return {verts: Array.from(plane).map(v => Vertex3D.toJson(v)), _TYPE: Plane.name};
}
Plane.fromJson = (json) =>
  new Plane(...json.verts.map(j => Vertex3D.fromJson(j)));



module.exports = Plane;
