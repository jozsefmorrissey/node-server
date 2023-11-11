

const CSG = require('../../../../../public/js/utils/3d-modeling/csg.js');
const Polygon3D = require('../objects/polygon.js');
const BiPolygon = require('../objects/bi-polygon.js');

function drawerBox(length, width, depth) {
  const bottomHeight = 7/8;
  const box = CSG.cube({demensions: [width, length, depth], center: [0,0,0]});
  box.setColor(1, 0, 0);
  const inside = CSG.cube({demensions: [width-1.5, length, depth - 1.5], center: [0, bottomHeight, 0]});
  inside.setColor(0, 0, 1);
  const bInside = CSG.cube({demensions: [width-1.5, length, depth - 1.5], center: [0, (-length) + (bottomHeight) - 1/4, 0]});
  bInside.setColor(0, 0, 1);

  return box.subtract(bInside).subtract(inside);
}

function unionAll(...polygons) {
  let model = polygons[0].toModel();
  for (let index = 1; index < polygons.length; index++) {
    model = model.union(polygons[index].toModel());
  }
  return model;
}

function drawerBox(frontPoly, normal, length, props) {
  const sideThickness = props.dbst.value();
  const bottomThickness = props.dbbt.value();
  const bottomHeight = props.dbid.value();
  const norm = normal;

  // In order (front, (frontMoved), back, left, right, top, bottom) Polygon: vertices are if facing polygon topLeft, topRight, bottomRight, bottomLeft
  const fP = frontPoly;
  const fPm = fP.translate(norm.scale(-length));
  const bP = new Polygon3D([fPm.vertex(1), fPm.vertex(0), fPm.vertex(3), fPm.vertex(2)]);
  const lP = new Polygon3D([bP.vertex(1), fP.vertex(0), fP.vertex(3), bP.vertex(2)]);
  const rP = new Polygon3D([fP.vertex(1), bP.vertex(0), bP.vertex(3), fP.vertex(2)]);
  const tP = new Polygon3D([bP.vertex(1), bP.vertex(0), fP.vertex(1), bP.vertex(0)]);
  const btmP = new Polygon3D([bP.vertex(2), bP.vertex(3), fP.vertex(2), fP.vertex(3)]);

  const front = BiPolygon.fromPolygon(fP, 0, sideThickness);
  const back = BiPolygon.fromPolygon(bP, 0, sideThickness);
  const left = BiPolygon.fromPolygon(lP, 0, sideThickness);
  const right = BiPolygon.fromPolygon(rP, 0, sideThickness);
  const bottom = BiPolygon.fromPolygon(btmP, -bottomHeight, -bottomHeight-bottomThickness);
  return unionAll(front, back, left, right, bottom);
}
module.exports = drawerBox
