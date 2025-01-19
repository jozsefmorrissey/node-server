
const Matrix = require('./matrix');
const Vector3D = require('./vector');
const Vertex2d = require('../../two-d/objects/vertex');
const Line2d = require('../../two-d/objects/line');
const CSG = require('../../../3d-modeling/csg.js');
const Tolerance = require('../../../tolerance.js');
const ToleranceMap = require('../../../tolerance-map.js');

let count = 0;
class Vertex3D {
  constructor(x, y, z) {
    count++;
    if (x instanceof Vertex3D) return x;
    if (x instanceof Vector3D) {
      this.x = x.i();
      this.y = x.j();
      this.z = x.k();
    } else if (x === undefined) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
    } else if (arguments.length == 3) {
      this.x = x;
      this.y = y;
      this.z = z;
    } else if ('x' in x) {
      this.x = x.x;
      this.y = x.y;
      this.z = x.z;
    } else {
      this.x = x[0];
      this.y = x[1];
      this.z = x[2];
    }

    this.viewFromVector = (vector) => Vertex3D.viewFromVector([this], vector)[0];

    this.translate = (vectorOvectors, doNotModify) => {
      if (doNotModify === true) return this.copy().translate(vectorOvectors);
      if (Array.isArray(vectorOvectors)) vectorOvectors.forEach(v => this.translate(v));
      else {
        let vector =  new Vector3D(vectorOvectors);
        this.x += vector.i();
        this.y += vector.j();
        this.z += vector.k();
      }
      return this;
    }

    this.positionAt = (vertex) => {
      this.x = vertex.x;
      this.y = vertex.y;
      this.z = vertex.z;
    }

    this.finite = (limit) => {
      limit ||= Vertex3D.infinity;
      const sum = this.x + this.y + this.z;
      return Number.isFinite(sum) && sum < limit && sum > -limit;
    }

    this.usless = () => Number.NaNfinity(this.x, this.y, this.z);
    this.scale = (scale, doNotModify) => {
      if (doNotModify) return this.clone().scale(scale);
      if (!scale) return this;
      const oneDef = Number.is(scale.x) || Number.is(scale.y) || Number.is(scale.z);
      this.x *= (scale.x || (oneDef ? 1 : scale));
      this.y *= (scale.y || (oneDef ? 1 : scale));
      this.z *= (scale.z || (oneDef ? 1 : scale));
      return this;
    }

    this.vector = (vector) => {
      const v = vector;
      if (v) return new Vector3D(this.x + v.i(), this.y + v.j(), this.z + v.k());
      return new Vector3D(this.x, this.y, this.z);
    }

    this.rotate = (rotations, center, doNotModify) => {
      if (doNotModify) return this.clone().rotate(rotations, center);
      CSG.rotatePointAroundCenter(rotations, this, center);
      return this;
    }

    this.reverseRotate = (rotations, center) => {
      CSG.rotatePointAroundCenter(rotations, this, center, true);
      return this;
    }

    this.matrix = () => {
      return new Matrix([[this.x, this.y, this.z]]);
    }

    this.distance = (other) => {
      const xDiff = this.x - other.x;
      const yDiff = this.y - other.y;
      const zDiff = this.z - other.z;

      return Math.sqrt(xDiff*xDiff + yDiff*yDiff + zDiff*zDiff);
    }

    this.distanceVector = (other) => {
      const xDiff = other.x - this.x;
      const yDiff = other.y - this.y;
      const zDiff = other.z - this.z;

      return new Vector3D(xDiff, yDiff, zDiff);
    }

    this.minus = (other) => {
      const xDiff = this.x - other.x;
      const yDiff = this.y - other.y;
      const zDiff = this.z - other.z;

      return new Vector3D(xDiff, yDiff, zDiff);
    }

    this.inverseVector = () => {
      return new Vertex3D(this.x * -1, this.y* -1, this.z * -1);
    }

    this.to2D = (x, y) => Vertex3D.to2D([this], x, y)[0];

    this.copy = () => new Vertex3D(this.x, this.y, this.z);
    this.clone = this.copy;
    this.equals = (otherOx, toleranceOy, z, tolerance) => {
      const tol = tolerance ? new Tolerance({x: tolerance, y: tolerance, z: tolerance}) :
                              Vertex3D.tolerance;
      if (otherOx instanceof Object) return this.equals(otherOx.x, otherOx.y, otherOx.z, toleranceOy);
      return tol.within(this, new Vertex3D(otherOx, toleranceOy, z));
    }
    const round = (acc) => (val) => Math.roundTo(val, acc);
    this.toString = (accuracy) => {
      const rnd = accuracy === null ? v => v : round(accuracy || .0000000000001);
      return `(${rnd(this.x)},${rnd(this.y)},${rnd(this.z)})`;
    }
    this.toDrawString = (color, accuracy) => `${color || 'red'}${this.toString(accuracy)}`;
    this.hash = () => `(${this.x},${this.y},${this.z})`.hash();
  }
}

const tol = .0001;
Vertex3D.tolerance = new Tolerance({x: tol, y: tol, z: tol});
Vertex3D.infinity = 1000000000;


// returned direction is of list2 relitive to list 1
// dirArr = [forward, backward, up, down, left, right];
Vertex3D.direction = (vertList1, vertList2, tolerance, axisOnly) => {
  tolerance ||= .1;
  let dirArr = [true, true, true, true, true, true];
  for (let i = 0; i < vertList1.length; i++) {
    const vert1 = vertList1[i];
    for (let j = 0; j < vertList2.length; j++) {
      const vert2 = vertList2[j];
      dirArr[0] &&= vert1.z > vert2.z - tolerance;
      dirArr[1] &&= vert1.z < vert2.z + tolerance;
      dirArr[2] &&= vert1.y < vert2.y + tolerance;
      dirArr[3] &&= vert1.y > vert2.y - tolerance;
      dirArr[4] &&= vert1.x > vert2.x - tolerance;
      dirArr[5] &&= vert1.x < vert2.x + tolerance;
    }
    if (dirArr[0] && dirArr[1]) dirArr[0] = dirArr[1] = false;
    if (dirArr[2] && dirArr[3]) dirArr[2] = dirArr[3] = false;
    if (dirArr[4] && dirArr[5]) dirArr[4] = dirArr[5] = false;

    const zDir = dirArr[0] ? 'forward' : (dirArr[1] ? 'backward' : undefined);
    const yDir = dirArr[2] ? 'up' : (dirArr[3] ? 'down' : undefined);
    const xDir = dirArr[4] ? 'left' : (dirArr[5] ? 'right' : undefined);

    if (zDir && yDir && xDir) return axisOnly ? null : `${xDir} ${yDir} ${zDir}`;
    if (zDir) {
      if (yDir) return axisOnly ? null : `${yDir} ${zDir}`;
      if (xDir) return axisOnly ? null : `${xDir} ${zDir}`;
      return zDir;
    }
    if (xDir) {
      if (yDir) return axisOnly ? null : `${xDir} ${yDir}`;
      return xDir
    }
    return yDir ? yDir : null;
  }
}

Vertex3D.ToleranceMap = (tolerance) => {
  tolerance ||= tol;
  return new ToleranceMap({x: tolerance, y: tolerance, z: tolerance});
}

Vertex3D.uniqueFilter = (tolerance) => {
  let map = Vertex3D.ToleranceMap(tolerance);
  const filter = (vert) => {
    if (!(vert instanceof Vertex3D)) return false;
    if (map.matches(vert).length > 0) return false;
    map.add(vert);
    return true;
  };
  filter.reset = map.reset;
  return filter;
}

Vertex3D.center = (...vertices) => {
  if (Array.isArray(vertices[0])) vertices = vertices[0];
  const xyzMean = new Vertex3D(Math.mean(vertices, ['x', 'y', 'z']));
  if (!Number.isNaN(xyzMean.x + xyzMean.y + xyzMean.z)) return xyzMean;
  return new Vertex3D(Math.mean(vertices, [0,1,2]));
}

Vertex3D.midrange = (...vertices) => {
  if (Array.isArray(vertices[0])) vertices = vertices[0];
  const xyzMidrange = new Vertex3D(Math.midrange(vertices, ['x', 'y', 'z']));
  if (!Number.isNaN(xyzMidrange.x + xyzMidrange.y + xyzMidrange.z)) return xyzMidrange;
  return new Vertex3D(Math.midrange(vertices, [0,1,2]));
}

Vertex3D.to2D = (vertices, x, y) => {
  x ||= 'x';
  y ||= 'y';
  const verts2D = [];
  for (let index = 0; index < vertices.length; index++) {
    verts2D.push(new Vertex2d(vertices[index][x], vertices[index][y]));
  }
  return verts2D;
}

Vertex3D.radialSort2D = (verts, normal, ccw, center, degreesOstartpoint) => {
  center ||= Vertex3D.center(verts);
  const coRotz = Vector3D.coDirectionalRotations([normal], [Vector3D.k]);

  if (degreesOstartpoint instanceof Vertex3D)
    degreesOstartpoint = degreesOstartpoint.rotate(coRotz, center, true).to2D('x','y');
  const verts2D = verts.map(v => v.rotate(coRotz, center, true).to2D('x','y'));
  center = center.to2D('x','y');
  verts2D.forEach((v,i) => v.V3D = verts[i]);

  Line2d.radialSort(verts2D, ccw, center, degreesOstartpoint);
  return verts.copy(verts2D.map(v => v.V3D));
}

Vertex3D.viewFromVector = (vertices, vector, filter) => {
  const negitive = !vector.positive();
  const orthoVerts = [];
  const runFilter = (typeof filter) === 'function';
  for (let index = 0; index < vertices.length; index++) {
    const vertex = vertices[index];
    const u = new Vector3D(vertex.x, vertex.y, vertex.z);
    const projection = u.projectOnTo(vector);
    let orthogonal = u.minus(projection).scale(negitive ? 1 : -1);
    orthogonal = new Vertex3D(orthogonal);
    if (!runFilter || (runFilter && filter(orthogonal, vertex)))
      orthoVerts.push(orthogonal);
  }
  return orthoVerts;
}

Vertex3D.nearest = (vertices, target) => {
  let closest;
  for (let index = 0; index < vertices.length; index++) {
    const vertex = vertices[index];
    const dist = target.distance(vertex);
    if (closest === undefined || closest.dist > dist) {
      closest = {dist, vertex};
    }
  }
  return closest.vertex;
}

Vertex3D.sortByCenter = (center) => {
  return (v1, v2) => {
    const d1 = v1.distance(center);
    const d2 = v2.distance(center);
    return d1-d2;
  }
}

Vertex3D.origin = new Vertex3D(0,0,0);

Vertex3D.vectorSorter = (vector, center) => {
  center ||= new Vertex3D(0,0,0);
  vector ||= new Vector3D(1,1,1);
  const sorter = (vert1, vert2) => {
    const vect1 = vert1.minus(center).unit();
    const vect2 = vert2.minus(center).unit();
    if (vect1.positive() === vect2.positive()) {
      const line1dot = vector.dot(vect1);
      const line2dot = vector.dot(vect2);
      const dotDiff = line1dot - line2dot;
      if (dotDiff !== 0) return dotDiff;
      if (vect1.equals(vect2)) return 0;
    }
    return vect1.sameDirection(vector) ? 1 : -1;
  }
  return sorter;
}

Vertex3D.vectorSort = (vertices, vector, center) => {
  if (vertices.length === 0) return;
  center ||= Vertex3D.center(...vertices);
  vertices.sort(Vertex3D.vectorSorter(vector, center));
}

let valueCount = (v, attr) => v[attr] > .01 || v[attr] < -.01  ? 1 : 0;
Vertex3D.informationSorter = (v1, v2) => {
  const v1Count = valueCount(v1, 'x') + valueCount(v1, 'y') + valueCount(v1, 'z');
  const v2Count = valueCount(v2, 'x') + valueCount(v2, 'y') + valueCount(v2, 'z');
  if (v1Count !== v2Count) return v2Count - v1Count;
  return (Math.abs(v2.x) + Math.abs(v2.y) + Math.abs(v2.z)) -
            (Math.abs(v1.x) + Math.abs(v1.y) + Math.abs(v1.z));
}


Vertex3D.mostInformation = (vertices) => {
  const diff = {x: 0, y:0, z: 0};
  const center = Vertex3D.center(vertices);
  const c = Vector3D.cardinal();
  for(let index = 0; index < vertices.length; index++) {
    const v = vertices[index];
    diff.x += Math.abs(v.x - center.x);
    diff.y += Math.abs(v.y - center.y);
    diff.z += Math.abs(v.z - center.z);
  }
  const li = diff.x < diff.y ?
        (diff.x < diff.z ? c.i :
        (diff.z < diff.y ? c.k : c.j)) :
        (diff.y < diff.z ? c.j : c.k);
  const mi = li === c.k ? ['x', 'y'] : (li === c.j ? ['x', 'z'] : ['y', 'z'])
  mi.viewFrom = li;
  return mi;
}

Vertex3D.fromLimits = (limits) => {
  const x = limits.x; const xn = limits['-x'];
  const y = limits.y; const yn = limits['-y'];
  const z = limits.z; const zn = limits['-z'];
  return [
    new Vertex3D(x,y,z),new Vertex3D(xn,y,z),
    new Vertex3D(xn,yn,z),new Vertex3D(x,yn,z),
    new Vertex3D(x,y,zn),new Vertex3D(xn,y,zn),
    new Vertex3D(xn,yn,zn),new Vertex3D(x,yn,zn)
  ];
}



Vertex3D.magnitudeVector = (unitVector, vertices, center) => {
  center ||= Vertex3D.center(vertices);
  let magnitude = new Vector3D(0,0,0);
  vertices.forEach(v => {
    const dirVector = new Vector3D(v.minus(center));
    const positive = unitVector.dot(dirVector);
    if (positive > 0) {
      const vector = unitVector.scale(positive);
      if (vector.magnitude() > magnitude.magnitude()) {
        magnitude = vector;
      }
    }
  });
  return magnitude;
}

const mrmls = Measurement.regex.matchless().source;
Vertex3D.regex = new RegExp(`\\(\\s*(${mrmls})\\s*,\\s*(${mrmls})\\s*,\\s*(${mrmls})\\s*\\)`);
Vertex3D.fromString = (string, unit, list) => {
  const match = string.match(Vertex3D.regex);
  if (!match) return null;
  unit = unit ? (unit === true ? Measurement.unit.BASE : unit) : Measurement.unit();
  if (!list) return new Vertex3D(Measurement.decimal(match[1], unit),
                                  Measurement.decimal(match[2], unit),
                                  Measurement.decimal(match[3], unit));
  const matches = string.match(new RegExp(Vertex3D.regex.g()));
  const vertices = [];
  matches.forEach(m => vertices.push(Vertex3D.fromString(m, unit)));
  return vertices;
}

Vertex3D.regex.model = (string, unit, scale) =>
    new CSG.Point(Vertex3D.fromString(string, unit).scale(scale), null,
          Color.fromString(string));

Vector3D.regex = new RegExp(Vertex3D.regex);
Vector3D.fromString = Vertex3D.fromString;
Vector3D.regex.model = (string, unit, scale) => {
  const vector = Vector3D.fromString(string, unit);
  vector.scale(scale);
  const vectCSG = new CSG.Vector(vector);
  vectCSG.color = Color.fromString(string);
  return vectCSG;
}


Object.class.register(Vertex3D, 'x', 'y', 'z');
module.exports = Vertex3D;
