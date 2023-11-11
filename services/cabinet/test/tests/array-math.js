const Test = require('../../../../public/js/utils/test/test').Test;
const Matrix = require('../../app-src/three-d/objects/matrix.js');
const Vertex3D = require('../../app-src/three-d/objects/vertex.js');
const Vertex2d = require('../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Line2d = require('../../../../public/js/utils/canvas/two-d/objects/line.js');
const approximate = require('../../../../public/js/utils/approximate.js');

const CSG = require('../../../../public/js/utils/3d-modeling/csg.js');
const GL = require('../../../../public/js/utils/3d-modeling/lightgl.js');
const FixedValue = require('../../app-src/three-d/objects/fixed-value');


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

Test.add('Matrix: rowEchelon', (ts) => {
  let matrix = new Matrix([
    [1,2,3,1],
    [5,6,7,1],
    [9,10,11,1],
  ]);

  let rowEsch = matrix.rowEchelon();
  let reduced = matrix.rowEchelon(true);
  ts.assertTrue(reduced.equals(new Matrix([[1,0,-1,-1],[0,1,2,1],[0,0,0,0]])));
  ts.assertTrue(rowEsch.equals(new Matrix([[1,2,3,1],[0,-4,-8,-4],[0,0,0,0]])));

  matrix = new Matrix([
    [5,3,2,1],
    [9,6,8,1],
    [1,4,7,1],
  ]);

  rowEsch = matrix.rowEchelon();
  reduced = matrix.rowEchelon(true);
  ts.assertTrue(reduced.equals(new Matrix([[1,0,0,-9/55],[0,1,0,4/5],[0,0,1,-16/55]])));
  ts.assertTrue(rowEsch.equals(new Matrix([[5,3,2,1],[0,3/5,22/5,-4/5],[0,0,-275/15,16/3]])));

  ts.success();
});

Test.add('Matrix: fixedColumns', (ts) => {
  let matrix = new Matrix([
    [8,3,1],
    [8,6,1],
    [1,4,1],
  ]);

  let fixedColumns = matrix.fixedColumns();
  ts.assertTrue(fixedColumns.equals([false, false, true]));

  matrix = new Matrix([
    [8,3,1],
    [7.99999999999,6,1],
    [8.000001,4,1],
  ]);

  fixedColumns = matrix.fixedColumns();
  ts.assertTrue(fixedColumns.equals([true, false, true]));

  ts.success();
});

Test.add('Matrix: uniqueRows', (ts) => {
  let matrix = new Matrix([
    [8,6,1],
    [8,6,1],
    [1,4,1],
  ]);

  let uniqueRows = matrix.uniqueRows();
  ts.assertTrue(uniqueRows.equals(new Matrix([[8,6,1],[1,4,1]])));

  matrix = new Matrix([
    [0,0,3,-5,4,0,0,1],
    [0,0,3,-5,4,0,0,1],
    [0,0,5,2,1,0,0,1],
    [0,0,5,2,1,0,0,1],
    [0,0,2,3,-2,0,0,1],
  ]);

  uniqueRows = matrix.uniqueRows();
  ts.assertTrue(uniqueRows.equals(new Matrix([[0,0,3,-5,4,0,0,1],[0,0,5,2,1,0,0,1],[0,0,2,3,-2,0,0,1]])));

  ts.success();
});

Test.add('Matrix: properDemension', (ts) => {
  let matrix = new Matrix([
    [8,6,1],
    [8,6,1],
    [1,4,1],
  ]);

  const zero = new FixedValue(0);
  const one = new FixedValue(1);
  let properDemension = matrix.properDemension();
  ts.assertTrue(properDemension.matrix.equals(new Matrix([[8,6],[1,4]])));
  ts.assertTrue(properDemension.fixedValues.equals([,,one]));

  matrix = new Matrix([
    [0,0,3,-5,4,0,0,1],
    [0,0,3,-5,4,0,0,1],
    [0,0,5,2,1,0,0,1],
    [0,0,5,2,1,0,0,1],
    [0,0,2,3,-2,0,0,1],
  ]);

  properDemension = matrix.properDemension(true);
  ts.assertTrue(properDemension.matrix.equals(new Matrix([[3,-5,4],[5,2,1],[2,3,-2]])));
  ts.assertTrue(properDemension.fixedValues.equals([zero,zero,,,,zero,zero,one]));

  matrix = new Matrix([
    [8,7,1],
    [8,7,1],
    [1,4,1],
  ]);

  properDemension = matrix.properDemension();
  ts.assertTrue(properDemension.matrix.equals(new Matrix([[8,7],[1,4]])));
  ts.assertTrue(properDemension.fixedValues.equals([,,one]));

  ts.success();
});

Test.add('Matrix: consise',(ts) => {
  let cloudyMatirx = new Matrix([
    [0,0,3,-5,4,0,0],
    [0,0,3,-5,4,0,0],
    [0,0,5,2,1,0,0],
    [0,0,5,2,1,0,0],
    [0,0,2,3,-2,0,0],
  ]);

  const consiseObj = cloudyMatirx.consise();
  ts.assertTrue([6,5,1,0].equals(consiseObj.removedColumns));

  let solution = new Matrix([
    [3,-5,4],
    [5,2,1],
    [2,3,-2],
  ]);
  ts.assertTrue(solution.equals(consiseObj.matrix));

  ts.success();

});

Test.add('Matrix: solve',(ts) => {
  let equations = new Matrix([
    [3,-5,4],
    [5,2,1],
    [2,3,-2],
  ]);
  let dColumn = [5, 0, 3];
  let answer = new Matrix([[2],[-3],[-4]]);

  let solution = equations.solve(dColumn);
  ts.assertTrue(solution.equals(answer));

  let cloudyMatirx = new Matrix([
    [0,0,3,-5,4,0,0],
    [0,0,3,-5,4,0,0],
    [0,0,5,2,1,0,0],
    [0,0,5,2,1,0,0],
    [0,0,2,3,-2,0,0],
  ]);

  let unknownValue = 0;
  answer = new Matrix([[unknownValue],[unknownValue],[2],[-3],[-4],[unknownValue],[unknownValue]]);
  solution = cloudyMatirx.solve(dColumn);
  ts.assertTrue(solution.equals(answer));

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

function checkRotateAroundPoint(ts, point, rotation) {
  rotation ||= [2, 0, 0];
  const glMatrix = GL.Matrix.rotateAroundPoint(point, rotation).m;
  const matrix = Matrix.fromGL(glMatrix);
  const vertMatrix = Matrix.fromVertex(point);
  const result = matrix.dot(vertMatrix);

  const glRotationMatrix = GL.Matrix.rotationMatrix(rotation);
  const rotationMatrix = Matrix.fromGL(glRotationMatrix.m);
  const T = new Matrix([[1,0,0,point.x],[0,1,0,point.y],[0,0,1,point.z],[0,0,0,1]]);
  const Tneg = new Matrix([[1,0,0,-point.x],[0,1,0,-point.y],[0,0,1,-point.z],[0,0,0,1]]);
  const rotMatrix = T.dot(rotationMatrix).dot(Tneg);
  const manualResult = rotMatrix.dot(vertMatrix);

  ts.assertTrue(manualResult.equals(vertMatrix), `Manual matrix attempt to perform operations is malfunctioning:\n${manualResult.toString()}\n\nshould be \n${vertMatrix.toString()}`);
  ts.assertTrue(matrix.equals(rotMatrix), `Point Rotation matrix is incorrect:\n${rotMatrix.toString()}\n\nshould be\n${rotMatrix.toString()}`);
  ts.assertTrue(manualResult.equals(result), `Dot product with point rotation matrix is not producing the desired result:\n${result.toString()}\n\nshould be\n${manualResult.toString()}`);
  ts.assertTrue(vertMatrix.equals(result), `Point rotated around should not move:\n${result.toString()}\n\nshould be\n${vertMatrix.toString()}`);
}

function allRotationsAroundPoint(ts, point) {
  checkRotateAroundPoint(ts, point, [2,0,0]);
  checkRotateAroundPoint(ts, point, [0,2,0]);
  checkRotateAroundPoint(ts, point, [0,0,2]);
  checkRotateAroundPoint(ts, point, [2,2,2]);
}

function testOtherPointRotation(ts, center, rotation, other, expectedResult) {
  const glMatrix = GL.Matrix.rotateAroundPoint(center, rotation).m;
  const rotMatrix = Matrix.fromGL(glMatrix);
  const rotatedPoint = rotMatrix.dot(Matrix.fromVertex(other));
  ts.assertTrue(rotatedPoint.equals(expectedResult), `Rotated point did not end where expected:\n${rotatedPoint.toString()}\n\nshould be\n${expectedResult}`);
}

Test.add('lightgl: rotateAroundPoint', (ts) => {
  allRotationsAroundPoint(ts, new Vertex3D(0,0,0));
  allRotationsAroundPoint(ts, new Vertex3D(1,0,0));
  allRotationsAroundPoint(ts, new Vertex3D(0,1,0));
  allRotationsAroundPoint(ts, new Vertex3D(0,0,1));
  allRotationsAroundPoint(ts, new Vertex3D(1,1,1));

  allRotationsAroundPoint(ts, new Vertex3D(4,2,1));
  allRotationsAroundPoint(ts, new Vertex3D(5,4,3));
  allRotationsAroundPoint(ts, new Vertex3D(22,1,0));
  allRotationsAroundPoint(ts, new Vertex3D(0,18,1));
  allRotationsAroundPoint(ts, new Vertex3D(1,5,1));

  testOtherPointRotation(ts, new Vertex3D(1,1,1), [0,Math.PI,0], new Vertex3D(3,1,2), new Matrix([[-1],[1],[0],[1]]));
  testOtherPointRotation(ts, new Vertex3D(1,1,1), [0,Math.PI/2,0], new Vertex3D(3,1,2), new Matrix([[2],[1],[-1],[1]]));

  testOtherPointRotation(ts, new Vertex3D(1,1,1), [0,0,Math.PI], new Vertex3D(3,1,2), new Matrix([[3],[1],[0],[1]]));
  testOtherPointRotation(ts, new Vertex3D(1,1,1), [0,0,Math.PI/2], new Vertex3D(3,1,2), new Matrix([[3],[0],[1],[1]]));

  testOtherPointRotation(ts, new Vertex3D(1,1,1), [Math.PI,0,0], new Vertex3D(3,1,2), new Matrix([[-1],[1],[2],[1]]));
  testOtherPointRotation(ts, new Vertex3D(1,1,1), [Math.PI/2,0,0], new Vertex3D(3,1,2), new Matrix([[1],[3],[2],[1]]));

  ts.success();
});
