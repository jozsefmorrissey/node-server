const Test = require('../../../../public/js/utils/test/test').Test;
const Matrix = require('../../app-src/three-d/objects/matrix.js');
const Vertex3D = require('../../app-src/three-d/objects/vertex.js');
const Vertex2d = require('../../app-src/two-d/objects/vertex.js');
const Line2d = require('../../app-src/two-d/objects/line.js');
const approximate = require('../../../../public/js/utils/approximate.js');

const CSG = require('../../public/js/3d-modeling/csg');


Test.add('Array: translate',(ts) => {
  let result = [].translate([1,2,3]);
  ts.assertTrue(result.equals([1,2,3]));
  ts.assertFalse(result.equals([1,2,4]));
  ts.assertFalse(result.equals([1,2,3,4]))
  ts.assertFalse(result.equals([1,2]))

  result = [3,6,9].translate([1,-2,3]);
  ts.assertTrue(result.equals([4,4,12]));
  ts.assertFalse(result.equals([4,2,12]));

  let a = [4,-4,-4];
  let b = a.translate([5,5,5], true, true);
  ts.assertTrue(a.equals([4,-4,-4]));
  ts.assertTrue(b.equals([9,1,1]));

  ts.success();
});


Test.add('Array: inverse',(ts) => {
  let result = [3,6,9].inverse();
  ts.assertTrue(result.equals([-3,-6,-9]));

  let a = [4,-4,-4];
  let b = a.inverse(true);
  ts.assertTrue(a.equals([4,-4,-4]));
  ts.assertTrue(b.equals([-4,4,4]));

  a = [1,2,3];
  b = a.inverse(true);
  let c = a.translate(b, true);
  ts.assertTrue(a.equals([1,2,3]));
  ts.assertTrue(b.equals([-1,-2,-3]));
  ts.assertTrue(c.equals([0,0,0]));

  ts.success();
});


Test.add('Matrix: multiply',(ts) => {
  let result = new Matrix([[1,2],[6,7]]).multiply(new Matrix([[5,3],[4,4]]));
  ts.assertTrue(result.equals(new Matrix([[13,11],[58,46]])));

  let A = new Matrix([[7,7,7],[2,3,4],[6,7,8],[5,5,5]]);
  let B = new Matrix([[4,0,7],[1,1,1],[7,7,7]]);

  let AB = new Matrix([[84,56,105],[39,31,45],[87,63,105],[60,40,75]]);
  ts.assertTrue(AB.equals(A.multiply(B)));

  ts.success();
});

Test.add('Matrix: remove',(ts) => {
  let matrix = new Matrix([
    [1,2,3,4],
    [5,6,7,8],
    [9,0,2,3],
    [6,6,6,6]
  ]);
  let result = matrix.remove();
  ts.assertTrue(result.equals(matrix));

  result = matrix.remove(0);
  ts.assertTrue(result.equals(new Matrix([
    [5,6,7,8],
    [9,0,2,3],
    [6,6,6,6]
  ])));

  result = matrix.remove(null, 2);
  ts.assertTrue(result.equals(new Matrix([
    [1,2,4],
    [5,6,8],
    [9,0,3],
    [6,6,6]
  ])));

  result = matrix.remove(0,1);
  ts.assertTrue(result.equals(new Matrix([
    [5,7,8],
    [9,2,3],
    [6,6,6]
  ])));

  result = matrix.remove(-2, -1);
  ts.assertTrue(result.equals(new Matrix([
    [1,2,3],
    [5,6,7],
    [6,6,6]
  ])));

  result = matrix.minor(0);
  ts.assertTrue(result.equals(new Matrix([
    [6,7,8],
    [0,2,3],
    [6,6,6]
  ])));

  result = matrix.minor(2);
  ts.assertTrue(result.equals(new Matrix([
    [5,6,8],
    [9,0,3],
    [6,6,6]
  ])));

  ts.success();
});


Test.add('Matrix: remove',(ts) => {
  let matrix = new Matrix([
    [7,8],
    [9,3],
  ]);
  let result = matrix.determinate();
  ts.assertTrue(result === -51);

  matrix = new Matrix([
    [1,2,4],
    [5,7,8],
    [0,2,3]
  ]);
  let det = matrix.determinate();
  ts.assertTrue(det === 15);

  matrix = new Matrix([
    [4,7],
    [2,6]
  ]);
  det = matrix.determinate();

  let inverse = matrix.diagonal();
  inverse.scale(-1, true);
  inverse.scale(1/det);

  // matrix = new Matrix([
  //   [1,1,5,6,3,8,7,6,5,1,2,4],
  //   [1,1,5,6,3,8,7,6,5,1,2,4],
  //   [1,1,5,6,3,8,7,6,5,1,2,4],
  //   [1,1,5,6,3,8,7,6,5,1,2,4],
  //   [1,1,5,6,3,8,7,6,5,1,2,4],
  //   [1,1,5,6,3,8,7,6,5,1,2,4],
  //   [1,1,5,6,3,8,7,6,5,1,2,4],
  //   [1,1,5,6,3,8,7,6,5,1,2,4],
  //   [1,1,5,6,3,8,7,6,5,1,2,4],
  //   [1,1,5,6,3,8,7,6,5,1,2,4],
  //   [1,1,5,6,3,8,7,6,5,1,2,4],
  //   [1,1,5,6,3,8,7,6,5,1,2,4],
  // ]);
  // result = matrix.determinate();
  // ts.assertTrue(result === 0);


  // matrix = new Matrix([
  //   [1,1,5,6,3,8,7,6,5,4],
  //   [1,1,5,6,7,6,5,1,2,4],
  //   [1,1,5,6,3,8,5,1,2,4],
  //   [1,6,3,8,7,6,5,1,2,4],
  //   [1,1,3,8,7,6,5,1,2,4],
  //   [1,1,5,6,3,8,7,1,2,4],
  //   [1,1,5,6,3,8,7,1,2,4],
  //   [1,1,5,6,3,8,7,1,2,4],
  //   [1,1,5,6,3,8,7,6,5,1],
  //   [1,1,5,8,7,6,5,1,2,4],
  // ]);
  // result = matrix.determinate();
  // ts.assertTrue(result === 0);

  ts.success();
});


Test.add('Matrix: identity',(ts) => {
  let identity2 = Matrix.identity(2);
  let identity3 = Matrix.identity(3);

  let matrix = new Matrix([
    [7,8],
    [9,3],
  ]);
  let inverse = matrix.inverse();
  let result = matrix.multiply(inverse)
  result.approximate();
  ts.assertTrue(result.equals(identity2));

  result = inverse.multiply(matrix);
  result.approximate();
  ts.assertTrue(result.equals(identity2));


  matrix = new Matrix([
    [1,2,3],
    [4,5,6],
    [7,2,9]
  ]);
  inverse = matrix.inverse();
  result = matrix.multiply(inverse)
  result.approximate();
  ts.assertTrue(result.equals(identity3));

  result = inverse.multiply(matrix);
  result.approximate();
  ts.assertTrue(result.equals(identity3));

  ts.success();
});



Test.add('Matrix: solve',(ts) => {
  let equations = new Matrix([
    [3,-5,4],
    [5,2,1],
    [2,3,-2],
  ]);
  let answer = [5, 0, 3];

  const solution = equations.solve(answer);
  solution.equals(new Matrix([
    [2],
    [-3],
    [-4]
  ]));

  ts.success();
});

const accuracy = 10000000000;


function testRotation(ts, center, rotation) {
  center = new Vertex3D({x: 1, y:0, z:0});
  let cube = CSG.cube({radius: .0000000000001});
  cube.center(center);
  cube.rotate(rotation);
  let modelCenter = cube.polygons[0].vertices[0].pos;

  let calculatedCenter = CSG.rotate(center, rotation);
  ts.assertTrue(approximate.eq(modelCenter.x, calculatedCenter.x), `${modelCenter.x} !~= ${calculatedCenter.x}`);
  ts.assertTrue(approximate.eq(modelCenter.y, calculatedCenter.y), `${modelCenter.y} !~= ${calculatedCenter.y}`);
  ts.assertTrue(approximate.eq(modelCenter.z, calculatedCenter.z), `${modelCenter.z} !~= ${calculatedCenter.z}`);
}

function comparePoints(ts, p1, p2) {
  ts.assertEquals(p1.x, p2.x, null,  accuracy);
  ts.assertEquals(p1.y , p2.y, null,  accuracy);
  ts.assertEquals(p1.z, p2.z, null,  accuracy);
}

Test.add('CSG: rotation',(ts) => {

  testRotation(ts, {x: 1, y:0, z:0}, {x: 90, y: 0, z: 0});
  testRotation(ts, {x: 1, y:0, z:0}, {x: 0, y: 1, z: 0});
  testRotation(ts, {x: 1, y:0, z:0}, {x: 0, y: 0, z: 1});
  testRotation(ts, {x: 1, y:0, z:0}, {x: 1, y: 1, z: 1});
  testRotation(ts, {x: 1, y:1, z:1}, {x: 27, y: 0, z: 0});
  testRotation(ts, {x: 1, y:1, z:1}, {x: 0, y: -15, z: 0});
  testRotation(ts, {x: 1, y:1, z:1}, {x: 0, y: 0, z: 33});
  testRotation(ts, {x: 1, y:1, z:1}, {x: 90, y: 90, z: 90});
  testRotation(ts, {x: 1, y:0, z:0}, {x: 27, y: 90, z: 0});
  testRotation(ts, {x: 1, y:0, z:0}, {x: 27, y: 0, z: 90});
  testRotation(ts, {x: 1, y:0, z:0}, {x: 27, y: 90, z: 90});
  testRotation(ts, {x: 1, y:0, z:0}, {x: 27, y: -15, z: 33});

  let rotation = {x: 27, y: -15, z: 33};
  let start = {x: 50, y: -12, z:-4};
  let point = CSG.rotate(start, rotation);
  let reversed = CSG.reverseRotate(point, rotation);

  ts.assertEquals(start.x, reversed.x, null, accuracy);
  ts.assertEquals(start.y, reversed.y, null, accuracy);
  ts.assertEquals(start.z, reversed.z, null, accuracy);

  point = {x: 0, y:0, z: -3};
  let offset = {x: 1, y:0, z: 0};
  rotation = {x: 0, y:90, z: 0};

  let result = CSG.transRotate(point, offset, rotation);
  ts.assertEquals(result.x, 0, null,  accuracy);
  ts.assertEquals(result.y , 0, null,  accuracy);
  ts.assertEquals(result.z, -4, null,  accuracy);

  point = {x: 0, y:0, z: -3};
  offset = {x: -1, y:0, z: 2};
  rotation = {x: 0, y:90, z: 0};

  result = CSG.transRotate(point, offset, rotation);
  ts.assertEquals(result.x, 2, null,  accuracy);
  ts.assertEquals(result.y , 0, null,  accuracy);
  ts.assertEquals(result.z, -2, null,  accuracy);


  let topLeft = {x: -1, y: 1, z:0};
  let topRight = {x: 1, y: 1, z:0};
  let bottomRight = {x: 1, y:-1 , z:0};
  let bottomLeft = {x: -1, y: -1, z:0};

  offset = {x: -1, y: 0, z: 0}
  rotation = {x: 0, y:90, z: 0};

  let topLeftAns = {x: -1, y: 1, z:1};
  let topRightAns = {x: 1, y: 1, z:1};
  let bottomRightAns = {x: 1, y: -1, z:1};
  let bottomLeftAns = {x: -1, y: -1, z:1};

  let points = [topLeft, topRight, bottomRight, bottomLeft];
  CSG.transRotateAll(points, offset, rotation);
  comparePoints(ts, points[0], topLeftAns);
  comparePoints(ts, points[1], topRightAns);
  comparePoints(ts, points[2], bottomRightAns);
  comparePoints(ts, points[3], bottomLeftAns);

  point = {x: 10, y:20, z: 0};
  offset = {x: -1, y: -1, z: 1};
  answer = {x: 9, y: 19, z: 1};
  result = CSG.transRotate(point, offset, {x:0,y:0,z:0});
  comparePoints(ts, result, answer);
  rotation = {x: 6.009, y: 0, z: 0};
  let rotatedPoint = CSG.rotate(point, rotation);
  result = CSG.transRotate(rotatedPoint, offset, rotation);
  result = CSG.reverseRotate(result, rotation);
  comparePoints(ts, result, answer);

  ts.success();
});

Test.add('Vertex3D: direction',(ts) => {
  ts.assertEquals(Vertex3D.direction([{x:0, y: 0, z: 0}], [{x: 0, y: 1, z: 0}]), 'up');
  ts.assertEquals(Vertex3D.direction([{x:0, y: 0, z: 0}], [{x: 0, y: -1, z: 0}]), 'down');
  ts.assertEquals(Vertex3D.direction([{x:0, y: 0, z: 0}], [{x: -1, y: 0, z: 0}]), 'left');
  ts.assertEquals(Vertex3D.direction([{x:0, y: 0, z: 0}], [{x: 1, y: 0, z: 0}]), 'right');
  ts.assertEquals(Vertex3D.direction([{x:0, y: 0, z: 0}], [{x: 0, y: 0, z: -1}]), 'forward');
  ts.assertEquals(Vertex3D.direction([{x:0, y: 0, z: 0}], [{x: 0, y: 0, z: 1}]), 'backward');

  ts.assertEquals(Vertex3D.direction([{x:0, y: 0, z: 0}], [{x: 1, y: 1, z: 0}]), 'right up');
  ts.assertEquals(Vertex3D.direction([{x:0, y: 0, z: 0}], [{x: -1, y: 0, z: -1}]), 'left forward');
  ts.assertEquals(Vertex3D.direction([{x:0, y: 0, z: 0}], [{x: 1, y: 1, z: 1}]), 'right up backward');

  ts.success();
});
