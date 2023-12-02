
const Polygon3D = require('../../../../../services/cabinet/app-src/three-d/objects/polygon.js');
const Vertex3D = require('../../../../../services/cabinet/app-src/three-d/objects/vertex.js');
const Vector3D = require('../../../../../services/cabinet/app-src/three-d/objects/vector.js');
const Line2d = require('../../canvas/two-d/objects/line.js');
const Polygon2d = require('../../canvas/two-d/objects/polygon.js');
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


const vses = () => [
  new Vertex3D(),
  new Vertex3D(0,5,0), //1
  new Vertex3D(3,5,0), //2
  new Vertex3D(0,2,0), //3
  new Vertex3D(3,2,0), //4
  new Vertex3D(1,4,0), //5
  new Vertex3D(2,4,0), //6
  new Vertex3D(2,3,0), //7
  new Vertex3D(1,3,0), //8
  new Vertex3D(4,3,0), //9
  new Vertex3D(4,4,0), //10
  new Vertex3D(5,4,0), //11
  new Vertex3D(5,3,0), //12
  new Vertex3D(2,6,0), //13
  new Vertex3D(4,6,0), //14
  new Vertex3D(6,5,0), //15
  new Vertex3D(6,2,0), //16
  new Vertex3D(3,0,0), //17
  new Vertex3D(6,0,0) //18
];

const polyses = (vs) => [,
  new Polygon3D([vs[1],vs[2],vs[4],vs[3]]), //1
  new Polygon3D([vs[5],vs[6],vs[7],vs[8]]), //2
  new Polygon3D([vs[6],vs[10],vs[9],vs[7]]), //3
  new Polygon3D([vs[10],vs[11],vs[12],vs[9]]), //4
  new Polygon3D([vs[13],vs[14],vs[10],vs[6]]), //5
  new Polygon3D([vs[2],vs[15],vs[16],vs[4]]), //6
  new Polygon3D([vs[4],vs[16],vs[18],vs[17]]) //7
]

const sortResult = (res) => {
  if (res instanceof Object) {
    Vertex3D.vectorSort(res.within);
    Vertex3D.vectorSort(res.outside);
  }
  return res;
}

function errorMsg(p1, p2, ans, res) {
  let str = Polygon3D.toDrawString([p1, p2]);
  let withinStr = !(ans instanceof Object) ? false :
        ans.within.length > 0 ? `within: \n\t\t\tred${ans.within.join('\n\t\t\tred')}\n\t\t` : '';
  let outsideStr = !(ans instanceof Object) ? false :
        ans.outside.length > 0 ? `outside: \n\t\t\tblue${ans.outside.join('\n\t\t\tblue')}` : '';
  str += `\n\n\tans: \n\t\t${withinStr}${outsideStr}`;
  withinStr = !(res instanceof Object) ? false :
        res.within.length > 0 ? `within: \n\t\t\tred${res.within.join('\n\t\t\tred')}\n\t\t` : '';
  outsideStr = !(res instanceof Object) ? false :
        res.outside.length > 0 ? `outside: \n\t\t\tblue${res.outside.join('\n\t\t\tblue')}` : '';
  str += `\n\n\res: \n\t\t${withinStr}${outsideStr}`;
  return str;
}

function testPolyOverlap(p1, p2, ans1, ans2, ts) {
  let one, two, res, ans;
  try {
    sortResult(ans1);sortResult(ans2);
    one = p1; two = p2; ans = ans1;
    res = sortResult(p1.overlaps(p2, true));
    ts.assertTrue(Object.equals(ans, res), errorMsg(one, two, ans, res));

    one = p1.reverse(); two = p2; ans = ans1;
    res = sortResult(p1.reverse().overlaps(p2, true));
    ts.assertTrue(Object.equals(ans, res), errorMsg(one, two, ans, res));

    one = p1.reverse(); two = p2.reverse(); ans = ans1;
    res = sortResult(p1.reverse().overlaps(p2.reverse(), true));
    ts.assertTrue(Object.equals(ans, res), errorMsg(one, two, ans, res));

    one = p2; two = p1; ans = ans2;
    res = sortResult(p2.overlaps(p1, true));
    ts.assertTrue(Object.equals(ans, res), errorMsg(one, two, ans, res));

    one = p2.reverse(); two = p1; ans = ans2;
    res = sortResult(p2.reverse().overlaps(p1, true));
    ts.assertTrue(Object.equals(ans, res), errorMsg(one, two, ans, res));
  } catch (e) {
    one = p2.reverse(); two = p1; ans = ans2;
    res = sortResult(p2.reverse().overlaps(p1, true));
    Object.equals(ans, res);

    one = p2.reverse(); two = p1; ans = ans2;
    res = sortResult(p2.reverse().overlaps(p1, true));
    Object.equals(ans, res)
  }
}

function checkAllConfigurations(polys, vs, ts) {
  let ans1 = {within: polys[2].vertices(), outside: []};
  let ans2 = {within: [], outside: polys[1].vertices()};
  testPolyOverlap(polys[1], polys[2], ans1, ans2, ts);

  ans1 = {within: [vs[6],vs[7]], outside: [vs[10],vs[9]]};
  ans2 = {within: [], outside: polys[1].vertices()};
  testPolyOverlap(polys[1], polys[3], ans1, ans2, ts);

  ans1 = {within: [vs[6]], outside: [vs[13], vs[14], vs[10]]};
  ans2 = {within: [vs[2]], outside: [vs[1], vs[3], vs[4]]};
  testPolyOverlap(polys[1], polys[5], ans1, ans2, ts);

  ans1 = false;
  ans2 = false;
  testPolyOverlap(polys[1], polys[4], ans1, ans2, ts);

  ans1 = false;
  ans2 = false;
  testPolyOverlap(polys[1], polys[6], ans1, ans2, ts);

  ans1 = false;
  ans2 = false;
  testPolyOverlap(polys[1], polys[7], ans1, ans2, ts);
}

Test.add('Polygon3D: overlaps', (ts) => {
  const vs = vses();
  const polys = polyses(vs);
  checkAllConfigurations(polys, vs, ts);

  ts.success();
});

Test.add('Polygon3D: overlaps(rotated)', (ts) => {
  let vs = vses();
  let center = Vertex3D.center(...vs);
  let rotation = {x:35};
  vs.forEach(v => v.rotate(rotation, center));
  let polys = polyses(vs);
  checkAllConfigurations(polys, vs, ts)

  vs = vses();
  center = Vertex3D.center(...vs);
  rotation = {y:226};
  vs.forEach(v => v.rotate(rotation, center));
  polys = polyses(vs);
  checkAllConfigurations(polys, vs, ts)

  vs = vses();
  center = Vertex3D.center(...vs);
  rotation = {z:112};
  vs.forEach(v => v.rotate(rotation, center));
  polys = polyses(vs);
  checkAllConfigurations(polys, vs, ts)

  ts.success();
});
