
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








function shuffleCheck(line1, line2, answer, ts) {
  if (!answer) answer =line1.connect.line.segment(line2, true);
  else ts.assertTrue(line1.connect.line.segment(line2, true).equals(answer));
  line1 = line1.negitive();
  ts.assertTrue(line1.connect.line.segment(line2, true).equals(answer));
  line2 = line2.negitive();
  ts.assertTrue(line1.connect.line.segment(line2, true).equals(answer));
  line1 = line1.negitive();
  ts.assertTrue(line1.connect.line.segment(line2, true).equals(answer));
  return answer;
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
  ts.assertTrue(answer.equals(poly));
  shuffleLines(lines);
  poly = Polygon3D.fromLines(lines);
  ts.assertTrue(answer.equals(poly));
  shuffleLines(lines, answer, {z: 33, y:76});
  poly = Polygon3D.fromLines(lines);
  ts.assertTrue(answer.equals(poly));

  ts.success();
});


const lines = [
  new Line3D([-2,0,0],[-3,2,0]),
  new Line3D([0,1,0],[-1,0,0]),
  new Line3D([1,3,0],[1,1,0]),
  new Line3D([1,0,0],[2,0,0]),
  new Line3D([2,1,0],[2,-1,0]),
  new Line3D([3,3,0],[3,6,0]),
  new Line3D([4,4.5,0],[5,4.5,0])
];


const intPoint = [-1 -2/3, -2/3, 0];
lines[0].connections = {
  connection: new Line3D([-1 -2/3, -2/3, 0],[-1 -2/3, -2/3, 0]),
  segment: new Line3D({x: -2, y: 0, z: 0}, {x: -1.5, y: -0.5, z: 0}),
  segmentBoth: new Line3D([-1, 0, 0],[-2, 0, 0]),
  directional: new Line3D({x: -2, y: 0, z: 0}, {x: -1.5, y: -0.5, z: 0}),
  directionalBoth: new Line3D({x: -2, y: 0, z: 0}, {x: -1.5, y: -0.5, z: 0})
};
lines[1].connections = {
  connection: new Line3D([1,2,0],[1,2,0]),
  segment: new Line3D([0,1,0],[1,1,0]),
  segmentBoth: new Line3D([0,1,0],[1,1,0]),
  directional: new Line3D([0,1,0],[1,1,0]),
  directionalBoth: new Line3D([0,1,0],[1,1,0])
};

lines[2].connections = {
  connection: new Line3D([1,0,0],[1,0,0]),
  segment: new Line3D([1,1,0],[1,0,0]),
  segmentBoth: new Line3D([1,1,0],[1,0,0]),
  directional: new Line3D([1,0,0],[1,0,0]),
  directionalBoth: new Line3D([1,0,0],[1,0,0])
};

lines[3].connections = {
  connection: new Line3D([2,0,0],[2,0,0]),
  segment: new Line3D([2,0,0],[2,0,0]),
  segmentBoth: new Line3D([2,0,0],[2,0,0]),
  directional: new Line3D([2,0,0],[2,0,0]),
  directionalBoth: new Line3D([2,0,0],[2,0,0])
};

const centerLine4S = new Line3D([2,1,0],[2,-1,0]);
const centerLine4E = new Line3D([3,3,0],[3,6,0]);
lines[4].connections = {
  connection: new Line3D.Poly(centerLine4S, centerLine4E),
  segment: new Line3D.Poly(centerLine4S, centerLine4E, false, true, true),
  segmentBoth: new Line3D([2,1,0],[3,3,0]),
  directional: new Line3D.Poly(centerLine4S, centerLine4E, false, true, false, false, false),
  directionalBoth: new Line3D([2,1,0],[3,3,0])
};

const vert5S = new Vertex3D(3,4.5,0);
const vert5E = new Vertex3D(4,4.5,0);
lines[5].connections = {
  connection: new Line3D(vert5S, vert5S),
  segment:  new Line3D(vert5S, vert5S),
  segmentBoth:  new Line3D(vert5S, vert5E),
  directional:  new Line3D(vert5S, vert5S),
  directionalBoth:  new Line3D(vert5S, vert5E)
};



lines.forEach(l => l.color = String.nextColor());

const compareConnections = (conn, answer, ts) => {
  ts.assertTrue(conn.equals(answer));
  ts.assertTrue(conn.negitive().equals(answer));
  if (conn.inverse) {
    ts.assertTrue(conn.inverse().equals(answer));
    ts.assertTrue(conn.negitive().inverse().equals(answer));
  }
}

function checkConnections(line1, line2, connection, segment, segmentBoth, directional, directionalBoth, ts) {
  let color = String.nextColor()
  let conn = line1.connect.line(line2);
  let answer = connection;
  compareConnections(conn, answer, ts);
  lineSets.push({line1, line2, answer, color});

  conn = line1.connect.line.segment(line2);
  answer = segment;
  compareConnections(conn, answer, ts);
  lineSets.push({line1, line2, answer, color});

  conn = line1.connect.line.segment(line2, true);
  answer = segmentBoth;
  compareConnections(conn, answer, ts);
  lineSets.push({line1, line2, answer, color});

  conn = line1.connect.line.directional(line2);
  answer = directional;
  compareConnections(conn, answer, ts);
  lineSets.push({line1, line2, answer, color});

  conn = line1.connect.line.directional(line2, true);
  answer = directionalBoth;
  compareConnections(conn, answer, ts);
  lineSets.push({line1, line2, answer, color});
}

const lineSets = [];
const printLineSets = () => {
  console.log(lineSets.map(s => Object.values(s).filter(o => o instanceof Line3D)
            .map(l => l.toDrawString(s.color)).join('\n')).join('\n\n'));
}

Test.add('Line3D: connect (line)', (ts) => {
  const center = new Vertex3D([0,0,0]);
  const yLines = [
    new Line3D([-1, 2, 0], [1,2,0]),
    new Line3D([-1, 1, 0], [1,1,0]),
    new Line3D([-1, 0, 0], [1,0,0]),
    new Line3D([-1, -1, 0], [1,-1,0]),
    new Line3D([-1, -2, 0], [1,-2,0]),
  ];

  const xLines = [
    new Line3D([2,-1, 0], [2,1,0]),
    new Line3D([1,-1, 0], [1,1,0]),
    new Line3D([0,-1, 0], [0,1,0]),
    new Line3D([-1,-1, 0], [-1,1,0]),
    new Line3D([-2,-1, 0], [-2,1,0]),
  ];

  const both = yLines.concat(xLines);
  yLines.shuffle();xLines.shuffle();both.shuffle();
  // Line3D.radialSort(yLines, center);
  // Line3D.radialSort(xLines, center);
  // Line3D.radialSort(both, center);

  Line3D.vectorSort(yLines, null, new Vector3D(100,0, 0));
  Line3D.vectorSort(xLines, new Vector3D(1,0,0), new Vector3D(0, 100, 0));


  // console.log(lines.map(l => l.toDrawString(l.color)).join('\n'));
  //example
  var line1 = new Line3D([-1,0,0], [-1,0,1]);
  var line2 = new Line3D([0,0,0], [0,0,1]);
  let answer = shuffleCheck(line1, line2, null, ts);
  lineSets.push({line1, line2, answer, color: String.nextColor()});

  line1 = new Line3D([-1,-1,-1], [-10,-10,-10]);
  line2 = new Line3D([1,-1,-1], [10,10,10]);
  answer = new Line3D([-1,-1,-1], [1,-1,-1]);
  shuffleCheck(line1, line2, answer, ts);
  lineSets.push({line1, line2, answer, color: String.nextColor()});

  line1 = new Line3D([27.83, 31.74, -26.60], [13.43, 21.77, 46.81]);
  line2 = new Line3D([77.54, 7.53, 6.22], [26.99, 12.39, 11.18]);
  answer = shuffleCheck(line1, line2, null, ts);
  lineSets.push({line1, line2, answer, color: String.nextColor()});

  line1 = new Line3D([27.83,31.74,-26.6], [20.63,26.755,10.105]);
  answer = shuffleCheck(line1, line2, null, ts);
  lineSets.push({line1, line2, answer, color: String.nextColor()});

  for (let i = 0; i < lines.length - 1; i++) {
    const target = lines[i];
    const other = lines[i+1];
    const c = target.connections;
    checkConnections(target, other, c.connection, c.segment, c.segmentBoth, c.directional, c.directionalBoth, ts);
  }

  // printLineSets();
  ts.success();
});

printDrawString = (lines, colors) => {
  console.log(lines.map((l,i) => l.toDrawString(colors[i])).join('\n'))
}

const q1Vect = new Vector3D(1,1,1).unit();
const q2Vect = new Vector3D(1,1,-1).unit();
const q3Vect = new Vector3D(1,-1,1).unit();
const q4Vect = new Vector3D(-1,1,1).unit();
const q5Vect = new Vector3D(-1,-1,1).unit();
const q6Vect = new Vector3D(1,-1,-1).unit();
const q7Vect = new Vector3D(-1,1,-1).unit();
const q8Vect = new Vector3D(-1,-1,-1).unit();
const qVects = [q1Vect, q2Vect, q3Vect, q4Vect, q5Vect, q6Vect, q7Vect, q8Vect]

function randVert(scale, startVertex) {
  scale ||= 10;
  startVertex ||= new Vertex3D();
  let i = Math.random() - .5;
  let j = Math.random() - .5;
  let k = Math.random() - .5;
  const vector = new Vector3D(i, j, k).unit().scale(scale).add(startVertex);
  return new Vertex3D(vector);
}

function generateVerts(count, scale, startVertex) {
  count ||= 6;
  let verts = [];
  for (let index = 0; index < count; index++) {
    verts.push(randVert(scale, startVertex));
  }
  return verts;
}

function generateLines(count, startVertex, scale) {
  count ||= 6;
  let lines = [];
  for (let index = 0; index < count; index++) {
    const start = startVertex || randVert(scale, startVertex);
    const end = randVert(scale, start.clone());
    lines.push(new Line3D(start.clone(), end));
  }
  return lines;
}



const origin = new Vertex3D();
let avgLines = [];
function testVector(vector, ts) {
  const verts = generateVerts();
  const lines = [];
  for (let index = 0; index < verts.length; index++) {
    const randLen = Math.random() * 10 + 10;
    const line = Line3D.fromVector(vector.scale(randLen), verts[index]);
    const bestPole = Line3D.bestPole([line]);
    ts.assertTrue(bestPole.equals(line.startVertex));
    lines.push(line);
  }
  let vectorPole = vector.inverse();
  vectorPole = vectorPole.scale(1000);
  vectorPole = new Vertex3D(vectorPole);
  let avgLine = Line3D.averageLine(lines);
  ts.assertTrue(avgLine.vector().unit().equals(vector.unit()));

  let randomLines = generateLines(2, origin.clone());
  avgLine = Line3D.averageLine(randomLines);
  const color = String.nextColor();
  avgLines.push([randomLines[0].toDrawString(color), randomLines[1].toDrawString(color), avgLine.toDrawString(color)].join('\n'));
  ts.assertTrue(avgLine.startVertex.equals(origin));

  randomLines = generateLines(20, origin.clone());
  avgLine = Line3D.averageLine(randomLines, vectorPole);
  ts.assertTrue(avgLine.vector().dot(vector) > 0);

  randomLines = generateLines(50, origin.clone());
  avgLine = Line3D.averageLine(randomLines, vectorPole);
  ts.assertTrue(avgLine.vector().dot(vector) > 0);

  randomLines = generateLines(100);
  avgLine = Line3D.averageLine(randomLines, vectorPole);
  ts.assertTrue(avgLine.vector().dot(vector) > 0);
}
Test.add('Line3D: bestPole/averageLine', (ts) => {
  for (let index = 0; index < qVects.length; index++) {
    testVector(qVects[index], ts);
  }

  ts.success();
});






// Test.add('Line3D: bestFit', (ts) => {
//  //  const a = new Matrix([[1,2,3],
//  //                        [4,5,6]]);
//  // const b = new Matrix([[1,2],
//  //                       [3,4],
//  //                       [5,6]]);
//  //  console.log(a.multiply(b));
//
//
//   const verts = generateVerts();
//   const center = Vertex3D.center(...verts);
//   const A = new Matrix(verts.map(v => [v.x,v.y,v.z]));
//   const AA = A.transpose().multiply(A);
//   const point = new Matrix([[center.x], [center.y], [center.z]]);
//   // const a = AA.inverse().multiply(point);
//   const re = a.transpose().rowEchelon(true);
//   const rre = re.remove(null, 0).remove(null, 0).remove(null, 0).rowEchelon(true);
//   console.log(rre.toString());
//   const vector = new Vector3D(rre[0][3], rre[1][3], rre[2][3]);
//   const start = vector.inverse().add(center);
//   const end = vector.add(center);
//   const line = new Line3D(start, end);
//
//   console.log(line.toDrawString())
//   console.log(verts.join('\n'));
//   ts.success();
// });
