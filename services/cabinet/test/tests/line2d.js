
const Test = require('../../../../public/js/utils/test/test').Test;
const Line2d = require('../../app-src/two-d/objects/line.js');
const Vertex2d = require('../../app-src/two-d/objects/vertex.js');
const Polygon2d = require('../../app-src/two-d/objects/polygon.js');


const vertices = [
  null, // Didnt zero index my drawing;
  new Vertex2d(0,0), // 1
  new Vertex2d(0,1), // 2
  new Vertex2d(1,1), // 3
  new Vertex2d(2,1), // 4
  new Vertex2d(2,4), // 5
  new Vertex2d(1,4), // 6
  new Vertex2d(0,4), // 7
  new Vertex2d(0,2), // 8
  new Vertex2d(-1,2), // 9
  new Vertex2d(-1,5), // 10
  new Vertex2d(1,5), // 11
  new Vertex2d(3,5), // 12
  new Vertex2d(3,3), // 13
  new Vertex2d(3,-1), // 14
  new Vertex2d(2,-1), // 15
  new Vertex2d(2,0) // 16
];

const parimeter = new Polygon2d(vertices.slice(1));

const getLine = (index1, index2) => new Line2d(vertices[index1],vertices[index2]);
const noise = [
  getLine(1,3),
  getLine(2,16),
  getLine(3,16),
  getLine(4,16),
  getLine(16,14),
  getLine(16,13),
  getLine(13,15),
  getLine(4,13),
  getLine(13,5),
  getLine(5,12),
  // getLine(11,5),
  // getLine(6,11),
  // getLine(7,11),
  getLine(10,7),
  getLine(10,8),
  getLine(9,7)
];


Test.add('Line2d parimeter',(ts) => {
  ts.assertEquals(parimeter.area(), 13);
  ts.success();
});

Test.add('Line2d parimeterArea',(ts) => {
  let p = Polygon2d.toParimeter(parimeter.lines(), undefined, true);
  ts.assertEquals(p.area(), 13);
  ts.assertTrue(p.equal(parimeter), `Polygons do not equal: \n${p.toString()}, ${parimeter.toString()}`);
  let keepGoing = false;
  while (keepGoing) {
    noise.shuffle();
    const randNoise = noise.slice(0, Math.floor(Math.random() * noise.length));
    let lines = parimeter.lines().concat(randNoise);
    lines.shuffle();
    p = Polygon2d.toParimeter(lines);
    try {
      ts.assertEquals(p.area(), 13);
      ts.assertTrue(p.equal(parimeter), `Polygons do not equal: \n${p.toString()}, ${parimeter.toString()}`);
    } catch (e) {
      console.log('error');
      Polygon2d.toParimeter(lines, undefined, true);
      Polygon2d.toParimeter(lines, undefined, true);
    }
  }
  ts.success();
});