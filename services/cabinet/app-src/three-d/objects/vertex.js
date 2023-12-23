
const Matrix = require('./matrix');
const Vector3D = require('./vector');
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex');
const approximate = require('../../../../../public/js/utils/approximate.js');
const approx10 = approximate.new(10);
const CSG = require('../../../../../public/js/utils/3d-modeling/csg.js');
const Tolerance = require('../../../../../public/js/utils/tolerance.js');
const ToleranceMap = require('../../../../../public/js/utils/tolerance-map.js');

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

    this.translate = (vector, doNotModify) => {
      let vertex = this;
      if (doNotModify === true) vertex = this.copy();
      if (!(vector instanceof Vector3D)) vector = new Vector3D(vector);
      vertex.x += vector.i();
      vertex.y += vector.j();
      vertex.z += vector.k();
      return vertex;
    }

    this.positionAt = (vertex) => {
      this.x = vertex.x;
      this.y = vertex.y;
      this.z = vertex.z;
    }

    this.finite = () => {
      return Number.isFinite(this.x + this.y + this.z);
    }

    this.usless = () => Number.NaNfinity(this.x, this.y, this.z);

    this.vector = (vector) => {
      const v = vector;
      if (v) return new Vector3D(this.x + v.i(), this.y + v.j(), this.z + v.k());
      return new Vector3D(this.x, this.y, this.z);
    }

    this.rotate = (rotations, center) => {
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
    this.equals = (otherOx, y, z, tolerance) => {
      const tol = tolerance ? new Tolerance({x: tolerance, y: tolerance, z: tolerance}) :
                              Vertex3D.tolerance;
      if (otherOx instanceof Object)
        return tol.within(this, otherOx);
      return tol.within(this, new Vertex3D(otherOx, y, z));
    }
    this.toString = () => `(${approx10(this.x)},${approx10(this.y)},${approx10(this.z)})`;
    this.toAccurateString = () => `(${approximate(this.x)},${approximate(this.y)},${approximate(this.z)})`;
  }
}

const tol = .001;
Vertex3D.tolerance = new Tolerance({x: tol, y: tol, z: tol});

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

Vertex3D.uniqueFilter = () => {
  const map = new ToleranceMap({x: tol, y: tol, z: tol});
  return (vert) => {
    if (!(vert instanceof Vertex3D)) return false;
    if (map.matches(vert).length > 0) return false;
    map.add(vert);
    return true;
  }
}

Vertex3D.center = (...vertices) => {
  if (Array.isArray(vertices[0])) vertices = vertices[0];
  let x = 0;
  let y = 0;
  let z = 0;
  let count = 0;
  vertices.forEach((vertex) => {
    if (Number.isFinite(vertex.x + vertex.y + vertex.z)) {
      count++;
      x += vertex.x;
      y += vertex.y;
      z += vertex.z;
    } else {
      throw new Error("Vertex contains a non-number");
    }
  });
  return new Vertex3D({x: x/count, y: y/count, z: z/count});
}

Vertex3D.to2D = (vertices, x, y) => {
  const verts2D = [];
  for (let index = 0; index < vertices.length; index++) {
    verts2D.push(new Vertex2d(vertices[index][x], vertices[index][y]));
  }
  return verts2D;
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
    return vect1.positive() ? -1 : 1;
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

class SimpleVertex3D {
  constructor(x, y, z) {
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
  }
}

Vertex3D.Simple = SimpleVertex3D;

module.exports = Vertex3D;
