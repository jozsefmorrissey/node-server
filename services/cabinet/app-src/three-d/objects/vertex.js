
const Matrix = require('./matrix');
const Vector3D = require('./vector');
const approximate = require('../../../../../public/js/utils/approximate.js');
const CSG = require('../../../public/js/3d-modeling/csg.js');


class Vertex3D {
  constructor(x, y, z) {
    if (x instanceof Vertex3D) return x;
    if (arguments.length == 3) {
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

    this.translate = (vector, doNotModify) => {
      let vertex = this;
      if (doNotModify === true) vertex = this.copy();
      vertex.x += vector.i();
      vertex.y += vector.j();
      vertex.z += vector.z();
      return vertex;
    }

    this.usless = () => Number.NaNfinity(x, y, z);

    this.vector = (vector) => {
      const v = vector;
      if (v) return new Vector3D(this.x + v.i(), this.y + v.j(), this.z + v.k());
      return new Vector3D(this.x, this.y, this.z);
    }

    this.rotate = (rotations, center) => {
      if (center === undefined) return;
      CSG.rotatePointAroundCenter(rotations, this, center);
    }

    this.reverseRotate = (rotations, center) => {
      if (center === undefined) return;
      CSG.rotatePointAroundCenter(rotations, this, center, true);
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

    this.minus = (other) => {
      const xDiff = this.x - other.x;
      const yDiff = this.y - other.y;
      const zDiff = this.z - other.z;

      return new Vector3D(xDiff, yDiff, zDiff);
    }

    this.inverseVector = () => {
      return new Vertex3D(this.x * -1, this.y* -1, this.z * -1);
    }

    this.copy = () => new Vertex3D(this.x, this.y, this.z);
    this.equals = (other) => other && approximate.eq(this.x, other.x) &&
          approximate.eq(this.y, other.y);
    this.toString = () => `${this.x},${this.y},${this.z}`;
  }
}

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

Vertex3D.center = (...verticies) => {
  let x = 0;
  let y = 0;
  let z = 0;
  let count = 0;
  verticies.forEach((vertex) => {
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

module.exports = Vertex3D;
