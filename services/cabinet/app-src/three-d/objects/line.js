
const Vector3D = require('./vector');
const Vertex3D = require('./vertex');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line');
const Plane = require('./plane');
const FixedValue = require('./fixed-value');
const withinTol = new (require('../../../../../public/js/utils/tolerance.js'))(.00000001).within;

const zero = (val) => {
  if (withinTol(val, 0)) return 0
  return val;
}

// TODO: It would be nice if this[0] === this.startvertex && this[1] === endVertex
class Line3D {
  constructor(startVertex, endVertex) {
    if (startVertex === undefined || endVertex === undefined) throw new Error('Lines must have a start and an end point');
    this.startVertex = new Vertex3D(startVertex);
    this.endVertex = new Vertex3D(endVertex);
    const instance = this;

    this.clone = () => new Line3D(this.startVertex.clone(), this.endVertex.clone());

    this.negitive = () => new Line3D(this.endVertex, this.startVertex);
    this.equals = (other) => this.startVertex && this.endVertex && other &&
        this.startVertex.equals(other.startVertex) && this.endVertex.equals(other.endVertex);
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

    this.isPoint = () => this.startVertex.equals(this.endVertex);

    this.planeAt = (rotation) => {
      const two = new Vertex3D({x: this.startVertex.x + 1, y: this.startVertex.y, z: this.startVertex.z});
      two.rotate(rotation, this.startVertex);
      const three = {x: this.endVertex.x + 1, y: this.endVertex.y, z: this.endVertex.z};
      thtee.rotate(rotation, this.endVertex);
      return new Plane(this.startVertex.copy(), two, three, this.endVertex.copy());
    }

    this.on = (vertex, tolerance) => {
      tolerance ||= .01;
    }

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

    this.toString = () => `${new String(this.startVertex)} => ${new String(this.endVertex)}`;
    this.toNegitiveString = () => `${new String(this.endVertex)} => ${new String(this.startVertex)}`;

    this.midpoint = () => new Vertex3D(
      (this.endVertex.x +this.startVertex.x) / 2,
      (this.endVertex.y +this.startVertex.y) / 2,
      (this.endVertex.z +this.startVertex.z) / 2
    );

    this.length = () => this.vector().magnitude();

    this.fromStart = (distance) => this.startVertex.translate(this.vector().unit().scale(distance), true);
    this.fromEnd = (distance) => this.endVertex.translate(this.vector().unit().scale(distance), true);

    this.adjustLength = (newLength, fromStartVertex) => {
      if ((typeof newLength) !== 'number' || newLength === 0) return;
      const unitVec = this.vector().unit();
      if (fromStartVertex !== undefined) {
        if (fromStartVertex === true) {
          this.endVertex.positionAt(this.startVertex.translate(unitVec.scale(newLength), true));
        } else {
          this.startVertex.positionAt(this.endVertex.translate(unitVec.scale(newLength), true));
        }
      } else {
        const halfLenMag = newLength/2;
        const halfDistVec = unitVec.scale(halfLenMag);
       this.startVertex.translate(halfDistVec.inverse());
       this.endVertex.translate(halfDistVec);
      }
    }

    this.polarize = (vertex) => {
      if (this.startVertex.distance(vertex) > this.endVertex.distance(vertex)) {
        const temp = this.startVertex;
        this.startVertex = this.endVertex;
        this.endVertex = temp;
      }
      return this;
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
    }

    this.reverseRotate = (rotation, center) => {
      center ||= this.midpoint();
     this.startVertex.reverseRotate(rotation, center);
     this.endVertex.reverseRotate(rotation, center);
    }

    this.to2D = (x,y) => Line3D.to2D([this], x, y)[0];

    this.acquiescent = (trendSetter) => {
      if (!(trendSetter instanceof Line2d)) return this;
      const shouldReverse = trendSetter.endVertex.distance(this.endVertex) <
                            trendSetter.endVertex.distance(this.startVertex);
      if (shouldReverse) return this.negitive();
      return this;
    }
  }
}

Line3D.vertices = (lines, true4startfalse4end) => {
  const verts = [];
  const includeBoth = true4startfalse4end !== true && true4startfalse4end !== false;
  const includeStart = includeBoth || true4startfalse4end === true;
  const includeEnd = includeBoth || true4startfalse4end === false;
  for (let index = 0; index < lines.length; index += 1) {
    if (includeStart) verts.push(lines[index].startVertex.copy());
    if (includeEnd) verts.push(lines[index].endVertex.copy());
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
  for (let index = 1; index < list.length; index++) {
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

module.exports = Line3D;
