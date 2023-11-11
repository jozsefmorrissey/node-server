
const CSG = require('../../../../../public/js/utils/3d-modeling/csg.js');
const Line3D = require('line');
const Vector3D = require('vector');
const Vertex3D = require('vertex');
const Polygon3D = require('polygon');
const Plane = require('plane');
const Joint = require('../../objects/joint/joint.js');

class BiPolygon {
  constructor(polygon1, polygon2) {
    const face1 = polygon1.vertices();
    const face2 = polygon2.vertices();
    const instance = this;
    if (face1.length !== face2.length) throw new Error('Polygons need to have an equal number of vertices');

    this.copy = () => new BiPolygon(polygon1.copy(), polygon2.copy());

    this.front = () => new Polygon3D(face1);
    this.back = () =>
      new Polygon3D(face2);

    this.lines = () => this.front().lines().concat(this.back().lines());
    this.vertices = () => this.front().vertices().concat(this.back().vertices());

    this.faceNormal = (index) => face2[index || 0].distanceVector(face1[index || 0]).unit();

    this.normal = () => this.flippedNormal() ? polygon1.normal() : polygon1.normal().inverse();
    this.normalTop = () => polygon1.lines()[1].vector().unit().inverse();
    this.normalRight = () => this.normalTop().crossProduct(this.normal()).unit().inverse();

    this.normals = () => ({
      top: this.normalTop(),
      front: this.normal(),
      right: this.normalRight()
    });

    this.valid = () => this.front().valid() && this.back().valid();

    this.distance = (vertex) => {
      const frontDist = this.front().toPlane().distance(vertex);
      const backDist = this.back().toPlane().distance(vertex);
      return frontDist < backDist ? frontDist : backDist;
    }

    this.extend = (vector) => {
      let lines = [];
      for (let index = 0; index < face1.length; index++) {
        const endIndex = Math.mod(index + 1, face1.length);
        lines.push(new Line3D(face1[index], face1[endIndex]));
      }
      for (let index = 0; index < face1.length; index++) {
        const endIndex = Math.mod(index + 1, face1.length);
        lines.push(new Line3D(face2[index], face2[endIndex]));
      }
      for (let index = 0; index < face1.length; index++) {
        const endIndex = Math.mod(index + 1, face1.length);
        lines.push(new Line3D(face1[index], face2[index]));
      }
      lines = lines.sort((a, b) => a.vector().hash() - b.vector().hash());
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const lineVect = line.vector();
        const projection = vector.projectOnTo(lineVect);
        const posMag = projection.add(lineVect).magnitude();
        const negMag = projection.minus(lineVect).magnitude();
        const fromStart = posMag > negMag;
        const magnitude = fromStart ? posMag : -negMag;
        if (line.length() !== Math.abs(magnitude)) {
          line.adjustLength(magnitude, fromStart);
        }
      }
    }

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
      const dirVector = this.center().minus(fromPoint);
      const normal = this.normal();
      if (!dirVector.sameDirection(normal)) {
        distance *= -1;
      }
      this.translate(normal.scale(distance));
    }

    this.center = (newCenter) => {
      if (!(newCenter instanceof Vertex3D))
        return new Vertex3D(Math.midrange(face1.concat(face2), ['x', 'y', 'z']));
      const center = this.center();
      this.translate(newCenter.minus(center));
      return this.center();
    }

    this.closerPlane = (vertex) => {
      const poly1 = new Plane(...face1);
      const poly2 = new Plane(...face2);
      return poly1.center().distance(vertex) < poly2.center().distance(vertex) ? poly1 : poly2;
    }

    this.furtherPlane = (vertex) => {
      const poly1 = new Plane(...face1);
      const poly2 = new Plane(...face2);
      return poly1.center().distance(vertex) > poly2.center().distance(vertex) ? poly1 : poly2;
    }

    this.flippedNormal = () => {
      const face1Norm = new Polygon3D(face1).normal();
      return this.faceNormal().sameDirection(face1Norm);
    }


    function normalize (verts, reverse) {
      const normal =  new Polygon3D(verts).normal().toArray();
      const returnValue = [];
      for (let index = 0; index < verts.length; index++)
        returnValue[index] = new CSG.Vertex(verts[index], normal);
      return reverse ? returnValue.reverse() : returnValue;
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

    this.toModel = (joints) => {
      const flippedNormal = this.flippedNormal();
      const frontNorm = new Vertex3D(new Line3D(this.center(), this.front().center()).vector().unit());
      const front = new CSG.Polygon(normalize(face1, !flippedNormal));
      if (!frontNorm.equals(front.plane.normal)) {
        console.log.subtle('different');
      }
      // front.plane.normal = front.vertices[0].normal.clone();//new CSG.Vector([0,1, 0,0]);
      const backNorm = new Vertex3D(new Line3D(this.center(), this.back().center()).vector().unit());
      const back = new CSG.Polygon(normalize(face2, flippedNormal));
      if (!backNorm.equals(back.plane.normal)) {
        console.log.subtle('different');
      }
      // back.plane.normal = back.vertices[0].normal.clone();//new CSG.Vector([0,0,1,0,0]);
      const polygonSets = [front, back];

      for (let index = 0; index < face1.length; index++) {
        const index2 = (index + 1) % face1.length;
         const vertices = [face1[index], face1[index2], face2[index2], face2[index]];
         const normalized = normalize(vertices, flippedNormal);
         const poly = new CSG.Polygon(normalized);
         polygonSets.push(poly);
         const polyCenter = Vertex3D.center(...vertices);
         const polyNorm = new Vertex3D(new Line3D(this.center(), polyCenter).vector().unit());
         const back = new CSG.Polygon(normalize(face2, flippedNormal));
         if (!polyNorm.equals(poly.plane.normal)) {
           console.log.subtle('different');
         }
         // polygonSets[polygonSets.length - 1].plane.normal = normalized[0].normal.clone();
      }
      // polygonSets.forEach(p => p.setColor(0,0,255));

      const polys = CSG.fromPolygons(polygonSets);
      // polys.normals = {
      //   front: this.normal(),
      //   right: this.normalRight(),
      //   top: this.normalTop()
      // }
      return Joint.apply(polys, joints);
    }

    this.toPolygons = () => {
      const polygons = [new Polygon3D(face1), new Polygon3D(face2)];

      for (let index = 0; index < face1.length; index++) {
        const index2 = (index + 1) % face1.length;
        const vertices = [face1[index], face1[index2], face2[index2], face2[index]];
        polygons.push(new Polygon3D(vertices));
      }

      return polygons;
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
      return closest && closest.poly;
    }

    this.to2D = (vector) => {
      return Polygon3D.toTwoD([this.front(), this.back()], vector);
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

// TODO: Fix offset!... is it broken??? yes it is need to expand consitantly regaurdless of line angle.
BiPolygon.fromPolygon = (polygon, distance1, distance2, offset) => {
  distance2 ||= 0;
  // if (distance2 > distance1) {
  //   const temp = distance1;
  //   distance2 = distance1;
  //   distance1 = temp;
  // }
  const verts = polygon.vertices();
  // if (verts.length < 4) return undefined;
  if (verts.length < 3) return undefined;
  const verts1 = JSON.clone(verts);
  // TODO: consider moving/fixing
  if (offset) {
    Line3D.adjustVertices(verts1[0], verts1[1], offset.x);
    Line3D.adjustVertices(verts1[2], verts1[3], offset.x);
    Line3D.adjustVertices(verts1[1], verts1[2], offset.y);
    Line3D.adjustVertices(verts1[3], verts1[0], offset.y);
  }
  const verts2 = JSON.clone(verts1);
  const poly1 = (new Polygon3D(verts1)).parrelleAt(distance1);
  const poly2 = (new Polygon3D(verts2)).parrelleAt(distance2);
  let poly = new BiPolygon(poly1, poly2);
  return poly;
}

BiPolygon.fromVectorObject =
    (width, height, depth, center, vectorObj, normalVector) => {
      center ||= new Vertex3D(0,0,0);
      vectorObj ||= {x: new Vector3D(1,0,0), y: new Vector3D(0,1,0), z: new Vector3D(0,0,1)};
      const frontCenter = center.translate(vectorObj.z.scale(depth/-2), true);
      const front = Polygon3D.fromVectorObject(width, height, frontCenter, vectorObj);
      const backCenter = center.translate(vectorObj.z.scale(depth/2), true);
      const back = Polygon3D.fromVectorObject(width, height, backCenter, vectorObj);
      let poly;
      if (!normalVector || frontCenter.minus(backCenter).sameDirection(normalVector)) {
        poly = new BiPolygon(front, back);
      } else {
        poly = new BiPolygon(back, front);
      }
      return poly;
}

module.exports = BiPolygon;
