
const Test = require('../../../../public/js/utils/test/test').Test;
const Polygon3D = require('../../app-src/three-d/objects/polygon.js');
const Line3D = require('../../app-src/three-d/objects/line.js');

const B = new Polygon3D([[0,1,0],[1,1,0],[1,3,0],[0,3,0]].reverse())
const C = new Polygon3D([[0,4,0],[2,4,0],[2,6,0],[0,6,0]]);
const A = new Polygon3D([[0,0,0],[0,1,0],[1,1,0],[4,1,0],[4,0,0]]);
const D = new Polygon3D([[0,6,0],[0,8,0],[3,8,0],[3,7,0],[3,6,0],[2,6,0]]);
const E = new Polygon3D([[3,8,0],[1,10,0],[0,8,0]]);
const F = new Polygon3D([[6,7,0],[6,8,0],[6,10,0],[8,10,0],[8,7,0]]);
const G = new Polygon3D([[4,7,0],[4,6,0],[3,6,0],[3,7,0]]);
const H = new Polygon3D([[6,4,0],[4,4,0],[2,4,0],[2,6,0],[3,6,0],[4,6,0],[6,6,0]]);
const I = new Polygon3D([[4,7,0],[4,8,0],[6,8,0],[6,7,0]].reverse());
const J = new Polygon3D([[4,0,0],[4,1,0],[4,4,0],[6,4,0],[6,0,0]])

const polyAB = new Polygon3D([[1,3,0],[0,3,0],[0,0,0],[4,0,0],[4,1,0],[1,1,0]]);
const polyIF = new Polygon3D([[6,10,0],[6,8,0],[4,8,0],[4,7,0],[8,7,0],[8,10,0]]);
const polyABCDEGHJ = new Polygon3D([[1,10,0],[3,8,0],[3,7,0],[4,7,0],[4,6,0],[6,6,0],
                                          [6,0,0],[0,0,0],[0,3,0],[1,3,0],[1,1,0],
                                          [4,1,0],[4,4,0],[0,4,0],[0,8,0]]);


// const A = new Polygon3D(null, [[,],[,],[,],[,]])
Test.add('Polygon3D merge',(ts) => {
  const AB = A.merge(B);
  const IF = [F,I];
  Polygon3D.merge(IF);
  const ABCDEFGHIJ = [A,B,C,D,E,F,G,H,I,J];
  ABCDEFGHIJ.shuffle();
  Polygon3D.merge(ABCDEFGHIJ);

  ts.assertTrue(polyAB.equals(AB), 'merge or equals is malfunctioning');
  ts.assertTrue(AB.equals(polyAB), 'merge or equals is malfunctioning');
  ts.assertFalse(polyAB.equals(undefined));
  ts.assertFalse(polyAB.equals(A));
  ts.assertTrue(IF[0].equals(polyIF));
  ts.assertTrue(polyIF.equals(IF[0]));
  ts.assertTrue(ABCDEFGHIJ.length === 2);

  let merged = AB.merge(J);
  merged = merged.merge(H);
  merged = merged.merge(C);
  merged = merged.merge(D);
  merged = merged.merge(E);
  merged = merged.merge(G);
  ts.assertTrue(polyABCDEGHJ.equals(merged));

  ts.assertTrue(polyABCDEGHJ.equals(ABCDEFGHIJ[0]) || polyABCDEGHJ.equals(ABCDEFGHIJ[1]));
  ts.assertTrue(polyIF.equals(ABCDEFGHIJ[1]) || polyIF.equals(ABCDEFGHIJ[0]))
  ts.success();
});

const leftH = new Polygon3D([[0,0,0],[1,0,0],[1,3,0],[0,3,0]]);;
const centerH = new Polygon3D([[1,2,0],[2,2,0],[2,1,0],[1,1,0]]);;
const rightH = new Polygon3D([[2,3,0],[3,3,0],[3,0,0],[2,0,0]]);
const H_POLY = new Polygon3D([[0,0,0],[0,3,0],[1,3,0],[1,2,0],[2,2,0],[2,3,0],[3,3,0],[3,0,0],[2,0,0],[2,1,0],[1,1,0],[1,0,0]]);
const fillU = new Polygon3D([[1,0,0],[1,1,0],[2,1,0],[2,0,0]]);
const U_POLY = new Polygon3D([[0,0,0],[0,3,0],[1,3,0],[1,2,0],[2,2,0],[2,3,0],[3,3,0],[3,0,0]]);
Test.add('Polygon3D merge:H',(ts) => {
  let polys = [leftH, centerH, rightH];
  Polygon3D.merge(polys);
  ts.assertTrue(polys[0].equals(H_POLY));
  polys = [fillU, rightH, leftH, centerH];
  Polygon3D.merge(polys);
  ts.assertTrue(polys[0].equals(U_POLY));
  ts.success();
});



Test.add('Line3D combineOrder',(ts) => {
    let line1 = new Line3D([1,3,0],[1,0,0]);
    let line2 = new Line3D([1,1,0],[1,2,0]);
    let ans = [[1,3,0],[1,2,0],[1,1,0],[1,0,0]];
    let order = Line3D.combineOrder(line1, line2).map(v => [v.x, v.y,v.z]);
    ts.assertTrue(ans.equals(order));

    line1 = new Line3D([1,3,0],[1,2,0]);
    line2 = new Line3D([1,0,0],[1,1,0]);
    order = Line3D.combineOrder(line1, line2);
    ts.assertEquals(null, order);

    line1 = new Line3D([1,3,3],[1,2,3]);
    line2 = new Line3D([1,0,0],[1,1,0]);
    order = Line3D.combineOrder(line1, line2);
    ts.assertEquals(null, order);

    line1 = new Line3D([2,3,0],[1,2,0]);
    line2 = new Line3D([1,0,0],[1,1,0]);
    order = Line3D.combineOrder(line1, line2);
    ts.assertEquals(null, order);

    line1 = new Line3D([1,3,0],[1,1,0]);
    line2 = new Line3D([1,2,0],[1,0,0]);
    ans = [[1,3,0],[1,2,0],[1,1,0],[1,0,0]];
    order = Line3D.combineOrder(line1, line2).map(v => [v.x, v.y,v.z]);
    ts.assertTrue(ans.equals(order));

    line1 = new Line3D([1,0,0],[1,3,0]);
    line2 = new Line3D([1,3,0],[1,2,0]);
    ans = [[1,0,0],[1,2,0],[1,3,0],[1,3,0]];
    order = Line3D.combineOrder(line1, line2).map(v => [v.x, v.y,v.z]);
    ts.assertTrue(ans.equals(order));

    line1 = new Line3D([1,1,0],[1,2,0]);
    line2 = new Line3D([1,0,0],[1,1,0]);
    ans = [[1,0,0],[1,1,0],[1,1,0],[1,2,0]];
    order = Line3D.combineOrder(line1, line2).map(v => [v.x, v.y,v.z]);
    ts.assertTrue(ans.equals(order));

    line1 = new Line3D([1,0,0],[1,4,0]);
    line2 = new Line3D([1,1,3],[1,2,3]);
    order = Line3D.combineOrder(line1, line2);
    ts.assertEquals(null, order);

    ts.success();
});
