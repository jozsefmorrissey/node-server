
const Test = require('../../../../public/js/utils/test/test').Test;
const Plane = require('../../app-src/three-d/objects/plane.js');
const Vertex3D = require('../../app-src/three-d/objects/vertex.js');
const Vector3D = require('../../app-src/three-d/objects/vector.js');
const Line3D = require('../../app-src/three-d/objects/line.js');
const CSG = require('../../../../public/js/utils/3d-modeling/csg.js');

const Notification = require('../../../../public/js/utils/collections/notification.js');




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
  ts.assertEquals(Math.round(equation.a * 54), 9);
  ts.assertEquals(Math.round(equation.b * 54), -18);
  ts.assertEquals(Math.round(equation.c * 54), 9);
  ts.assertEquals(Math.round(equation.d * 54), 54);
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

Test.add('Plane: intersection.line',(ts) => {
  let p1 = {x: 1, y: 0, z: 4};
  let p3 = {x: 0, y: 0, z: 4};
  let p2 = {x: 0, y: 1, z: 4};

  let plane = new Plane(p1,p2,p3);
  let line = new Line3D({x:0,y:0,z:0}, {x:0,y:0,z:2});
  let intersection = plane.intersection.line(line);
  // intersection = lpint(line, plane);
  ts.assertTrue(intersection.equals({x: 0, y: 0, z: 4}));

  plane = new Plane(p2,p3,p1);
  line = new Line3D({x:0,y:0,z:0}, {x:0,y:0,z:2});
  intersection = plane.intersection.line(line);
  ts.assertTrue(intersection.equals({x: 0, y: 0, z: 4}));

  plane = new Plane(p3,p1,p2);
  line = new Line3D({x:0,y:0,z:0}, {x:0,y:0,z:2});
  intersection = plane.intersection.line(line);
  ts.assertTrue(intersection.equals({x: 0, y: 0, z: 4}));

  line = new Line3D({x:0,y:0,z:0}, {x:0,y:1,z:1});
  intersection = plane.intersection.line(line);
  ts.assertTrue(intersection.equals({x: 0, y: 4, z: 4}));

  line = new Line3D({x:-1,y:-1,z:-1}, {x:6,y:-1,z:6});
  intersection = plane.intersection.line(line);
  ts.assertTrue(intersection.equals({x: 4, y: -1, z: 4}));

  line = new Line3D({x:-1,y:-1,z:-1}, {x:1,y:1,z:1});
  intersection = plane.intersection.line(line);
  ts.assertTrue(intersection.equals({x: 4, y: 4, z: 4}));

  p1 = {x: 43.8, y: 0, z: -12.7};
  p3 = {x: 43.8, y: 0, z: -12.1};
  p2 = {x: 22.9, y: 0, z: -26};

  plane = new Plane(p1,p2,p3);
  line = new Line3D({x:1.9,y:12.1,z:-29.2}, {x:1.9,y:84.5,z:-29.2});
  intersection = plane.intersection.line(line);
  ts.assertTrue(intersection.equals({x: 1.9, y: 0, z: -29.2}));


  p1 = new Vertex3D(43.815,0,-12.69999999999996);
  p2 = new Vertex3D(43.815,0,-12.06499999999996);
  p3 = new Vertex3D(22.96,0,-26.034999999999975);

  plane = new Plane(p1,p2,p3);
  line = new Line3D({x:1.9050000000000018,y:12.064999999999998,z:-29.21000000000001}, {x:1.9050000000000018,y:84.455,z:-29.209999999999997});
  intersection = plane.intersection.line(line);
  ts.assertTrue(intersection.equals({x: 1.905, y: 0, z: -29.21}));


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


Test.add('Plane: bisector(fromPointNormal)',(ts) => {
  const xyPlane = Plane.fromPointNormal({x: 12, y: 41, z: 0}, new Vector3D(1, 1, 1));
  const yzPlane = Plane.fromPointNormal({x: 0, y: 41, z: 1}, new Vector3D(0, 3, -1));
  const xzPlane = Plane.fromPointNormal({x: 12, y: 0, z: 50}, new Vector3D(5, 0, 13));
  ts.success();
});

const checkAnswer = (ts, intersections) =>  {
  const checkFunc = (attr, val) => {
    if (Number.isNaN(intersections[attr])) {
      ts.assertTrue(Number.isNaN(val));
    } else {
      ts.assertEquals(intersections[attr], val);
    }
    return checkFunc;
  }
  return checkFunc;
}
Test.add('Plane: intersections', (ts) => {
  let plane1 = new Plane({x:-10, y:0, z:3}, {x:0, y:10, z:3}, {x:10, y:0, z: 3});
  let intersections = plane1.axisIntercepts();
  checkAnswer(ts, intersections)('x', NaN)('y', NaN)('z', 3);

  let plane2 = new Plane({x:-10, y:0, z:0}, {x:0, y:10, z:0}, {x:10, y:0, z: 0});
  intersections = plane2.axisIntercepts();
  checkAnswer(ts, intersections)('x', Infinity)('y', Infinity)('z', 0);

  let plane3 = new Plane({x:-10, y:0, z:0}, {x:0, y:86, z:0}, {x:0, y:0, z: 23});
  intersections = plane3.axisIntercepts();
  checkAnswer(ts, intersections)('x', -10)('y', 86)('z', 23);

  let plane4 = new Plane({x:0, y:100, z:23}, {x:0, y:86, z:45}, {x:0, y:86, z: -12});
  plane4.toDrawString();
  intersections = plane4.axisIntercepts();
  checkAnswer(ts, intersections)('x', 0)('y', Infinity)('z', Infinity);

  let plane5 = new Plane({x:6, y:100, z:23}, {x:6, y:86, z:45}, {x:6, y:86, z: -12});
  intersections = plane5.axisIntercepts();
  checkAnswer(ts, intersections)('x', 6)('y', NaN)('z', NaN);

  ts.success();
});

const tol = .000000001;
function confirmNormalAndPoints(plane, normal, points, ts) {
  ts.assertTrue(plane.normal().equals(normal.unit()));
  for (let index = 0; index < points.length; index++) {
    const p = points[index];
    ts.assertTolerance(plane.x(p.y,p.z).x, p.x, tol);
    ts.assertTolerance(plane.y(p.x,p.z).y, p.y, tol);
    ts.assertTolerance(plane.z(p.x,p.y).z, p.z, tol);
  }
}

Test.add('Plane: fromPointNormal', (ts) => {
  let normal = new Vector3D(1,1,1);
  let points = [{x:1, y:1, z: 1}];
  let plane = Plane.fromPointNormal(points[0], normal);
  confirmNormalAndPoints(plane, normal, points, ts);

  points = [{x:1,y:1,z:1}, {x:5,y:6,z:3}, {x:2,y:3,z:4}]
  plane = new Plane(points);
  normal = plane.normal();
  plane = Plane.fromPointNormal(points[0], normal);
  confirmNormalAndPoints(plane, normal, points, ts);

  points = [{x:6,y:19,z:27}, {x:4,y:6,z:-3}, {x:12,y:13,z:-15}]
  plane = new Plane(points);
  normal = plane.normal();
  plane = Plane.fromPointNormal(points[0], normal);
  confirmNormalAndPoints(plane, normal, points, ts);

  points = [{x:10,y:100,z:-1}, {x:75,y:16,z:13}, {x:2,y:33,z:-41}]
  plane = new Plane(points);
  normal = plane.normal();
  plane = Plane.fromPointNormal(points[0], normal);
  confirmNormalAndPoints(plane, normal, points, ts);

  ts.success();
});
