
const Vector3D = require('./vector');
const Plane = require('./plane');

class Line3D {
  constructor(startVertex, endVertex) {
    this.startVertex = startVertex;
    this.endVertex = endVertex;


    let i = endVertex.x - startVertex.x;
    let j = endVertex.y - startVertex.y;
    let k = endVertex.z - startVertex.z;
    const vector = new Vector3D(i,j,k);

    this.negitive = () => new Line3D(endVertex, startVertex);
    this.equals = (other) => startVertex && endVertex && other &&
        startVertex.equals(other.startVertex) && endVertex.equals(other.endVertex);
    this.vector = () => vector;

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

    this.midpoint = () => ({
      x: endVertex.x - startVertex.x,
      x: endVertex.y - startVertex.y,
      x: endVertex.z - startVertex.z
    })

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

module.exports = Line3D;
