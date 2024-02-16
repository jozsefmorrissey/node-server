
const Test = require('../../../../public/js/utils/test/test').Test;
const Line2d = require('../../../../public/js/utils/canvas/two-d/objects/line.js');
const Vertex2d = require('../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Polygon2d = require('../../../../public/js/utils/canvas/two-d/objects/polygon.js');
const Parimeters2d = require('../../../../public/js/utils/canvas/two-d/maps/parimeters.js');


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

const parimeter = new Parimeters2d(new Polygon2d(vertices.slice(1)).lines(), 1).largest();

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
  ts.assertEquals(parimeter.area(), 13);
  parimeter.rotate(15);
  ts.assertTolerance(parimeter.area(), 13, .00000000001)
  parimeter.rotate(111.13);
  ts.assertTolerance(parimeter.area(), 13, .00000000001)
  ts.success();
});

Test.add('Line2d isolateFurthestLine', (ts) => {
  const star = [];
  const count = 10;
  const interval = 2*Math.PI/count;
  const center = new Vertex2d();
  for (let index = 0; index < count; index++) {
    star.push(Line2d.startAndTheta(center, interval * index, 10));
  }

  for (let index = 0; index < count; index++) {
    const line = star[index];
    const target = line[1];
    const neighborCount = Math.floor((count - 1) / 2);
    const neighbors = star.filter((l, i) => {
      return Math.modTolerance(i, index, count, neighborCount + .1);
    });
    const furthest = Line2d.isolateFurthestLine(target, neighbors);
    line.isLeft(furthest.midpoint());
    neighbors.forEach(l => ts.assertTrue(l[1].distance(target) <= furthest[1].distance(target)));
  }

  ts.success();
});
