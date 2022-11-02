
const Test = require('../../../../public/js/utils/test/test').Test;
const Plane = require('../../app-src/three-d/objects/plane.js');
const Vertex3D = require('../../app-src/three-d/objects/vertex.js');
const Vector3D = require('../../app-src/three-d/objects/vector.js');
const Line3D = require('../../app-src/three-d/objects/line.js');
const CSG = require('../../public/js/3d-modeling/csg');

const Notification = require('../../../../public/js/utils/collections/notification.js');

const notifyArr = new Notification();
notifyArr.onAfterChange(console.log);
notifyArr.onBeforeChange(console.error);
notifyArr[4] = 'poop';
notifyArr.pickls = 5;
notifyArr[4] = 'y diapers';
notifyArr[0] = [];
notifyArr[0][69] = 'sooo fine'
notifyArr[0][6] = {}
notifyArr[0][6].punk = [1,2,3,4,66]
notifyArr[0][6].punk.skittles = 'taste the rainbow'
notifyArr[0][6].punk.skittles = 'uck!'



Test.add('Plane: makePlane1MeetPlane2',(ts) => {

  let plane1 = [{x: 0, y: 0, z: 0}, {x: 0, y: 3, z: 0}, {x: 2, y: 3, z: 0}, {x: 2, y: 0, z: 0}];
  let plane2 = [{x: 4, y: 3, z: -1}, {x: 4, y: 0, z: -1}, {x: 4, y: 3, z: 1}, {x: 4, y: 0, z: 1}];
  let answer = new Plane({x: 0, y: 0, z: 0}, {x: 0, y: 3, z: 0}, {x: 4, y: 3, z: 0}, {x: 4, y: 0, z: 0});
  let rotation = {x: 0, y: 0, z: 0};
  let result = Plane.makePlane1MeetPlane2(JSON.copy(plane1), plane2, rotation);
  ts.assertTrue(answer.equals(result));

  rotation = {x: 0, y: 90, z: 0};
  let center = Vertex3D.center.apply(null, plane1);
  let plane3 = CSG.rotatePointsAroundCenter(rotation, JSON.copy(plane1), center);
  let plane4 = CSG.rotatePointsAroundCenter(rotation, JSON.copy(plane2), center);
  result = Plane.makePlane1MeetPlane2(JSON.copy(plane3), plane4, rotation);
  let reverted = CSG.rotatePointsAroundCenter(rotation, JSON.copy(result), center, true);
  ts.assertTrue(answer.equals(reverted));

  rotation = {x: 111, y: 62, z: 212};
  center = Vertex3D.center.apply(null, plane1);
  plane3 = CSG.rotatePointsAroundCenter(rotation, JSON.copy(plane1), center);
  plane4 = CSG.rotatePointsAroundCenter(rotation, JSON.copy(plane2), center);
  result = Plane.makePlane1MeetPlane2(JSON.copy(plane3), plane4, rotation);
  reverted = CSG.rotatePointsAroundCenter(rotation, JSON.copy(result), center, true);
  ts.assertTrue(answer.equals(reverted));

  ts.success();
});


Test.add('Plane: equation',(ts) => {
  const p1 = {x: 1, y: -2, z: 1};
  const p2 = {x: 4, y: -2, z: -2};
  const p3 = {x: 4, y: 1, z: 4};

  const equation = new Plane(p1, p2, p3).equation();
  ts.assertEquals(equation.a * 54, 9);
  ts.assertEquals(equation.b * 54, -18);
  ts.assertEquals(equation.c * 54, 9);
  ts.assertEquals(equation.d * 54, 54);
  ts.success();
});

Test.add('Plane: XYrotation',(ts) => {
  const p1 = {x: 1, y: -2, z: 1};
  const p2 = {x: 4, y: -2, z: -2};
  const p3 = {x: 4, y: 1, z: 4};

  const equation = new Plane(p1, p2, p3).equation();
  const plane = new Plane(equation);
  const rotation = plane.XYrotation();
  const result = plane.matrixRotation(rotation);
  ts.success();
});

Test.add('Plane: findPoints',(ts) => {
  const p1 = {x: 1, y: -2, z: 4};
  const p2 = {x: 4, y: -2, z: 4};
  const p3 = {x: 4, y: 1, z: 4};

  const equation = new Plane(p1, p2, p3).equation();
  const plane = new Plane(equation);

  const result = plane.findPoints(13);
  ts.assertEquals(result.length, 13);
  ts.success();
});

Test.add('Vector: crossProduct',(ts) => {
  const vect1 = new Vector3D(3,1,4);
  const vect2 = new Vector3D(3,2,6);
  const crossP = vect1.crossProduct(vect2);
  ts.assertEquals(crossP.i(), -2/7);
  ts.assertEquals(crossP.j(), -6/7);
  ts.assertEquals(crossP.k(), 3/7);
  ts.success();
});

Test.add('Plane: normal',(ts) => {
  const p1 = {x: 1, y: 2, z: 4};
  const p2 = {x: 4, y: 2, z: 4};
  const p3 = {x: 4, y: 1, z: 4};

  const equation = new Plane(p1, p2, p3).equation();
  let plane = new Plane(equation);

  let normal = plane.normal();

  plane = new Plane(p1,p2,p3);
  plane.rotate({x: 90, y:0, z:0});
  normal = plane.normal();

  plane = new Plane(p1,p2,p3);
  plane.rotate({x: 0, y:90, z:0});
  normal = plane.normal();

  ts.success();
});

Test.add('Plane: lineIntersection',(ts) => {
  const p1 = {x: 1, y: 2, z: 4};
  const p2 = {x: 4, y: 2, z: 4};
  const p3 = {x: 4, y: 1, z: 4};

  let plane = new Plane(p1,p2,p3);
  let line = new Line3D({x:0,y:0,z:0}, {x:0,y:0,z:2});
  let intersection = plane.lineIntersection(line);
  ts.assertTrue(intersection.equals({x: 0, y: 0, z: 4}));

  line = new Line3D({x:0,y:0,z:0}, {x:0,y:1,z:1});
  intersection = plane.lineIntersection(line);
  ts.assertTrue(intersection.equals({x: 0, y: 4, z: 4}));

  line = new Line3D({x:-1,y:-1,z:-1}, {x:6,y:-1,z:6});
  intersection = plane.lineIntersection(line);
  ts.assertTrue(intersection.equals({x: 4, y: -1, z: 4}));

  line = new Line3D({x:-1,y:-1,z:-1}, {x:1,y:1,z:1});
  intersection = plane.lineIntersection(line);
  ts.assertTrue(intersection.equals({x: 4, y: 4, z: 4}));

  ts.success();
});

Test.add('Plane: bisector',(ts) => {
  let eqn1 = {a: 2, b: -1, c: 2, d: 3};
  let eqn2 = {a: 3, b: -2, c: 6, d: 8};

  let plane1 = new Plane(eqn1);
  let plane2 = new Plane(eqn2);
  let bisector = Plane.bisector(plane1, plane2);
  let eqn = bisector.accute.equation();
  ts.assertEquals(eqn.a, 23);
  ts.assertEquals(eqn.b, -13);
  ts.assertEquals(eqn.c, 32);
  ts.assertEquals(eqn.d, 45);

  eqn = bisector.obtuse.equation();
  ts.assertEquals(eqn.a, 5);
  ts.assertEquals(eqn.b, -1);
  ts.assertEquals(eqn.c, -4);
  ts.assertEquals(eqn.d, -3);

  plane1 = new Plane({x:3, y: 8, z: 88}, {x:1, y: 12, z: 6}, {x:30, y: -2, z: 4});
  plane2 = new Plane({x:5, y: 44, z: -16}, {x:-13, y: -20, z: 48}, {x:30, y: -2, z: 3});
  bisector = Plane.bisector(plane1, plane2);

  ts.assertEquals(plane1.equationEqualToZ(), '(0.038192x + 0.078697y + 1) / 0.002907');
  ts.assertEquals(plane2.equationEqualToZ(), '(0.031282x + 0.035156y + 1) / 0.043954');
  ts.assertEquals(bisector.obtuse.equationEqualToZ(), '(-0.000279x + 0.001991y + -0.023131) / -0.00366');
  ts.assertEquals(bisector.accute.equationEqualToZ(), '(0.005197x + 0.008144y + 0.151916) / 0.004034');

  ts.success();
});
