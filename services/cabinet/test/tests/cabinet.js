
const Test = require('../../../../public/js/utils/test/test').Test;
const Cabinet = require('../../app-src/objects/assembly/assemblies/cabinet.js')
const CabinetLayouts = require('../../app-src/config/cabinet-layouts.js');
const Layer = require('../../app-src/three-d/objects/layer.js');
const Polygon3D = require('../../app-src/three-d/objects/polygon.js');
const approximate = require('../../../../public/js/utils/approximate.js').new(100);


Test.add('Cabinet: doorIntersect',(ts) => {
  ts.assertEquals(6, 6);
  let dx;

  //Parrelle up with no right point
  let llp = {x:0,y:0};
  let lcp = {x:0,y:10};
  let rcp = {x:0,y:20};
  let rrp = undefined;
  dx = Cabinet.doorIntersect(llp, lcp, rcp, rrp, 1, 1, 1, 1/8);
  ts.assertEquals(dx.center.length, 9.8125);
  ts.assertEquals(dx.center.center.x(), .5, null, 1000);
  ts.assertEquals(dx.center.center.y(), 15 - 1/32, null, 1000);
  ts.assertEquals(dx.left.theta, undefined);
  ts.assertEquals(dx.right.theta, undefined);
  ts.assertEquals(dx.center.left.reveal, 1/16);
  ts.assertEquals(dx.center.right.reveal, 1/8);
  ts.assertEquals(dx.left.reveal, 1/16);

  //Parrelle down with no leftPoint.
  llp = undefined;
  lcp = {x:0,y:20};
  rcp = {x:0,y:10};
  rrp = {x:0,y:0};
  dx = Cabinet.doorIntersect(llp, lcp, rcp, rrp, 1, 1, 1, 1/8);
  ts.assertEquals(dx.center.length, 9.8125);
  ts.assertEquals(dx.center.center.x(), -.5, null, 1000);
  ts.assertEquals(dx.center.center.y(), 15 - 1/32, null, 1000);
  ts.assertEquals(dx.left.theta, undefined);
  ts.assertEquals(dx.right.theta, undefined);
  ts.assertEquals(dx.center.left.reveal, 1/8);
  ts.assertEquals(dx.center.right.reveal, 1/16);
  ts.assertEquals(dx.right.reveal, 1/16);

  //Parrelle right
  llp = {x:0,y:0};
  lcp = {x:10,y:0};
  rcp = {x:20,y:0};
  rrp = {x:30,y:0};
  dx = Cabinet.doorIntersect(llp, lcp, rcp, rrp, 1, 1, 1, 1/8);
  ts.assertEquals(dx.center.length, 9.875);
  ts.assertEquals(dx.center.center.x(), 15, null, 1000);
  ts.assertEquals(dx.center.center.y(), -.5, null, 1000);
  ts.assertEquals(dx.center.left.reveal, 1/16);
  ts.assertEquals(dx.center.right.reveal, 1/16);
  ts.assertEquals(dx.left.theta, undefined);
  ts.assertEquals(dx.right.theta, undefined);
  ts.assertEquals(dx.left.reveal, 1/16);
  ts.assertEquals(dx.right.reveal, 1/16);

  //Parrelle left
  llp = {x:30,y:0};
  lcp = {x:20,y:0};
  rcp = {x:10,y:0};
  rrp = {x:0,y:0};
  dx = Cabinet.doorIntersect(llp, lcp, rcp, rrp, 1, 1, 1, 1/8);
  ts.assertEquals(dx.center.length, 9.875);
  ts.assertEquals(dx.center.center.x(), 15, null, 1000);
  ts.assertEquals(dx.center.center.y(), .5, null, 1000);
  ts.assertEquals(dx.center.left.reveal, 1/16);
  ts.assertEquals(dx.center.right.reveal, 1/16);
  ts.assertEquals(dx.left.theta, undefined);
  ts.assertEquals(dx.right.theta, undefined);
  ts.assertEquals(dx.left.reveal, 1/16);
  ts.assertEquals(dx.right.reveal, 1/16);

  // Inner Horse Shoe
  llp = {x:0,y:0};
  lcp = {x:0,y:10};
  rcp = {x:10,y:10};
  rrp = {x:10,y:0};
  dx = Cabinet.doorIntersect(llp, lcp, rcp, rrp, 1, 1, 1, .125);
  ts.assertEquals(dx.center.length, 7.75);
  ts.assertEquals(dx.center.left.reveal, 1.125);
  ts.assertEquals(dx.center.right.reveal, 1.125);
  ts.assertEquals(dx.left.theta, undefined);
  ts.assertEquals(dx.right.theta, undefined);
  ts.assertEquals(dx.left.reveal, 1);
  ts.assertEquals(dx.right.reveal, 1);

  // Inner Horse Shoe 3/4
  llp = {x:0,y:0};
  lcp = {x:0,y:10};
  rcp = {x:10,y:10};
  rrp = {x:10,y:0};
  dx = Cabinet.doorIntersect(llp, lcp, rcp, rrp, 3/4, 3/4, 3/4, .125, 1/4);
  ts.assertEquals(dx.center.length, 7.75);
  ts.assertEquals(dx.center.center.x(), 5, null, 1000);
  ts.assertEquals(dx.center.center.y(), 9.375, null, 1000);
  ts.assertEquals(dx.center.left.reveal, 1.125);
  ts.assertEquals(dx.center.right.reveal, 1.125);
  ts.assertEquals(dx.left.theta, undefined);
  ts.assertEquals(dx.right.theta, undefined);
  ts.assertEquals(dx.left.reveal, 1);
  ts.assertEquals(dx.right.reveal, 1);

  // Outer Horse Shoo
  rrp = {x:0,y:0};
  rcp = {x:0,y:10};
  lcp = {x:10,y:10};
  llp = {x:10,y:0};
  dx = Cabinet.doorIntersect(llp, lcp, rcp, rrp, 1, 1, 1, .125);
  ts.assertEquals(dx.center.length, 11.75);
  ts.assertEquals(dx.center.left.reveal, -.875);
  ts.assertEquals(dx.center.right.reveal, -.875);
  ts.assertEquals(approximate(Math.toDegrees(dx.left.theta)), 45);
  ts.assertEquals(approximate(Math.toDegrees(dx.right.theta)), 45);
  ts.assertEquals(dx.left.reveal, -1);
  ts.assertEquals(dx.right.reveal, -1);

  // Zig
  llp = {x:0,y:0};
  lcp = {x:0,y:10};
  rcp = {x:10,y:20};
  rrp = {x:10,y:30};

  dx = Cabinet.doorIntersect(llp, lcp, rcp, rrp, 1, 1, 1, .125);
  ts.assertEquals(dx.left.theta, undefined);
  ts.assertEquals(approximate(Math.toDegrees(dx.right.theta)), 22.5);

  // Wall right
  llp = {x:0,y:0};
  lcp = {x:0,y:10};
  rcp = {x:10,y:20};
  rrp = {x:30,y:20};

  dx = Cabinet.doorIntersect(llp, lcp, rcp, rrp, 1, 1, 0, .125);
  ts.assertEquals(dx.center.left.theta, undefined);
  ts.assertEquals(approximate(Math.toDegrees(dx.center.right.theta)), 45);

  // Wall left
  llp = {x:0,y:0};
  lcp = {x:0,y:10};
  rcp = {x:9,y:25};
  rrp = {x:30,y:20};

  // dx = Cabinet.doorIntersect(llp, lcp, rcp, rrp, 0, 1, 1, .125);
  // ts.assertEquals(approximate(Math.toDegrees(dx.center.right.theta)), 17.57);
  // ts.assertEquals(approximate(Math.toDegrees(dx.center.left.theta)), 59.04);

  ts.success();
});

const cleanJson = (json) => Object.filter(json, (c, key) =>
  key && key.match(/(id|parentAssemblyId)/), false).complement;
Test.add('Cabinet: to/from Json',(ts) => {
  const cabinet = Cabinet.build('base');

  CabinetLayouts.map['test'].build(cabinet);
  const json = cleanJson(cabinet.toJson());
  const copy = Cabinet.fromJson(cabinet.toJson());
  const copyJson = cleanJson(copy.toJson());
  Lookup.release(cabinet.allAssemblies());
  Lookup.release(copy.allAssemblies());
  try {
    ts.assertTrue(Object.equals(json, copyJson));
    ts.success();
  } catch (e) {
    console.warn(e.message);
  }
});
