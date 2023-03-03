

const Test = require('../test.js').Test;
const EscapeMap = require('../../canvas/two-d/maps/escape');
const Vertex2d = require('../../canvas/two-d/objects/vertex');
const Line2d = require('../../canvas/two-d/objects/line');
const Polygon2d = require('../../canvas/two-d/objects/polygon');

// [new Vertex2d(10,50),new Vertex2d(10,10),new Vertex2d(50,10),new Vertex2d(50,40),new Vertex2d(20,40),new Vertex2d(20,15),new Vertex2d(40,15), new Vertex2d(40,35), new Vertex2d(35,35), new Vertex2d(35,20),new Vertex2d(25,20),new Vertex2d(25,37.5), new Vertex2d(45,37.5),new Vertex2d(45,12.5),new Vertex2d(15,12.5), new Vertex2d(15,45),new Vertex2d(50,45), new Vertex2d(50,50),new Vertex2d(10,50)]
//
// [new Vertex2d(20,14),new Vertex2d(15,8),new Vertex2d(24,3),new Vertex2d(20,14)]

const spiral = Polygon2d.fromString('[(10,50),(10,10),(50,10),(50,40),(20,40),(20,15),(40,15), (40,35), (35,35), (35,20),(25,20),(25,37.5), (45,37.5),(45,12.5),(15,12.5), (15,45),(50,45), (50,50)]');
const triangle = Polygon2d.fromString('[(20,14),(15,8),(24,3),(20,14)]');
const star = Line2d.fromString('[(14,25),(16.5,20.5),(11,23),(17,23),(12.5,20.5),(14,25)]');
const innerLines = [new Line2d(new Vertex2d(40,47), new Vertex2d(40,48)),
                    new Line2d(new Vertex2d(40,25), new Vertex2d(35,25)),
                    new Line2d(new Vertex2d(40,25), new Vertex2d(35,15))]

// star.forEach(l => l.translate(new Line2d(new Vertex2d(0,0),new Vertex2d(10,12))));

Test.add('StarLineMap: escape',(ts) => {
  // const escapeMap = new EscapeMap(spiral.lines().concat(triangle.lines()).concat(innerLines));
  let lines = spiral.lines().concat(triangle.lines()).concat(star).concat(innerLines);
  const escapeMap = new EscapeMap(lines);
  const parimeterAns = Polygon2d.fromString(`(10, 50) => (10, 10) => (16.666666666666668, 10) => (15, 8) => (24, 3) => (21.454545454545453, 10) => (50, 10) => (50, 40) => (20, 40) => (20, 15) => (40, 15) => (40, 35) => (35, 35) => (35, 20) => (25, 20) => (25, 37.5) => (45, 37.5) => (45, 12.5) => (20.545454545454547, 12.5) => (20, 14) => (18.75, 12.5) => (15, 12.5) => (15, 21.18181818181818) => (16.5, 20.5) => (15.556603773584905, 22.198113207547173) => (17, 23) => (15.111111111111112, 23) => (15, 23.200000000000003) => (15, 45) => (50, 45) => (50, 50)`);
  const parimeter = EscapeMap.parimeter(lines);
  ts.assertTrue(parimeter.equals(parimeterAns), 'Use canvas buddy to isolate issue: /canvas-buddy/html/index.html\n\t\tIt seams like there is an error somewhere in the merging of groups... I would focus your investigation there.');
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
