
const Vector3D = require('./vector');
const Vertex3D = require('./vertex');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line');
const Plane = require('./plane');
const FixedValue = require('./fixed-value');
const ToleranceMap = require('../../../../../public/js/utils/tolerance-map.js');
const tol = .00000001;
const withinTol = new (require('../../../../../public/js/utils/tolerance.js'))(tol).within;

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

    this.invert = () => {
      const temp = [this.startVertex.x, this.startVertex.y, this.startVertex.z];
      this.startVertex.x = this.endVertex.x;
      this.startVertex.y = this.endVertex.y;
      this.startVertex.z = this.endVertex.z;
      this.endVertex.x = temp[0];
      this.endVertex.y = temp[1];
      this.endVertex.z = temp[2];
    }
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

    this.viewFromVector = (vector) => Line3D.viewFromVector([this], vector)[0];

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
      vertex ||= {x:0, y:0, z:0}
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
     return this;
    }

    this.reverseRotate = (rotation, center) => {
      center ||= this.midpoint();
     this.startVertex.reverseRotate(rotation, center);
     this.endVertex.reverseRotate(rotation, center);
     return this;
    }

    this.to2D = (x,y) => Line3D.to2D([this], x, y)[0];

    this.acquiescent = (trendSetter) => {
      if (!(trendSetter instanceof Line2d)) return this;
      const shouldReverse = trendSetter.endVertex.distance(this.endVertex) <
                            trendSetter.endVertex.distance(this.startVertex);
      if (shouldReverse) return this.negitive();
      return this;
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

    this.combineOrder = (other) => Line3D.combineOrder(this, other);
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
    return Line3D.to2D([ortho1, ortho2], 'y', 'x');
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
const checkForEquality = (align, alignTo) => {
  let equal = true;
  for (let index = 0; index < align.length; index++) {
    if (!align[index].equals(alignTo[index])) equal = false;
  }
  return equal;
}
function determinRotations(align, alignTo, reverse) {
  align = align.map(l => l.clone());
  const rotations = [];
  let cycles = 0;
  let keepGoing = true;
  while (keepGoing && cycles++ < 7) {
    for (let aIndex = 0; aIndex < align.length; aIndex++) {
      const unitLine = align[aIndex];
      const targetLine = alignTo[aIndex];
      const rotationLength = rotations.length;
      for (let index = 0; index < pivots.length; index++) {
        const pivot = (reverse ? revPivots : pivots)[index];
        const rotation = determineRotation(unitLine, targetLine, pivot, reverse);
        if (rotation) {
          align = align.map(l => reverse ? l.reverseRotate(rotation) : l.rotate(rotation));
          rotations.push(rotation);
        }
      }
      keepGoing = rotations.length !== rotationLength;
    }
  }

  // if (!checkForEquality(align, alignTo))
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
  if (shorterBy < 0) return null;
  if (!unitVec1.equals(longest.vector().unit())) longest = longest.negitive();
  verts.sort(Vertex3D.sortByCenter(longest.startVertex));
  let first = new Line3D(verts[0], verts[1]);
  let second = new Line3D(verts[0], verts[2]);
  if (!((unitVec1.equals(first.vector().unit()) || first.isPoint()) &&
      (unitVec1.equals(second.vector().unit()) || second.isPoint()))) return null;
  verts.shorterBy = shorterBy;
  return verts;
}

Line3D.averageLine = (lines) => {
  const startPoint = {x: 0, y:0, z:0};
  const endPoint = {x: 0, y:0, z:0};
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].polarize({x: 0, y:0, z:0});
    startPoint.x += line.startVertex.x / lines.length;
    startPoint.y += line.startVertex.y / lines.length;
    startPoint.z += line.startVertex.z / lines.length;
    endPoint.x += line.endVertex.x / lines.length;
    endPoint.y += line.endVertex.y / lines.length;
    endPoint.z += line.endVertex.z / lines.length;
  }
  return new Line3D(startPoint, endPoint);
}

function radianDifference(center, line1, line2) {
  const v1 = line1.startVertex;
  const v2 = line1.endVertex;
  const v3 = line2.startVertex;
  const v4 = line2.endVertex;

}

function radianlyOrientLine(center, line, line2d) {
  const radial1 = new Line2d(center, line2d.startVertex());
  const radial2 = new Line2d(center, line2d.endVertex());
  if (radial2.thetaBetween(radial1) < Math.PI) {
    line.invert();
  }
}

Line3D.radialSorter = (center, vector) => (line1, line2) => {
  const line12d = line1.viewFromVector(vector).to2D('x', 'y');
  const line22d = line2.viewFromVector(vector).to2D('x', 'y');
  radianlyOrientLine(center, line1, line12d);
  radianlyOrientLine(center, line2, line22d);
  const radial1 = new Line2d(center, line12d.midpoint());
  const radial2 = new Line2d(center, line22d.midpoint());
  return radial1.radians() - radial2.radians();
}

Line3D.radialSort = (lines, center, vector) => {
  lines.sort(Line3D.radialSorter(center, vector));
}

Line3D.parrelleSets = (lines, tolerance) => {
  tolerance ||= tol;
  const tolmap = new ToleranceMap({'vector.positiveUnit.i': tolerance,
                                  'vector.positiveUnit.j': tolerance,
                                  'vector.positiveUnit.k': tolerance});
  tolmap.addAll(lines);
  const groups = tolmap.group();
  return groups;
}


module.exports = Line3D;
