
const Test = require('../../../../public/js/utils/test/test').Test;
const Polygon2d = require('../../app-src/two-d/objects/polygon.js');
const Line2d = require('../../app-src/two-d/objects/line.js');
const Vertex2d = require('../../app-src/two-d/objects/vertex.js');

const extraLinePoly = new Polygon2d([[0,0],[0,1],[0,2],[0,3],
                [1,3],[1,4],[0,4],[0,5],[0,6],[1,6],[2,6],[3,6],
                [3,5],[4,5],[5,4],[6,3],[5,3],[5,2],[6,2],[6,1],
                [6,0],[5,0],[4,0],[4,-1],[4,-2],[1,0]]);

const consisePoly = new Polygon2d([[0,0],[0,3],[1,3],[1,4],
                [0,4],[0,6],[3,6],[3,5],[4,5],[6,3],[5,3],[5,2],
                [6,2],[6,0],[4,0],[4,-2],[1,0]]);

const root2 = Math.sqrt(2);


// const A = new Polygon3D([[,],[,],[,],[,]])
Test.add('Line2d: consolidate',(ts) => {
  const lines = Polygon2d.lines(extraLinePoly);
  ts.assertTrue(lines.length === consisePoly.lines().length);
  ts.success();
});


Test.add('Line2d: perpendicular', (ts) => {
  let line = new Line2d({x:0,y:0}, {x:1, y:0});
  let perp = line.perpendicular(1, null, true);
  let expectedMidpoint = new Vertex2d({x: .5, y: 0});
  let expectedLine = new Line2d({x: .5, y: .5}, {x: .5, y: -.5});
  ts.assertTrue(perp.midpoint().equal(expectedMidpoint),
        `Midpoint not equal: ${perp.midpoint()} !== ${expectedMidpoint}`);
  ts.assertTrue(perp.equals(expectedLine),
        `Line not equal: ${perp} !== ${expectedLine}`);

  perp = line.perpendicular(-2, null, true);
  expectedLine = new Line2d({x: .5, y: 1}, {x: .5, y: -1});
  ts.assertTrue(perp.midpoint().equal(expectedMidpoint),
        `Midpoint not equal: ${perp.midpoint()} !== ${expectedMidpoint}`);
  ts.assertTrue(perp.equals(expectedLine),
        `Line not equal: ${perp} !== ${expectedLine}`);

  perp = line.perpendicular(1);
  expectedLine = new Line2d({x: .5, y: 0}, {x: .5, y: 1});
  expectedMidpoint = new Vertex2d({x: .5, y: .5});
  ts.assertTrue(perp.midpoint().equal(expectedMidpoint),
        `Midpoint not equal: ${perp.midpoint()} !== ${expectedMidpoint}`);
  ts.assertTrue(perp.equals(expectedLine),
        `Line not equal: ${perp} !== ${expectedLine}`);

  perp = line.perpendicular(-2);
  expectedLine = new Line2d({x: .5, y: 0}, {x: .5, y: -2});
  expectedMidpoint = new Vertex2d({x: .5, y: -1});
  ts.assertTrue(perp.midpoint().equal(expectedMidpoint),
        `Midpoint not equal: ${perp.midpoint()} !== ${expectedMidpoint}`);
  ts.assertTrue(perp.equals(expectedLine),
        `Line not equal: ${perp} !== ${expectedLine}`);

  perp = line.perpendicular(-1);
  expectedLine = new Line2d({x: .5, y: 0}, {x: .5, y: -1});
  expectedMidpoint = new Vertex2d({x: .5, y: -.5});
  ts.assertTrue(perp.midpoint().equal(expectedMidpoint),
        `Midpoint not equal: ${perp.midpoint()} !== ${expectedMidpoint}`);
  ts.assertTrue(perp.equals(expectedLine),
        `Line not equal: ${perp} !== ${expectedLine}`);

  perp = line.perpendicular(2);
  expectedLine = new Line2d({x: .5, y: 0}, {x: .5, y: 2});
  expectedMidpoint = new Vertex2d({x: .5, y: 1});
  ts.assertTrue(perp.midpoint().equal(expectedMidpoint),
        `Midpoint not equal: ${perp.midpoint()} !== ${expectedMidpoint}`);
  ts.assertTrue(perp.equals(expectedLine),
        `Line not equal: ${perp} !== ${expectedLine}`);

  line = new Line2d({x:0,y:0}, {x:2, y:2});
  perp = line.perpendicular(root2);
  expectedLine = new Line2d({x: 1, y: 1}, {x: 0, y: 2});
  expectedMidpoint = new Vertex2d({x: .5, y: 1.5});
  ts.assertTrue(perp.midpoint().equal(expectedMidpoint),
        `Midpoint not equal: ${perp.midpoint()} !== ${expectedMidpoint}`);
  ts.assertTrue(perp.equals(expectedLine),
        `Line not equal: ${perp} !== ${expectedLine}`);

  line = new Line2d({x:0,y:0}, {x:2, y:2});
  perp = line.perpendicular(-1 * root2);
  expectedLine = new Line2d({x: 1, y: 1}, {x: 2, y: 0});
  expectedMidpoint = new Vertex2d({x: 1.5, y: .5});
  ts.assertTrue(perp.midpoint().equal(expectedMidpoint),
        `Midpoint not equal: ${perp.midpoint()} !== ${expectedMidpoint}`);
  ts.assertTrue(perp.equals(expectedLine),
        `Line not equal: ${perp} !== ${expectedLine}`);

  ts.success();
});

Test.add('Line2d: parrelle', (ts) => {
  let line = new Line2d({x:0,y:0}, {x:2, y:2});
  let expectedLine = new Line2d({x: -1, y: 1}, {x: 1, y: 3});
  let expectedMidpoint = new Vertex2d({x: 0, y: 2});
  let parrelle = line.parrelle(-1 * root2);
  ts.assertTrue(parrelle.midpoint().equal(expectedMidpoint),
        `Midpoint not equal: ${parrelle.midpoint()} !== ${expectedMidpoint}`);
  ts.assertTrue(parrelle.equals(expectedLine),
        `Line not equal: ${parrelle} !== ${expectedLine}`);

  expectedLine = new Line2d({x: 1, y: -1}, {x: 3, y: 1});
  expectedMidpoint = new Vertex2d({x: 2, y: 0});
  parrelle = line.parrelle(root2);
  ts.assertTrue(parrelle.midpoint().equal(expectedMidpoint),
        `Midpoint not equal: ${parrelle.midpoint()} !== ${expectedMidpoint}`);
  ts.assertTrue(parrelle.equals(expectedLine),
        `Line not equal: ${parrelle} !== ${expectedLine}`);

  line = new Line2d({x:2, y:2}, {x:0,y:0});
  expectedLine = new Line2d({x: 1, y: 3}, {x: -1, y: 1});
  expectedMidpoint = new Vertex2d({x: 0, y: 2});
  parrelle = line.parrelle(root2);
  ts.assertTrue(parrelle.midpoint().equal(expectedMidpoint),
        `Midpoint not equal: ${parrelle.midpoint()} !== ${expectedMidpoint}`);
  ts.assertTrue(parrelle.equals(expectedLine),
        `Line not equal: ${parrelle} !== ${expectedLine}`);

  expectedLine = new Line2d({x: 3, y: 1}, {x: 1, y: -1});
  expectedMidpoint = new Vertex2d({x: 2, y: 0});
  parrelle = line.parrelle(-1 * root2);
  ts.assertTrue(parrelle.midpoint().equal(expectedMidpoint),
        `Midpoint not equal: ${parrelle.midpoint()} !== ${expectedMidpoint}`);
  ts.assertTrue(parrelle.equals(expectedLine),
        `Line not equal: ${parrelle} !== ${expectedLine}`);

  line = new Line2d({x:3,y:1}, {x:8, y:4});
  expectedMidpoint = new Vertex2d({x: -.5, y: 12.5});
  expectedLine = new Line2d({x: -3, y: 11}, {x: 2, y: 14});
  parrelle = line.parrelle(-1 * expectedMidpoint.distance(line.midpoint()));
  ts.assertTrue(parrelle.midpoint().equal(expectedMidpoint),
        `Midpoint not equal: ${parrelle.midpoint()} !== ${expectedMidpoint}`);
  ts.assertTrue(parrelle.equals(expectedLine),
        `Line not equal: ${parrelle} !== ${expectedLine}`);

  expectedMidpoint = new Vertex2d({x: 11.5, y: -7.5});
  expectedLine = new Line2d({x: 9, y: -9}, {x: 14, y: -6});
  parrelle = line.parrelle(expectedMidpoint.distance(line.midpoint()));
  ts.assertTrue(parrelle.midpoint().equal(expectedMidpoint),
        `Midpoint not equal: ${parrelle.midpoint()} !== ${expectedMidpoint}`);
  ts.assertTrue(parrelle.equals(expectedLine),
        `Line not equal: ${parrelle} !== ${expectedLine}`);

  ts.success();
});

Test.add('Line2d: trimmed', (ts) => {
  let line = new Line2d({x:0,y:0}, {x:0, y:8});

  let trimmed = line.trimmed(.5);
  let expectedLine = new Line2d({x: 0, y: .5}, {x: 0, y: 8});
  ts.assertTrue(trimmed.equals(expectedLine),
        `Line not equal: ${trimmed} !== ${expectedLine}`);

  trimmed = line.trimmed(-.5);
  expectedLine = new Line2d({x: 0, y: 0}, {x: 0, y: 7.5});
  ts.assertTrue(trimmed.equals(expectedLine),
        `Line not equal: ${trimmed} !== ${expectedLine}`);

  trimmed = line.trimmed(.5, true);
  expectedLine = new Line2d({x: 0, y: .5}, {x: 0, y: 7.5});
  ts.assertTrue(trimmed.equals(expectedLine),
        `Line not equal: ${trimmed} !== ${expectedLine}`);

  trimmed = line.trimmed(-.5, true);
  expectedLine = new Line2d({x: 0, y: .5}, {x: 0, y: 7.5});
  ts.assertTrue(trimmed.equals(expectedLine),
        `Line not equal: ${trimmed} !== ${expectedLine}`);

  line = new Line2d({x:-4,y:-8}, {x:0, y:-4});
  trimmed = line.trimmed(root2, true);
  expectedLine = new Line2d({x: -3, y: -7}, {x: -1, y: -5});
  ts.assertTrue(trimmed.equals(expectedLine),
        `Line not equal: ${trimmed} !== ${expectedLine}`);

  trimmed = line.trimmed(root2);
  expectedLine = new Line2d({x: -3, y: -7}, {x: 0, y: -4});
  ts.assertTrue(trimmed.equals(expectedLine),
        `Line not equal: ${trimmed} !== ${expectedLine}`);

  trimmed = line.trimmed(-1 * root2);
  expectedLine = new Line2d({x: -4, y: -8}, {x: -1, y: -5});
  ts.assertTrue(trimmed.equals(expectedLine),
        `Line not equal: ${trimmed} !== ${expectedLine}`);

  ts.success();
});

Test.add('Line2d: thetaBetween', (ts) => {
  let line = new Line2d({x:0,y:0}, {x:0, y:10});
  let line2 = new Line2d({x:0,y:10}, {x:10, y:20});
  let line3 = new Line2d({x:10,y:20}, {x:10, y:30})

  ts.assertEquals(Math.toDegrees(line.thetaBetween(line2)), 135);
  ts.assertEquals(Math.toDegrees(line2.thetaBetween(line3)), 225);
  ts.assertEquals(Math.toDegrees(line2.thetaBetween(line)), 225);
  ts.assertEquals(Math.toDegrees(line3.thetaBetween(line2)), 135);

  let origin = {x:3, y:22};
  line = Line2d.startAndTheta(origin, Math.toRadians(16), 10);
  line2 = Line2d.startAndTheta(origin, Math.toRadians(251), 10);
  ts.assertEquals(Math.toDegrees(line.thetaBetween(line2)), 235);
  ts.assertEquals(Math.toDegrees(line2.thetaBetween(line)), 125);

  line2 = line2.negitive();
  ts.assertEquals(Math.toDegrees(line.thetaBetween(line2)), 235);
  ts.assertEquals(Math.toDegrees(line2.thetaBetween(line)), 125);

  line = line.negitive();
  ts.assertEquals(Math.toDegrees(line.thetaBetween(line2)), 235);
  ts.assertEquals(Math.toDegrees(line2.thetaBetween(line)), 125);

  line2 = line2.negitive();
  ts.assertEquals(Math.toDegrees(line.thetaBetween(line2)), 235);
  ts.assertEquals(Math.toDegrees(line2.thetaBetween(line)), 125);

  ts.success();
});
