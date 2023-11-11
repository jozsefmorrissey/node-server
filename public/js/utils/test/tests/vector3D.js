
const Vector3D = require('../../../../../services/cabinet/app-src/three-d/objects/vector.js');
const Vertex3D = require('../../../../../services/cabinet/app-src/three-d/objects/vertex.js');
const Polygon3D = require('../../../../../services/cabinet/app-src/three-d/objects/polygon.js');
const Plane = require('../../../../../services/cabinet/app-src/three-d/objects/plane.js');
const Line3D = require('../../../../../services/cabinet/app-src/three-d/objects/line.js');
const Matrix = require('../../../../../services/cabinet/app-src/three-d/objects/matrix.js');
const Test = require('../test.js').Test;

function closeEnough(alignTo, realigned, ts) {
  for (let index = 0; index < alignTo.length; index++) {
    ts.assertTrue(realigned[index].equals(alignTo[index], .0001));
  }
}

function testRotations(rotations, ts) {
  rotations.x ||= 0;
  rotations.z ||= 0;
  rotations.y ||= 0;
  const alignTo = [new Vector3D(1,0,0),new Vector3D(0,1,0),new Vector3D(0,0,1)];
  let align = alignTo;
  align = align.map(v => Line3D.fromVector(v).rotate(rotations).vector());
  const calculated = Line3D.coDirectionalRotations(align, alignTo);
  const revCalculated = Line3D.coDirectionalRotations(align, alignTo, true);
  ts.assertTrue(Object.equals(rotations, revCalculated));
  const realignedRev = align.map(v => Line3D.fromVector(v).reverseRotate(revCalculated).vector());
  const realigned = align.map(v => Line3D.fromVector(v).rotate(calculated).vector());

  ts.assertTrue(realignedRev.equals(alignTo));
  closeEnough(alignTo, realigned, ts);
}

Test.add('Vector3D: coDirectionalRotations(simple)', (ts) => {
  testRotations({x:12}, ts);
  testRotations({y:12}, ts);
  testRotations({z:12}, ts);

  testRotations({x:12, z:18}, ts);
  testRotations({x:12, y:18}, ts);
  testRotations({z:12, y:18}, ts);

  testRotations({z:33, y:18, x:12}, ts);
  testRotations({z:27, y:48, x:13}, ts);
  testRotations({z:11, y:6, x:25}, ts);

  ts.success();
});

function multipleRotations(rotations, ts) {
  const alignTo = [new Vector3D(1,0,0),new Vector3D(0,1,0),new Vector3D(0,0,1)];
  align = alignTo.map(v => Line3D.fromVector(v).rotate(rotations).vector());
  const calculated = Line3D.coDirectionalRotations(align, alignTo, true);

  const realigned = align.map(v => Line3D.fromVector(v).reverseRotate(calculated).vector());
  closeEnough(alignTo, realigned, ts);
}

Test.add('Vector3D: coDirectionalRotations(complex)', (ts) => {
  let rotations = [{x:22, y:33, z:124}, {x:-88, y:14, z:-682}];
  multipleRotations(rotations, ts);
  rotations = [{x:2600, y:3311, z:1243}, {x:-188, y:1400, z:-6821}];
  multipleRotations(rotations, ts);
  rotations = [{x:2782, y:3330, z:4899}, {x:-888, y:-25677, z:-3000}];
  multipleRotations(rotations, ts);

  rotations = [{x:2782, y:3330, z:4899}, {x:-888, y:-25677, z:-3000}, {x:2600, y:3311, z:1243}, {x:-188, y:1400, z:-6821}];
  multipleRotations(rotations, ts);

  ts.success();
});










const centerSorter = (center) => (info1, info2) =>
      center.distance(info1.start) - center.distance(info2.start);
function buildPolyLine3D(line1, line2) {
  const interInfo = [];
  const intersectionInfo = (line, plane, start) => {
    const end = plane.intersection.line.segment(line);
    if (end) {
      interInfo.push({end, start});
    }
  }
  const unitVec = line1.vector().unit();
  const plane1 = Plane.fromPointNormal(line1.startVertex, unitVec);
  const plane2 = Plane.fromPointNormal(line1.endVertex, unitVec);
  const plane3 = Plane.fromPointNormal(line2.startVertex, unitVec);
  const plane4 = Plane.fromPointNormal(line2.endVertex, unitVec);
  intersectionInfo(line2, plane1, line1.startVertex);
  intersectionInfo(line2, plane2, line1.endVertex);
  intersectionInfo(line1, plane3, line2.startVertex);
  intersectionInfo(line1, plane4, line2.endVertex);
  const center = Vertex3D.center(line1.startVertex, line1.endVertex, line2.startVertex, line2.endVertex);
  interInfo.sort(centerSorter(center));
  const polyLine1 = new Line3D(interInfo[0].start, interInfo[0].end).polarize();
  const polyLine2 = new Line3D(interInfo[1].start, interInfo[1].end).polarize();

  const poly = Polygon3D.fromLines([line1, polyLine1, line2, polyLine2]);

  console.log(line1.toString(), line2.toString());
}






// Stole from https://stackoverflow.com/a/28701387
// Thank You, Alexandre Giordanelli
var closestDistanceBetweenLines = function(line1, line2, clampAll, clampA0, clampA1, clampB0, clampB1) {
  line2 = line2.polarize();
  line1 = line1.polarize();
  const a0 = line1.startVertex; const a1 = line1.endVertex;
  const b0 = line2.startVertex; const b1 = line2.endVertex;
    //Given two lines defined by numpy.array pairs (a0,a1,b0,b1)
    //Return distance, the two closest points, and their average

    clampA0 = clampAll || clampA0 || false;
    clampA1 = clampAll || clampA1 || false;
    clampB0 = clampAll || clampB0 || false;
    clampB1 = clampAll || clampB1 || false;
    clampAll = clampAll || clampAll || false;

    //Calculate denomitator
    var A = a1.minus(a0);
    var B = b1.minus(b0);
    var _A = A.unit();
    var _B = B.unit();
    var cross = _A.crossProduct(_B);
    var denom = Math.pow(cross.magnitude(), 2);

    //If denominator is 0, lines are parallel: Calculate distance with a projection and evaluate clamp edge cases
    if (denom == 0){
        var d0 = _A.dot(b0.minus(a0));
        var d = _A.scale(d0).add(a0).minus(b0).magnitude();

        //If clamping: the only time we'll get closest points will be when lines don't overlap at all. Find if segments overlap using dot products.
        if(clampA0 || clampA1 || clampB0 || clampB1){
            var d1 = _A.dot(b1.minus(a0));

            //Is segment B before A?
            if(d0 <= 0 && 0 >= d1){
                if(clampA0 == true && clampB1 == true){
                    if(Math.abs(d0) < Math.abs(d1)){
                        return new Line3D(b0, a0);
                    }
                    return new Line3D(b1, a0);
                }
            }
            //Is segment B after A?
            else if(d0 >= A.magnitude() && A.magnitude() <= d1){
                if(clampA1 == true && clampB0 == true){
                    if(Math.abs(d0) < Math.abs(d1)){
                        return new Line3D(b0, a1);
                    }
                    return new Line3D(b1, a1);
                }
            }

        }

        //If clamping is off, or segments overlapped, we have infinite results, just return position.
        buildPolyLine3D(line1, line2);
        return [null, null, d];
    }

    //Lines criss-cross: Calculate the dereminent and return points
    var t = b0.minus(a0);
    var det0 = new Matrix([t, _B, cross]).determinate();
    var det1 = new Matrix([t, _A, cross]).determinate();

    var t0 = det0 / denom;
    var t1 = det1 / denom;

    var pA = _A.scale(t0).add(a0);
    var pB = _B.scale(t1).add(b0);

    //Clamp results to line segments if needed
    if(clampA0 || clampA1 || clampB0 || clampB1){

        if(t0 < 0 && clampA0)
            pA = a0;
        else if(t0 > A.magnitude() && clampA1)
            pA = a1;

        if(t1 < 0 && clampB0)
            pB = b0;
        else if(t1 > B.magnitude() && clampB1)
            pB = b1;

    }

    return new Line3D(pA, pB);
}


function shuffleCheck(line1, line2, answer, ts) {
  if (!answer) answer = closestDistanceBetweenLines(line1, line2 ,true);
  else ts.assertTrue(closestDistanceBetweenLines(line1, line2 ,true).equals(answer));
  line1 = line1.negitive();
  ts.assertTrue(closestDistanceBetweenLines(line1, line2 ,true).equals(answer));
  line2 = line2.negitive();
  ts.assertTrue(closestDistanceBetweenLines(line1, line2 ,true).equals(answer));
  line1 = line1.negitive();
  ts.assertTrue(closestDistanceBetweenLines(line1, line2 ,true).equals(answer));
}

function shuffleLines(lines, answer, rotations) {
  lines.shuffle();
  lines.forEach(l => {
    Math.random() > .5 && l.invert()
    if (rotations) l.rotate(rotations, answer.center());
  });
  if (rotations) answer.rotate(rotations, answer.center());
}

Test.add('Polygon3D: fromLines', (ts) => {
  const lines = [new Line3D([0,1,0], [0,2,0]),
                new Line3D([1,3,0],[2,3,0]),
                new Line3D([3,2,0],[3,1,0]),
                new Line3D([2,0,0],[1,0,0])];
  const answer = new Polygon3D(Line3D.vertices(lines));
  let poly = Polygon3D.fromLines(lines);
  console.log(Polygon3D.toDrawString2d([poly], 'x', 'y'));
  ts.assertTrue(answer.equals(poly));
  shuffleLines(lines);
  poly = Polygon3D.fromLines(lines);
  console.log(Polygon3D.toDrawString2d([poly], 'x', 'y'));
  ts.assertTrue(answer.equals(poly));
  shuffleLines(lines, answer, {z: 33, y:76});
  poly = Polygon3D.fromLines(lines);
  console.log(Polygon3D.toDrawString2d([poly], 'x', 'y'));
  ts.assertTrue(answer.equals(poly));

  ts.success();
});

Test.add('Line3D: distance (line)', (ts) => {
  //example
  var line1 = new Line3D([-1,0,0], [-1,0,1]);
  var line2 = new Line3D([0,0,0], [0,0,1]);
  console.log(closestDistanceBetweenLines(line1, line2 ,true));

  line1 = new Line3D([-1,-1,-1], [-10,-10,-10]);
  line2 = new Line3D([1,-1,-1], [10,10,10]);
  var answer = new Line3D([-1,-1,-1], [1,-1,-1]);
  shuffleCheck(line1, line2, answer, ts);

  line1 = new Line3D([27.83, 31.74, -26.60], [13.43, 21.77, 46.81]);
  line2 = new Line3D([77.54, 7.53, 6.22], [26.99, 12.39, 11.18]);
  shuffleCheck(line1, line2, null, ts);

  ts.success();
});
