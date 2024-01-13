
const Test = require('../../../../public/js/utils/test/test').Test;
const Line2d = require('../../../../public/js/utils/canvas/two-d/objects/line.js');
const Vertex2d = require('../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Polygon2d = require('../../../../public/js/utils/canvas/two-d/objects/polygon.js');
const Parimeters2d = require('../../../../public/js/utils/canvas/two-d/maps/parimeters.js');


Test.add('Polygon2d getRelitiveDegree',(ts) => {
  ts.assertEquals(Parimeters2d.getRelitiveDegree(180, 180), 0);
  ts.assertEquals(Parimeters2d.getRelitiveDegree(15, 180), -165);
  ts.assertEquals(Parimeters2d.getRelitiveDegree(-15, 180), 165);
  ts.assertEquals(Parimeters2d.getRelitiveDegree(250, 180), 70);
  ts.assertEquals(Parimeters2d.getRelitiveDegree(-250, 180), -70);
  ts.assertEquals(Parimeters2d.getRelitiveDegree(270, 270), 0);
  ts.assertEquals(Parimeters2d.getRelitiveDegree(330, 270), 60);
  ts.assertEquals(Parimeters2d.getRelitiveDegree(27, 270), 117);
  ts.assertEquals(Parimeters2d.getRelitiveDegree(95, 270), -175);
  ts.assertEquals(Parimeters2d.getRelitiveDegree(45, 45), 0);
  ts.assertEquals(Parimeters2d.getRelitiveDegree(22, 45), -23);
  ts.assertEquals(Parimeters2d.getRelitiveDegree(341, 45), -64);
  ts.assertEquals(Parimeters2d.getRelitiveDegree(200, 45), 155);

  ts.assertEquals(Parimeters2d.getRelitiveDegree(299.155, 29.155), -90);
  ts.success();
});


function copyRightLeftList(list, rotation, pivot) {
  const curr = list.map(l => {
    let c = l.copy()
    c.rotate(rotation, pivot);
    c.RIGHT_SORT_INDEX = l.RIGHT_SORT_INDEX;
    return c;
  });
  return curr;
}

function testRotations(rotations, pivot, rightOleft, rootLine, originalList, ts) {
  for (let index = 0; index < rotations.length; index++) {
    const rotation = rotations[index];
    const curr = copyRightLeftList(originalList, rotation, pivot);
    curr.shuffle();
    const rotatedRoot = rootLine.copy();
    rotatedRoot.rotate(rotation, pivot);
    curr.sort(Parimeters2d.rightLeftSort(rotatedRoot.degrees(), rightOleft));
    if (rightOleft === false) curr.reverse();
    for (let i = 0; i < curr.length - 1; i++) {
      ts.assertTrue(curr[i].RIGHT_SORT_INDEX < curr[i + 1].RIGHT_SORT_INDEX);
    }
  }
}

Test.add('Polygon2d rightLeftSort',(ts) => {
  const rootLine = new Line2d([45.72, 86.36],[44.7675, 86.36]);
  const pivot = rootLine[1];
  const inLine = new Line2d([44.7675, 86.36],[43.815, 86.36])
  const pos90 = new Line2d([44.7675, 86.36],[44.7675, 84.455]);
  const neg90 = pos90.copy()
  neg90.mirrorY();
  const neg45 = inLine.bisector(pos90, 10);
  const pos45 = inLine.bisector(neg90, 10);
  const pos135 = rootLine.bisector(pos90, 10);
  const neg135 = rootLine.bisector(neg90, 10);


  const originalList = [pos135, pos90, pos45, inLine, neg45, neg90, neg135];
  originalList.forEach((l, i) => l.RIGHT_SORT_INDEX = i);
  const rotations = [0, 22.5, 137, 14, 63, 99 ,325];
  testRotations(rotations, pivot, true, rootLine, originalList, ts);
  testRotations(rotations, pivot, false, rootLine, originalList, ts);


  ts.success();
});

let lines = Line2d.fromString("[(43.815, 86.36),(43.815, 0)],[(1.905, 0),(1.905, 86.36)],[(0, 86.36),(0, 0)],[(0.9525, 10.16),(0.9525, 12.065)],[(0.9525, 84.455),(0.9525, 86.36)],[(45.72, 0),(45.72, 86.36)],[(44.7675, 10.16),(44.7675, 12.065)],[(44.7675, 84.455),(44.7675, 86.36)],[(45.72, 84.455),(0, 84.455)],[(0, 12.065),(45.72, 12.065)],[(45.72, 86.36),(0, 86.36)],[(0, 10.16),(45.72, 10.16)],[(45.72, 0),(0, 0)]");
Test.add('Polygon2d (polygons: basic)',(ts) => {
  const parimeters = new Parimeters2d(lines);

  const answer1 = new Polygon2d([[45.72, 86.36],[0, 86.36],[0, 0],[45.72, 0]]);
  ts.assertTrue(answer1.equals(parimeters.polygons()[0]));

  ts.success();
});

Test.add('Polygon2d (polygons: complex)',(ts) => {
  const flower = [];
  const center = Line2d.center(lines);
  const count = 6; // tested upto 36
  for (let i = 0; i < count; i++) {
    const rotated = lines.map(l => l.copy());
    Line2d.rotate(rotated, Math.toRadians(i * (180/count)), center);
    flower.concatInPlace(rotated);
  }

  const parimeters = new Parimeters2d(flower, true);

  const answer1 = new Polygon2d([[-25.96497693541206, 44.972659269487735],[-22.860000000000003, 43.18000000000001],[-25.964976935412054, 41.38734073051228],[-20.32, 31.609953870824143],[-20.32, 20.320000000000004],[-16.73468146102453, 20.320000000000004],[-18.527340730512265, 17.21502306458794],[-8.74995387082412, 11.570046129175878],[-3.1049769354120684, 1.7926592694877428],[0, 3.585318538975479],[0, 0],[11.289953870824126, 0],[21.06734073051227, -5.6449769354120605],[22.86, -2.5400000000000063],[24.652659269487728, -5.6449769354120605],[34.43004612917587, 0],[45.72, 0],[45.72, 3.585318538975468],[48.82497693541206, 1.7926592694877357],[54.46995387082413, 11.570046129175878],[64.24734073051226, 17.21502306458794],[62.45468146102453, 20.320000000000004],[66.03999999999999, 20.319999999999997],[66.03999999999999, 31.609953870824086],[71.68497693541207, 41.387340730512264],[68.58000000000001, 43.17999999999999],[71.68497693541205, 44.97265926948772],[66.03999999999999, 54.75004612917587],[66.03999999999999, 66.03999999999999],[62.45468146102452, 66.03999999999999],[64.24734073051226, 69.14497693541206],[54.46995387082411, 74.78995387082414],[48.82497693541207, 84.56734073051226],[45.72, 82.77468146102453],[45.72, 86.36],[34.430046129175885, 86.36],[24.652659269487728, 92.00497693541206],[22.860000000000003, 88.9],[21.06734073051227, 92.00497693541206],[11.289953870824135, 86.36],[0, 86.36],[0, 82.77468146102453],[-3.1049769354120613, 84.56734073051226],[-8.749953870824125, 74.7899538708241],[-18.527340730512265, 69.14497693541206],[-16.734681461024525, 66.03999999999999],[-20.32, 66.04],[-20.32, 54.75004612917588]]);
  ts.assertTrue(answer1.equals(parimeters.polygons()[0]));

  ts.success();
});


const spiral = Polygon2d.fromString('[(10,50),(10,10),(50,10),(50,40),(20,40),(20,15),(40,15), (40,35), (35,35), (35,20),(25,20),(25,37.5), (45,37.5),(45,12.5),(15,12.5), (15,45),(50,45), (50,50)]');
const triangle = Polygon2d.fromString('[(20,14),(15,8),(24,3),(20,14)]');
const star = Line2d.fromString('[(14,25),(16.5,20.5),(11,23),(17,23),(12.5,20.5),(14,25)]');
const innerLines = [new Line2d(new Vertex2d(40,47), new Vertex2d(40,48)),
                    new Line2d(new Vertex2d(40,25), new Vertex2d(35,25)),
                    new Line2d(new Vertex2d(40,25), new Vertex2d(35,15))]


Test.add('StarLineMap: escape',(ts) => {
  let lines = spiral.lines().concat(triangle.lines()).concat(star).concat(innerLines);
  const parimeterAns = Polygon2d.fromString(`(10, 50) => (10, 10) => (16.666666666666668, 10) => (15, 8) => (24, 3) => (21.454545454545453, 10) => (50, 10) => (50, 40) => (20, 40) => (20, 15) => (40, 15) => (40, 35) => (35, 35) => (35, 20) => (25, 20) => (25, 37.5) => (45, 37.5) => (45, 12.5) => (20.545454545454547, 12.5) => (20, 14) => (18.75, 12.5) => (15, 12.5) => (15, 21.18181818181818) => (16.5, 20.5) => (15.556603773584905, 22.198113207547173) => (17, 23) => (15.111111111111112, 23) => (15, 23.200000000000003) => (15, 45) => (50, 45) => (50, 50)`);
  const parimeters = new Parimeters2d(lines, true);
  ts.assertTrue(parimeters.polygons()[0].equals(parimeterAns), 'Use canvas buddy to isolate issue: /canvas-buddy/html/index.html\n\t\tIt seams like there is an error somewhere in the merging of groups... I would focus your investigation there.');
  ts.success();
});


Test.add('Polygon: build', (ts) => {
  const polyAns = Polygon2d.fromString('[(14,25),(16.5,20.5),(11,23),(17,23),(12.5,20.5)]');
  for (let index = 0; index < 5; index++) {
    const star = Line2d.fromString('[(14,25),(16.5,20.5),(11,23),(17,23),(12.5,20.5),(14,25)]');
    star.shuffle();
    const poly = Polygon2d.build(star);
    ts.assertTrue(poly.equals(polyAns));
  }
  ts.success();
});
