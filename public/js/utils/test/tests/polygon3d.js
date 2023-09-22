
const Polygon3D = require('../../../../../services/cabinet/app-src/three-d/objects/polygon.js');
const Test = require('../test.js').Test;

Test.add('Polygon3D: fromIntersections(perpendicular/connected)',async (ts) => {
  const intersected = new Polygon3D([{x:0,y:0,z:0},{x:0,y:10,z:0},{x:10,y:10,z:0},{x:10,y:0,z:0}])
  const poly1 = new Polygon3D([{x:2,y:2,z:0},{x:5,y:8,z:0},{x:5,y:8,z:10},{x:2,y:2,z:10}]);
  const poly2 = new Polygon3D([{x:5,y:8,z:-6},{x:8,y:2,z:-6},{x:8,y:2,z:6},{x:5,y:8,z:6}]);
  const poly3 = new Polygon3D([{x:2,y:2,z:-10},{x:8,y:2,z:-10},{x:8,y:2,z:0},{x:2,y:2,z:0}]);
  const intersectors = [poly1, poly2, poly3];
  const answer = new Polygon3D([{x:5,y:8,z:0},{x:8,y:2,z:0},{x:2,y:2,z:0}]);

  try {
    const poly = Polygon3D.fromIntersections(intersected, intersectors);
    ts.assertTrue(poly.equals(answer));
  } catch (e) {
    console.error('oneOff: error', e);
    const poly = Polygon3D.fromIntersections(intersected, intersectors);
    ts.assertTrue(poly.equals(answer));
  }


  ts.success();
});

Test.add('Polygon3D: fromIntersections(notConnected)',async (ts) => {
  const intersected = new Polygon3D([{x:0,y:0,z:0},{x:0,y:10,z:0},{x:10,y:10,z:0},{x:10,y:0,z:0}])
  const poly1 = new Polygon3D([{x:3,y:3,z:0},{x:4,y:7,z:0},{x:4,y:7,z:10},{x:3,y:3,z:10}]);
  const poly2 = new Polygon3D([{x:7,y:3,z:-10},{x:6,y:7,z:-10},{x:6,y:7,z:0},{x:7,y:3,z:0}]);
  const poly3 = new Polygon3D([{x:7,y:2,z:-6},{x:3,y:2,z:-6},{x:3,y:2,z:6},{x:7,y:2,z:6}]);
  const intersectors = [poly1, poly2, poly3];
  const answer = new Polygon3D([{x:4,y:7,z:0},{x:6,y:7,z:0},{x:7,y:3,z:0},{x:7,y:2,z:0},{x:3,y:2,z:0},{x:3,y:3,z:0}]);

  try {
    const poly = Polygon3D.fromIntersections(intersected, intersectors);
    ts.assertTrue(poly.equals(answer));
  } catch (e) {
    console.error('oneOff: error', e);
    const poly = Polygon3D.fromIntersections(intersected, intersectors);
    ts.assertTrue(poly.equals(answer));
  }


  ts.success();
});

Test.add('Polygon3D: fromIntersections(notPerpendicular)',async (ts) => {
  const intersected = new Polygon3D([{x:0,y:0,z:0},{x:0,y:10,z:0},{x:10,y:10,z:0},{x:10,y:0,z:0}])
  const poly1 = new Polygon3D([{x:6.5,y:4,z:-12},{x:5,y:8,z:0},{x:6.5,y:4,z:12},{x:8,y:2,z:0}]);
  const poly2 = new Polygon3D([{x:2,y:2,z:0},{x:5,y:2,z:16},{x:8,y:2,z:0},{x:5,y:2,z:-3}]);
  const poly3 = new Polygon3D([{x:3.5,y:4,z:-9},{x:5,y:8,z:0},{x:3.5,y:4,z:6},{x:2,y:2,z:0}]);
  const intersectors = [poly1, poly2, poly3];
  const answer = new Polygon3D([{x:5,y:8,z:0},{x:8,y:2,z:0},{x:2,y:2,z:0}]);

  try {
    const poly = Polygon3D.fromIntersections(intersected, intersectors);
    ts.assertTrue(poly.equals(answer));
  } catch (e) {
    console.error('oneOff: error', e);
    const poly = Polygon3D.fromIntersections(intersected, intersectors);
    ts.assertTrue(poly.equals(answer));
  }


  ts.success();
});

Test.add('Polygon3D: fromIntersections(outOfIntersectedBounds)',async (ts) => {
  const intersected = new Polygon3D([{x:0,y:0,z:0},{x:0,y:10,z:0},{x:10,y:10,z:0},{x:10,y:0,z:0}])
  const poly1 = new Polygon3D([{x:2,y:2,z:0},{x:5,y:8,z:0},{x:5,y:8,z:10},{x:3.5,y:4,z:13},{x:2,y:2,z:10}]);
  const poly2 = new Polygon3D([{x:5,y:8,z:-6},{x:8,y:2,z:-6},{x:8,y:2,z:6},{x:6.5,y:4,z:8},{x:5,y:8,z:6}]);
  const poly3 = new Polygon3D([{x:2,y:2,z:-10},{x:5,y:2,z:-13},{x:8,y:2,z:-10},{x:8,y:2,z:0},{x:2,y:2,z:0}]);
  const intersectors = [poly1, poly2, poly3];
  const answer = new Polygon3D([{x:5,y:8,z:0},{x:8,y:2,z:0},{x:2,y:2,z:0}]);

  try {
    const poly = Polygon3D.fromIntersections(intersected, intersectors);
    ts.assertTrue(poly.equals(answer));
  } catch (e) {
    console.error('oneOff: error', e);
    const poly = Polygon3D.fromIntersections(intersected, intersectors);
    ts.assertTrue(poly.equals(answer));
  }

  ts.success();
});
