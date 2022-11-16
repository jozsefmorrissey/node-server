
const CSG = require('../../../public/js/3d-modeling/csg.js');
const Line3D = require('line');
const Polygon3D = require('polygon');

class BiPolygon {
  constructor(polygon1, polygon2, flipNormal) {
    const face1 = polygon1.verticies();
    const face2 = polygon2.verticies();
    if (face1.length !== face2.length) throw new Error('Polygons need to have an equal number of verticies');
    if (face1.length !== 4) throw new Error('BiPolygon implementation is limited to 4 point polygons. Plans to expand must not have been exicuted yet');



    this.front = () => new Polygon3D(face1);
    this.back = () => new Polygon3D(face2);

    function normalize (verts, reverse) {
      const normal =  new Polygon3D(verts).normal().toArray();
      const returnValue = [];
      for (let index = 0; index < verts.length; index++)
        returnValue[index] = new CSG.Vertex(verts[index], normal);
      if (flipNormal) return !reverse ? returnValue.reverse() : returnValue;
      else return reverse ? returnValue.reverse() : returnValue;
    }

    this.toModel = () => {
      const front = new CSG.Polygon(normalize(face1));
      front.plane.normal = new CSG.Vector([0,1, 0,0]);
      const back = new CSG.Polygon(normalize(face2, true));
      back.plane.normal = new CSG.Vector([0,0,1,0,0]);
      const top = new CSG.Polygon(normalize([face1[0], face1[1], face2[1], face2[0]], true));
      top.plane.normal = new CSG.Vector([0, 1, 0]);
      const left = new CSG.Polygon(normalize([face2[3], face2[0], face1[0], face1[3]]));
      left.plane.normal = new CSG.Vector([-1, 0, 0]);
      const right = new CSG.Polygon(normalize([face1[1], face1[2], face2[2], face2[1]], true));
      right.plane.normal = new CSG.Vector([1, 0, 0]);
      const bottom = new CSG.Polygon(normalize([face1[3], face1[2], face2[2], face2[3]]));
      bottom.plane.normal = new CSG.Vector([0, -1, 0]);

      const poly = CSG.fromPolygons([front, back, top, left, right, bottom]);
      return poly;
    }

    this.toString = () =>
    `(${face1[0].toString()}), (${face1[1].toString()}), (${face1[2].toString()}), (${face1[3].toString()})\n` +
    `(${face2[0].toString()}), (${face2[1].toString()},${face2[2].toString()}), (${face2[3].toString()})`;
  }
}

BiPolygon.fromPolygon = (polygon, distance1, distance2, offset, flipNormal) => {
  offset ||= {};
  const verts = polygon.verticies();
  if (verts.length < 4) return undefined;
  const verts1 = JSON.clone(verts);
  Line3D.adjustVerticies(verts1[0], verts1[1], offset.x);
  Line3D.adjustVerticies(verts1[1], verts1[2], offset.y);
  Line3D.adjustVerticies(verts1[2], verts1[3], offset.x);
  Line3D.adjustVerticies(verts1[3], verts1[0], offset.y);
  const verts2 = JSON.clone(verts1);
  const poly1 = (new Polygon3D(verts1)).parrelleAt(distance1);
  const poly2 = (new Polygon3D(verts2)).parrelleAt(distance2);
  return new BiPolygon(poly1, poly2, flipNormal);
}

module.exports = BiPolygon;
