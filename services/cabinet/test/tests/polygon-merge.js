
const Test = require('../../../../public/js/utils/test/test').Test;
const Polygon3D = require('../../app-src/three-d/objects/polygon.js');


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

const polyAB = new Polygon3D([[1,3,0],[0,3,0],[0,1,0],[0,0,0],[4,0,0],[4,1,0],[1,1,0]]);
const polyIF = new Polygon3D([[6,10,0],[6,8,0],[4,8,0],[4,7,0],[6,7,0],[8,7,0],[8,10,0]]);
const polyABCDEGHJ = new Polygon3D([[1,10,0],[3,8,0],[3,7,0],[4,7,0],[4,6,0],[6,6,0],[6,4,0],
                                          [6,0,0],[4,0,0],[0,0,0],[0,1,0],[0,3,0],[1,3,0],[1,1,0],
                                          [4,1,0],[4,4,0],[2,4,0],[0,4,0],[0,6,0],[0,8,0]]);

// const A = new Polygon3D(null, [[,],[,],[,],[,]])
Test.add('Polygon3D merge',(ts) => {
  // const poly = A.merge(B).merge(J);
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
  // This use to be part of the merge/build process until errors were found.
  // TODO: Repair removeLoops... reinstate its use on all polygons.
  ABCDEFGHIJ[0].removeLoops();
  ABCDEFGHIJ[1].removeLoops();
  ts.assertTrue(polyABCDEGHJ.equals(ABCDEFGHIJ[0]) || polyABCDEGHJ.equals(ABCDEFGHIJ[1]));
  ts.assertTrue(polyIF.equals(ABCDEFGHIJ[1]) || polyIF.equals(ABCDEFGHIJ[0]))
  ts.success();
});
