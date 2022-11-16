
const Vector3D = require('./vector');
const Vertex3D = require('./vertex');
const Plane = require('./plane');

class Line3D {
  constructor(startVertex, endVertex) {
    if (startVertex === undefined || endVertex === undefined) throw new Error('Lines must have a start and an end point');
    startVertex = new Vertex3D(startVertex);
    endVertex = new Vertex3D(endVertex);
    this.startVertex = startVertex;
    this.endVertex = endVertex;

    this.clone = () => new Line3D(startVertex.clone(), endVertex.clone());

    this.negitive = () => new Line3D(endVertex, startVertex);
    this.equals = (other) => startVertex && endVertex && other &&
        startVertex.equals(other.startVertex) && endVertex.equals(other.endVertex);
    this.vector = () => {
      let i = endVertex.x - startVertex.x;
      let j = endVertex.y - startVertex.y;
      let k = endVertex.z - startVertex.z;
      return new Vector3D(i,j,k);
    };

    this.translate = (vector) => {
      this.startVertex.translate(vector);
      this.endVertex.translate(vector);
    }

    this.planeAt = (rotation) => {
      const two = new Vertex3D({x: startVertex.x + 1, y: startVertex.y, z: startVertex.z});
      two.rotate(rotation, startVertex);
      const three = {x: endVertex.x + 1, y: endVertex.y, z: endVertex.z};
      thtee.rotate(rotation, endVertex);
      return new Plane(startVertex.copy(), two, three, endVertex.copy());
    }

    this.on = (vertex, tolerance) => {
      tolerance ||= .01;
    }

    this.equation = () => {
      const returnValue = {};
      for (let i = 0; i < 3; i++) {
        let coord = String.fromCharCode(i + 120);
        let t = (endVertex[coord] - startVertex[coord]) / 1;
        if (t !== 0) {
          let coef = String.fromCharCode(i + 97);
          returnValue[coef] = 1;

          let offset = ((i + 1) % 3);
          coord = String.fromCharCode(offset + 120);
          coef = String.fromCharCode(offset + 97);
          returnValue[coef] = (endVertex[coord] - startVertex[coord]) / t;

          offset = ((i + 2) % 3);
          coord = String.fromCharCode(offset + 120);
          coef = String.fromCharCode(offset + 97);
          returnValue[coef] = (endVertex[coord] - startVertex[coord]) / t;
          break;
        }
      }
      if (returnValue.a === undefined) throw new Error('This Line is a point... I think...');
      return returnValue;
    }

    this.toString = () => `${new String(this.startVertex)} => ${new String(this.endVertex)}`;
    this.toNegitiveString = () => `${new String(this.endVertex)} => ${new String(this.startVertex)}`;

    this.midpoint = () => new Vertex3D(
      (endVertex.x + startVertex.x) / 2,
      (endVertex.y + startVertex.y) / 2,
      (endVertex.z + startVertex.z) / 2
    );

    this.length = () => this.vector().magnitude();

    this.adjustLength = (change) => {
      if ((typeof change) !== 'number' || change === 0) return;
      const len = this.length();
      const halfChangeMag = change/2;
      const unitVec = this.vector().unit();
      const halfDistVec = unitVec.scale(halfChangeMag);
      startVertex.translate(halfDistVec.inverse());
      endVertex.translate(halfDistVec);
    }

    this.pointAtDistance = (distance) => {
      const point = startVertex.copy();
      const unitVec = this.vector().unit();
      point.translate(unitVec.scale(distance));
      return point;
    }

    this.rotate = (rotation, center) => {
      center ||= this.midpoint();
      startVertex.rotate(rotations, center);
      endVertex.rotate(rotations, center);
    }

    this.reverseRotate = (rotation, center) => {
      center ||= this.midpoint();
      startVertex.reverseRotate(rotations, center);
      endVertex.reverseRotate(rotations, center);
    }

  }
}

Line3D.verticies = (lines) => {
  const verts = [];
  for (let index = 0; index < lines.length; index += 1) {
    verts.push(lines[index].endVertex);
  }
  return verts;
}

Line3D.adjustVerticies = (vert1, vert2, change) => {
  const line = new Line3D(vert1, vert2);
  line.adjustLength(change);
}

module.exports = Line3D;
