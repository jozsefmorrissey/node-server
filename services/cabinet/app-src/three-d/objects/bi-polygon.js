
const CSG = require('../../../../../public/js/utils/3d-modeling/csg.js');
const Line3D = require('line');
const Vector3D = require('vector');
const Vertex3D = require('vertex');
const Polygon3D = require('polygon');
const Plane = require('plane');

class BiPolygon {
  constructor(polygon1, polygon2) {
    if (Array.isArray(polygon1)) polygon1 = new Polygon3D(polygon1);
    if (Array.isArray(polygon2)) polygon2 = new Polygon3D(polygon2);
    const orientationVector = new Line3D(polygon2.center(), polygon1.center()).vector();
    try {
      if (!polygon1.normal().sameDirection(orientationVector)) {
        polygon1 = polygon1.reverse();
        polygon2 = polygon2.reverse();
      }
      if (polygon2.normal().sameDirection(orientationVector)) {
        polygon2 = polygon2.reverse();
      }
    } catch (e) {
      console.log();
    }
    const face1 = polygon1.vertices();
    const face2 = polygon2.vertices();
    const instance = this;
    if (face1.length !== face2.length)
      throw new Error('Polygons need to have an equal number of vertices');


    this.copy = () => new BiPolygon(polygon1.copy(), polygon2.copy());

    this.front = () => new Polygon3D(face1);
    this.back = () =>
      new Polygon3D(face2);

    this.lines = () => this.front().lines().concat(this.back().lines());
    this.vertices = () => this.front().vertices().concat(this.back().vertices());

    this.faceNormal = (index) => face2[index || 0].distanceVector(face1[index || 0]).unit();

    this.normal = () => polygon1.normal();
    this.normalTop = () => polygon1.lines()[1].vector().unit().inverse();
    this.normalRight = () => this.normalTop().crossProduct(this.normal()).unit().inverse();

    this.normals = () => ({
      x: this.normalRight(),
      y: this.normalTop(),
      z: this.normal()
    });

    this.valid = () => this.front().valid() && this.back().valid();

    this.distance = (vertex) => {
      const frontDist = this.front().toPlane().distance(vertex);
      const backDist = this.back().toPlane().distance(vertex);
      return frontDist < backDist ? frontDist : backDist;
    }


    function extendAlongNormal(vector) {
      const normal = instance.normal();
      if (vector.dot(normal) > .0001) face1.forEach(v => v.translate(vector));
      if (vector.dot(normal.inverse()) > .0001) face2.forEach(v => v.translate(vector));
    }

    /**
            *                                        *
               *                                                  *
        *  face *         <10,0,0> =>            *      face       *

        *       *                                *                 *
    **/
    function extendFaces(vector, face) {
      const center = Vertex3D.center(face);
      const unitVect = vector.unit();
      for (let index = 0; index < face.length; index++) {
        const vert = face[index];
        const centerRadial = new Line3D(center, vert);
        const dot = centerRadial.vector().unit().dot(unitVect);
        if (dot > .0001) {
          vert.translate(vector);
        }
      }
    }

    this.extend = (vector) => {
      extendAlongNormal(vector);
      extendFaces(vector, face1);
      extendFaces(vector, face2);
    }

    this.toArray = () => [polygon1.vertices(), polygon2.vertices()];
    this.orderBy = {};
    this.orderBy.polygon = (polygon) => {
      const faces = this.closestOrder(polygon.center());
      const closest = faces[0];
      const shift = closest.orderBy.polygon(polygon);
      if (shift === null) return;
      faces[1].shift(shift);
      return shift;
    }
    this.orderBy.biPolygon = (biPolygon) => {
      const closestFace = biPolygon.closestOrder(this.center())[0];
      return this.orderBy.polygon(closestFace);
    }

    this.furthestOrder = (vertex) => {
      const front = this.front();
      const back = this.back();
      return front.center().distance(vertex) > back.center().distance(vertex) ?
              [front, back] : [back, front];
    }

    this.closestOrder = (vertex) => this.furthestOrder(vertex).reverse();

    this.translate = (vector) => {
      for (let index = 0; index < face1.length; index++) {
        face1[index].translate(vector);
        face2[index].translate(vector);
      }
    }

    this.rotate = (rotations, center) => {
      center ||= this.center();
      for (let index = 0; index < face1.length; index++) {
        face1[index].rotate(rotations, center);
        face2[index].rotate(rotations, center);
      }
    }

    this.offset = (fromPoint, distance) => {
      const dirVector = this.center().minus(fromPoint).unit();
      this.translate(dirVector.scale(distance));
    }

    this.center = (newCenter) => {
      if (!(newCenter instanceof Vertex3D))
        return new Vertex3D(Math.midrange(face1.concat(face2), ['x', 'y', 'z']));
      const center = this.center();
      this.translate(newCenter.minus(center));
      return this.center();
    }

    this.closerPlane = (vertex) => {
      const center1 = Vertex3D.center(face1);
      const center2 = Vertex3D.center(face2);
      const targetFace = center1.distance(vertex) < center2.distance(vertex) ? face1 : face2;
      return new Plane(...targetFace);
    }

    this.furtherPlane = (vertex) => {
      const center1 = Vertex3D.center(face1);
      const center2 = Vertex3D.center(face2);
      const targetFace = center1.distance(vertex) > center2.distance(vertex) ? face1 : face2;
      return new Plane(...targetFace);

    }

    function normalize (verts) {
      const normal =  new Polygon3D(verts).normal().toArray();
      const returnValue = [];
      for (let index = 0; index < verts.length; index++)
        returnValue[index] = new CSG.Vertex(verts[index], normal);
      return returnValue;
    }

    function allNormsRepresented (polys) {
      const normList = [{x:1,y:0,z:0},
                        {x:-1,y:0,z:0},
                        {x:0,y:1,z:0},
                        {x:0,y:-1,z:0},
                        {x:0,y:0,z:-1},
                        {x:0,y:0,z:1}];
      for (let index = 0; index < 6; index++) {
        let found = false;
        const norm = normList[index];
        for (let ndex = 0; ndex < 6; ndex++) {
          const pNorm = polys[ndex].plane.normal;
          if (norm.x === pNorm.x && norm.y === pNorm.y && norm.z === pNorm.z) {
            found = true;
            break;
          }
        }
        if (!found)  {
          return false;
        }
      }
      return true;
    }

    this.model = (joints) => {
      const frontNorm = new Vertex3D(new Line3D(this.center(), this.front().center()).vector().unit());
      const front = new CSG.Polygon(normalize(face1));
      const backNorm = new Vertex3D(new Line3D(this.center(), this.back().center()).vector().unit());
      const back = new CSG.Polygon(normalize(face2));
      const polygonSets = [front, back];
      const sides = this.sides();

      for (let index = 0; index < sides.length; index++) {
         const normalized = normalize(sides[index].vertices());
         const poly = new CSG.Polygon(normalized);
         polygonSets.push(poly);
      }
      // polygonSets.forEach(p => p.setColor(0,0,255));

      return CSG.fromPolygons(polygonSets);
    }

    const counterClockWiseSide = (index, len) => {
      const index2 = (index + 1) % len;
      const backIndex = (len - index - 1) % len;
      const backIndex2 = (2*len - index - 2) % len;
      const vertices = [face1[index2], face1[index], face2[backIndex], face2[backIndex2]];
      return new Polygon3D(vertices);
    }
    const clockWiseSide = (index, len) => {
      const index2 = (index + 1) % len;
      const backIndex = (len - index - 1) % len;
      const backIndex2 = (2*len - index - 2) % len;
      const vertices = [face2[backIndex], face2[backIndex2], face1[index2], face1[index]];
      return new Polygon3D(vertices);
    }
    this.sides = () => {
      const sides = [];
      const len = face1.length;
      for (let index = 0; index < len; index++) {
        sides.push((index >= len/2 ? clockWiseSide : counterClockWiseSide)(index, len));
      }
      return sides;
    }

    this.toPolygons = () => {
      const polygons = [new Polygon3D(face1), new Polygon3D(face2)];
      polygons.concatInPlace(this.sides());
      return polygons;
    }

    const setDot = (set, normal) => new Line3D(set[0].center(), set[1].center()).vector().unit().dot(normal);
    const setAbsDot = (set, normal) => Math.abs(setDot(set, normal));
    this.setMostInLineWith = (normal) => {
      const polys = this.toPolygons();
      const sets = [[polys[0], polys[1]], [polys[2], polys[4]], [polys[3], polys[5]]];
      sets.sort((set1, set2) => setAbsDot(set2, normal) - setAbsDot(set1, normal));
      return sets[0];
    }

    this.closestPoly = (vertex) => {
      const polys = this.toPolygons();
      let closest = null;
      for (let index = 0; index < polys.length; index++) {
        const poly = polys[index];
        const dist = poly.center().distance(vertex);
        if (closest === null || closest.dist > dist) {
          closest = {poly, dist};
        }
      }
      return closest && closest.poly.copy();
    }

    this.to2D = (vector) => {
      return Polygon3D.toTwoD([this.front(), this.back()], vector);
    }

    this.toDrawString = (color, includeNormals) => {
      return this.toPolygons().map(p => p.toDrawString(p.equals(this.front()) ? 'red' : color, includeNormals)).join('\n\n');
    }

    this.equals = (other) => {
      if (!(other instanceof BiPolygon)) return false;
      return this.front().equals(other.front()) && this.back().equals(other.back());
    }


    this.toString = () => {
      let face1Str = '';
      let face2Str = '';
      for (let index = 0; index < face1.length; index++) {
        face1Str += `(${face1[index].toString()}), `;
        face2Str += `(${face2[index].toString()}), `;
      }
      face1Str = face1Str.substring(0, face1Str.length - 2);
      face2Str = face2Str.substring(0, face2Str.length - 2);
      return `${face1Str}\n${face2Str}`;
    }
  }
}

// TODO: fromPolygon(poly, 0, -.6) causing csg modeling issues
BiPolygon.fromPolygon = (polygon, distance1, distance2, offset) => {
  distance2 ||= 0;
  const verts = polygon.copy().vertices();
  // if (verts.length < 4) return undefined;
  if (verts.length < 3) return undefined;
  const resized = offset ? polygon.offset(offset.x, offset.y, true) : polygon;
  const poly1 = resized.parrelleAt(distance1);
  const poly2 = resized.parrelleAt(distance2);
  let poly = new BiPolygon(poly1, poly2);
  return poly;
}

BiPolygon.fromVectorObject =
    (width, height, depth, center, vectorObj) => {
      try {
        center ||= new Vertex3D(0,0,0);
        if (vectorObj === undefined) {
          vectorObj = {x: new Vector3D(1,0,0), y: new Vector3D(0,1,0), z: new Vector3D(0,0,1)};
        } else {
          vectorObj = {x: new Vector3D(vectorObj.x), y: new Vector3D(vectorObj.y), z: new Vector3D(vectorObj.z) }
        }
        const frontCenter = center.translate(vectorObj.z.scale(depth/-2), true);
        const front = Polygon3D.fromVectorObject(width, height, frontCenter, vectorObj);
        const backCenter = center.translate(vectorObj.z.scale(depth/2), true);
        const back = Polygon3D.fromVectorObject(width, height, backCenter, vectorObj);
        let poly;
        if (frontCenter.minus(backCenter).sameDirection(vectorObj.z)) {
          poly = new BiPolygon(front, back);
        } else {
          poly = new BiPolygon(back, front);
        }
        return poly;
      } catch(e) {
        console.error(e);
      }
}

BiPolygon.fromPositionObject = (position) => {
  const dem = position.demension;
  const center = new Vertex3D(position.center);
  const vecObj = position.normals;
  return BiPolygon.fromVectorObject(dem.x, dem.y, dem.z, center, vecObj);
}

Object.class.register(BiPolygon);
BiPolygon.toJson = (bipoly) => {
  return {_TYPE: BiPolygon.name, front: Polygon3D.toJson(bipoly.front()),
                                  back: Polygon3D.toJson(bipoly.back())};
}
BiPolygon.fromJson = (json) =>
  new BiPolygon(Polygon3D.fromJson(json.front), Polygon3D.fromJson(json.back));


module.exports = BiPolygon;
