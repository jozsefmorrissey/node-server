
const CSG = require('../../../public/js/3d-modeling/csg.js');
const Line3D = require('line');
const Vector3D = require('vector');
const Vertex3D = require('vertex');
const Polygon3D = require('polygon');
const Plane = require('plane');

class BiPolygon {
  constructor(polygon1, polygon2) {
    const face1 = polygon1.vertices();
    const face2 = polygon2.vertices();
    const instance = this;
    if (face1.length !== face2.length) throw new Error('Polygons need to have an equal number of vertices');

    let normal = {};
    function calcNormal() {
      if (normal === undefined) {
        const pNorm1 = polygon1.normal();
        const pNorm1I = pNorm1.inverse();
        const center1 = polygon1.center();
        const center2 = polygon2.center();
        const cOffsetNorm = center1.translate(pNorm1, true);
        const cOffsetNormI = center1.translate(pNorm1I, true);
        normal.front = cOffsetNorm.distance(center2) > cOffsetNormI.distance(center2) ?
            cOffsetNorm : cOffsetNormI;
        const topApproxVector = face2[3].distanceVector(face2[0]).unit();
        const normVert = new Vertex3D(normal.front);
        normVect.rotate({x:1,y:0,z:0});
      }
      return normal;
    }

    this.copy = () => new BiPolygon(polygon1.copy(), polygon2.copy());

    this.front = () => new Polygon3D(face1);
    this.back = () => new Polygon3D(face2);

    this.faceNormal = (index) => face2[index || 0].distanceVector(face1[index || 0]).unit();

    this.normal = () => this.flippedNormal() ? polygon1.normal() : polygon1.normal().inverse();
    this.normalTop = () => polygon1.lines()[1].vector().unit().inverse();
    this.normalRight = () => this.normalTop().crossProduct(this.normal()).unit().inverse();

    this.normals = () => ({
      top: this.normalTop(),
      front: this.normal(),
      right: this.normalRight()
    });

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

    this.toModel = () => {
      const flippedNormal = this.flippedNormal();
      const front = new CSG.Polygon(normalize(face1, !flippedNormal));
      front.plane.normal = front.vertices[0].normal.clone();//new CSG.Vector([0,1, 0,0]);
      const back = new CSG.Polygon(normalize(face2, flippedNormal));
      back.plane.normal = back.vertices[0].normal.clone();//new CSG.Vector([0,0,1,0,0]);
      const polygonSets = [front, back];

      for (let index = 0; index < face1.length; index++) {
        const index2 = (index + 1) % face1.length;
         const vertices = [face1[index], face1[index2], face2[index2], face2[index]];
         const normalized = normalize(vertices, flippedNormal);
         polygonSets.push(new CSG.Polygon(normalized));
         polygonSets[polygonSets.length - 1].plane.normal = normalized[0].normal.clone();
      }

      const polys = CSG.fromPolygons(polygonSets);
      polys.normals = {
        front: this.normal(),
        right: this.normalRight(),
        top: this.normalTop()
      }
      return polys;
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

BiPolygon.fromPolygon = (polygon, distance1, distance2, offset) => {
  distance2 ||= 0;
  const verts = polygon.vertices();
  // if (verts.length < 4) return undefined;
  if (verts.length < 3) return undefined;
  const verts1 = JSON.clone(verts);
  // TODO: consider moving
  if (offset) {
    Line3D.adjustVertices(verts1[0], verts1[1], offset.x);
    Line3D.adjustVertices(verts1[1], verts1[2], offset.y);
    Line3D.adjustVertices(verts1[2], verts1[3], offset.x);
    Line3D.adjustVertices(verts1[3], verts1[0], offset.y);
  }
  const verts2 = JSON.clone(verts1);
  const poly1 = (new Polygon3D(verts1)).parrelleAt(distance1);
  const poly2 = (new Polygon3D(verts2)).parrelleAt(distance2);
  return new BiPolygon(poly1, poly2);
}

BiPolygon.fromVectorObject =
    (width, height, depth, center, vectorObj) => {
      center ||= new Vertex3D(0,0,0);
      vectorObj ||= {width: new Vector3D(1,0,0), height: new Vector3D(0,1,0), depth: new Vector3D(0,0,1)};
      const frontCenter = center.translate(vectorObj.depth.scale(depth/-2), true);
      const front = Polygon3D.fromVectorObject(width, height, frontCenter, vectorObj);
      const backCenter = center.translate(vectorObj.depth.scale(depth/2), true);
      const back = Polygon3D.fromVectorObject(width, height, backCenter, vectorObj);
      return new BiPolygon(front, back);
}

module.exports = BiPolygon;
