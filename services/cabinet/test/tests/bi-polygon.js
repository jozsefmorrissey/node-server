
const Test = require('../../../../public/js/utils/test/test').Test;
const BiPolygon = require('../../app-src/three-d/objects/bi-polygon.js');
const Polygon3D = require('../../app-src/three-d/objects/polygon.js');
const Vector3D = require('../../app-src/three-d/objects/vector.js');

function biPolys() {
  const poly = new Polygon3D([[0,0,0],[10,0,0],[10,10,0],[0,10,0]]);
  const posNormal = new Vector3D(0,0,1);
  const negNormal = new Vector3D(0,0,-1);

  const sameDirBiPoly = BiPolygon.fromPolygon(poly, 0, -10);
  const sameDirBiPolyNeg = BiPolygon.fromPolygon(poly, 0, 10);
  const sameDirBiPolyRev = BiPolygon.fromPolygon(poly, 10, 0);
  const sameDirBiPolyRevNeg = BiPolygon.fromPolygon(poly, -10, 0);
  return {sameDirBiPoly, sameDirBiPolyNeg, sameDirBiPolyRev, sameDirBiPolyRevNeg};
}

Test.add('BiPolygon: constructor',(ts) => {
  const poly = new Polygon3D([[0,0,0],[10,0,0],[10,10,0],[0,10,0]]);
  const posNormal = new Vector3D(0,0,1);
  const negNormal = new Vector3D(0,0,-1);

  const {sameDirBiPoly, sameDirBiPolyNeg, sameDirBiPolyRev, sameDirBiPolyRevNeg} =
    biPolys();

  ts.assertTrue(sameDirBiPoly.front().normal().equals(posNormal));
  ts.assertTrue(sameDirBiPoly.back().normal().equals(negNormal));

  ts.assertTrue(sameDirBiPolyNeg.front().normal().equals(negNormal));
  ts.assertTrue(sameDirBiPolyNeg.back().normal().equals(posNormal));

  ts.assertTrue(sameDirBiPolyRev.front().normal().equals(posNormal));
  ts.assertTrue(sameDirBiPolyRev.back().normal().equals(negNormal));

  ts.assertTrue(sameDirBiPolyRevNeg.front().normal().equals(negNormal));
  ts.assertTrue(sameDirBiPolyRevNeg.back().normal().equals(posNormal));

  ts.success();
});

const xNorm = new Vector3D(1,0,0);
const yNorm = new Vector3D(0,1,0);
const sideNormalFilter = (side) => side.normal().equals(xNorm) ? 'x' :
    (side.normal().equals(yNorm) ? 'y' : (side.normal().parrelle(xNorm) ? '-x' :
    side.normal().parrelle(yNorm) ? '-y' : 'ALL_WRONG'));
function sideNormalCheck(poly, ts) {
  const sides = poly.sides();
  const filterObj = sides.filterSplit(sideNormalFilter);
  ts.assertTrue(filterObj.ALL_WRONG === undefined);
  ts.assertTrue(filterObj.defined('x', 'y', '-x', '-y'));
}

function sideDefinitionCheck(poly, negitive, ts) {
  const offset = negitive ? -10 : 10;
  let left = new Polygon3D([[0,10,0],[0,0,0],[0,0,offset],[0,10,offset]]);
  let right = new Polygon3D([[10,0,0],[10,10,0],[10,10,offset],[10,0,offset]]);
  let up = new Polygon3D([[10,10,0],[0,10,0],[0,10,offset],[10,10,offset]]);
  let down = new Polygon3D([[0,0,0],[10,0,0],[10,0,offset],[0,0,offset]]);
  const sides = [left, right, up, down];
  if (!negitive) sides.forEach((s, i) => sides[i] = s.reverse());
  sides.forEach(s => ts.assertTrue(!!poly.sides().find(s.equals)));
}

Test.add('BiPolygon: sides',(ts) => {
  const {sameDirBiPoly, sameDirBiPolyNeg, sameDirBiPolyRev, sameDirBiPolyRevNeg} =
    biPolys();

  sideDefinitionCheck(sameDirBiPoly, true, ts);
  sideDefinitionCheck(sameDirBiPolyNeg, false, ts);
  sideDefinitionCheck(sameDirBiPolyRev, false, ts);
  sideDefinitionCheck(sameDirBiPolyRevNeg, true, ts);

  sideNormalCheck(sameDirBiPoly, ts);
  sideNormalCheck(sameDirBiPolyNeg, ts);
  sideNormalCheck(sameDirBiPolyRev, ts);
  sideNormalCheck(sameDirBiPolyRevNeg, ts);

  ts.success();
});


function testToFromCsg(biPoly, ts) {
  const origPolys = biPoly.toPolygons();
  const csg = biPoly.model();
  const csgPolys = Polygon3D.fromCSG(csg);
  ts.assertFalse(Array.diff(origPolys, csgPolys));
}

Test.add('BiPolygon: model(csg)',(ts) => {
  const {sameDirBiPoly, sameDirBiPolyNeg, sameDirBiPolyRev, sameDirBiPolyRevNeg} =
    biPolys();

  testToFromCsg(sameDirBiPoly, ts);
  testToFromCsg(sameDirBiPolyNeg, ts);
  testToFromCsg(sameDirBiPolyRev, ts);
  testToFromCsg(sameDirBiPolyRevNeg, ts);

  ts.success();
});

const assertVerts = (poly, z, ts, values) => {
  const verts = poly.vertices();
  values.forEach((v, i) => {
    if (v !== undefined) {
      ts.assertEquals(verts[i].x, v[0]);
      ts.assertEquals(verts[i].y, v[1]);
      ts.assertEquals(verts[i].z, z);
    }
  })
}

Test.add('BiPolygon extend',(ts) => {
  const rightSide = [[5,0,0],[5,2,0],[4,3,0],[1,5,0]];
  const leftSide = rightSide.map(a => a.copy()).reverse().map(a => a.map((v,i) => i === 0 ? -v : v));
  const octagon = new Polygon3D(leftSide.concat(rightSide));
  const biPoly = BiPolygon.fromPolygon(octagon, 5, -5);
  biPoly.extend(Vector3D.k.scale(5));
  ts.assertEquals(biPoly.front().center().z, 10);
  biPoly.extend(Vector3D.k.scale(-5));
  ts.assertEquals(biPoly.back().center().z, -10);

  biPoly.extend(Vector3D.i.scale(10));
  let values = [,,,,[15,0],[15,2],[14,3],[11,5]];
  assertVerts(biPoly.front(), 10, ts, values);
  assertVerts(biPoly.back(), -10, ts, values.reverse());

  biPoly.extend(Vector3D.i.scale(-10));
  values = [,,,,[-15,0],[-15,2],[-14,3],[-11,5]];
  assertVerts(biPoly.front(), 10, ts, values.reverse());
  assertVerts(biPoly.back(), -10, ts, values.reverse());

  biPoly.extend(Vector3D.j.scale(10));
  values = [[-11,15],[-14,13],,,,,[14,13],[11,15]];
  assertVerts(biPoly.front(), 10, ts, values);
  assertVerts(biPoly.back(), -10, ts, values.reverse());

  biPoly.extend(Vector3D.j.scale(-10));
  values = [,,[-15,-8],[-15,-10],[15,-10],[15,-8],,,];
  assertVerts(biPoly.front(), 10, ts, values);
  assertVerts(biPoly.back(), -10, ts, values.reverse());

  ts.success();
});

Test.add('BiPolygon: connections', ts => {
  const str1 = 'red[(0,71.279,-66.04),(53.34,71.279,0),(53.34,10.16,0),(0,10.16,-66.04)]';
  const str2 = 'red[(0,86.36,-66.04),(53.34,86.36,0),(53.34,71.279,0),(0,71.279,-66.04)]';
  const str3 = 'blue[(51.801,56.36,-0.953),(60.96,56.36,-0.953),(60.96,46,-0.953),(51.801,46,-0.953)]';

  const biPoly1 = BiPolygon.fromPolygon(Polygon3D.fromCSG(CSG.fromString(str1))[0], 0, 50);
  const biPoly2 = BiPolygon.fromPolygon(Polygon3D.fromCSG(CSG.fromString(str2))[0], 0, 50);
  const biPoly3 = BiPolygon.fromPolygon(Polygon3D.fromCSG(CSG.fromString(str3))[0], 12, 16);

  const red = [biPoly1,biPoly2];
  const blue = [biPoly3];

  console.log(red.map(p => p.toDrawString('red')).concat(blue.map(p=>p.toDrawString('blue'))).join('\n'));

  const conn = biPoly1.connect(biPoly3);
  console.log(conn.toDrawString());

  ts.success();
});


// Hinge 25 * 73B3580
// Plate 25 * 175H6000
