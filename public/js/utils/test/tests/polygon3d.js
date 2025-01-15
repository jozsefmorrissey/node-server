
const Parimeter3D = require('../../../../../services/cabinet/app-src/three-d/objects/parimeter.js');
const LinePolys = require('../../../../../services/cabinet/app-src/three-d/objects/maps/line-polys.js');
const Polygon3D = require('../../../../../services/cabinet/app-src/three-d/objects/polygon.js');
const Excavated3D = require('../../../../../services/cabinet/app-src/three-d/objects/excavated.js');
const Layer = require('../../../../../services/cabinet/app-src/three-d/objects/layer.js');
const Vertex3D = require('../../../../../services/cabinet/app-src/three-d/objects/vertex.js');
const Line3D = require('../../../../../services/cabinet/app-src/three-d/objects/line.js');
const Vector3D = require('../../../../../services/cabinet/app-src/three-d/objects/vector.js');
const Line2d = require('../../canvas/two-d/objects/line.js');
const Polygon2d = require('../../canvas/two-d/objects/polygon.js');
const Test = require('../test.js').Test;

Test.add('Polygon3D: connections', ts => {
  const str1 = 'red[(0,71.279,-66.04),(53.34,71.279,0),(53.34,10.16,0),(0,10.16,-66.04)]';
  const str2 = 'red[(0,86.36,-66.04),(53.34,86.36,0),(53.34,71.279,0),(0,71.279,-66.04)]';
  const str3 = 'blue[(51.801,86.36,-0.953),(60.96,86.36,-0.953),(60.96,0,-0.953),(51.801,0,-0.953)]';

  const poly1 = Polygon3D.fromCSG(CSG.fromString(str1))[0];
  const poly2 = Polygon3D.fromCSG(CSG.fromString(str2))[0];
  const poly3 = Polygon3D.fromCSG(CSG.fromString(str3))[0];

  const red = [poly1,poly2];
  const blue = [poly3];

  // console.log(red.map(p => p.toDrawString('red')).concat(blue.map(p=>p.toDrawString('blue'))).join('\n\n'));
  red.forEach(rp => blue.forEach(bp => {
    const planeInt = rp.toPlane().intersection(bp.toPlane());
    ts.assertTrue(planeInt instanceof Line3D);
    console.log(rp.intersection(bp));
    const polyInt = rp.intersection(bp);
    ts.assertTrue(polyInt instanceof Line3D);
  }));
  ts.success();
});

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

const poly = new Polygon3D([{x:1,y:1,z:0},{x:1,y:-1,z:0},{x:-1,y:-1,z:0},{x:-1,y:1,z:0}]);
function testResize(w, h, ts) {
  const answer = new Polygon3D([{x:w/2,y:h/2,z:0},{x:w/2,y:-h/2,z:0},{x:-w/2,y:-h/2,z:0},{x:-w/2,y:h/2,z:0}]);
  resize = poly.resize(w,h,true);
  ts.assertTrue(resize.equals(answer));
  ts.assertTrue(Object.equals(resize.demensions(), {x:w, y:h, z:0}));
  resize.normals.swap();
  ts.assertTrue(Object.equals(resize.demensions(), {x:h, y:w, z:0}));
  resize.rotate({x:45});
  ts.assertTrue(Object.equals(resize.demensions(), {x:h, y:w, z:0}));
}

Test.add('Polygon3D: resize',async (ts) => {
  testResize(2,2, ts);
  testResize(4,4, ts);
  testResize(11,17, ts);
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

Test.add('Polygon3D irregular.concave.fill', ts => {
  const star = new Polygon3D([[0,2,0],[.5,1,0],[2,1,0],[.5,.5,0],[1,-.5,0],[0,0,0],[-1,-.5,0],[-.5,.5,0],[-2,1,0],[-.5,1,0]]);
  star.concaveLocations.fill();
  ts.assertTrue(star.equals(new Polygon3D([[0,2,0], [2,1,0], [1,-0.5,0], [-1,-0.5,0], [-2,-1,0]])));
  ts.success();
});

Test.add('Polygon3D crissCrossLocations', ts => {
  const crissCross = new Polygon3D([[-1,1,0],[1,3,0],[-1,3,0],[1,1,0],[2,1,0],[2,-1,0],[1,-1,0],[-1,-2,0],[1,-2,0],[-1,-1,0],[-2,1,0],[-2,-1,0]]);
  console.log(crissCross.irregular.crissCross.locations());
  console.log(crissCross.lines().map(v => v.toDrawString()).join('\n'));
  crissCross.irregular.crissCross.fill();
  console.log(crissCross.lines().map(v => v.toDrawString()).join('\n'));
  ts.success();
});

const printConnections = (conns) => console.log(conns.map((c,i)=>
            `//${i}\n${c.layer.toDrawString()}\n` +
            `${c.connection.toDrawString('red')}\n` +
            `${c.target.toDrawString()}`).join('\n\n'));
Test.add('Layer: connections', ts => {
  const layers = Layer.fromPolygons(complexPolyList);
  const originConnections = [];
  layers.forEach(layer => {
    const target = new Vertex3D();
    const connection = layer.connect(target);
    originConnections.push({layer, target, connection});
  });

  printConnections(originConnections);
  const lineConnections = [];
  layers.forEach(layer => {
    const target = new Line3D([-20,-20,-20], [20,20,20]);
    const connection = layer.connect(target);
    lineConnections.push({layer, target, connection});
  });


  const target = layers[0].translate(new Vector3D(28,12,33));
  target.rotate({x:47,y:10,z:0});
  const layerConnections = [];
  layers.forEach(layer => {
    const connection = layer.connect(target);
    layerConnections.push({layer, target, connection});
  });
  printConnections(layerConnections);
});

const buildClock = (degrees, length, rotation, translation) => {
  const its = 360/degrees;
  const line = new Line3D([0,0,0], [length,0,0]);
  const lines = [];
  for (let index = 0; index < its; index++) {
    lines.push(line.clone());
    line.rotate({z: degrees}, lines[0][0]);
  }
  if (rotation) lines.forEach(l => l.rotate(rotation, new Vertex3D()));
  if (translation) lines.forEach(l => l.translate(translation));
  lines.normal = Vector3D.k.rotate(rotation);
  return lines;
}

Test.add('Line3D: quadrantSort', (ts) => {
  const degrees = 10;
  const clockLines = Array.fill(Math.ceil(360/degrees), ()=>[]);
  clockLines.targets = [];
  const spinAndMoveClock = (lines, ccw) => {
    lines.shuffle();
    const target = lines[Math.floor(Math.random() * lines.length)].negitive();
    clockLines.targets.push(target);

    Line3D.quadrantSort(lines, target, lines.normal, ccw);
    lines.forEach((l,i) => clockLines[i].push(l));
  }

  spinAndMoveClock(buildClock(degrees, 30, {x:120}, new Vector3D(22,15,3)));
  spinAndMoveClock(buildClock(degrees, 30, {y:172}, new Vector3D(2,150,33)));
  spinAndMoveClock(buildClock(degrees, 30, {z:57}, new Vector3D(100,43,22)));
  spinAndMoveClock(buildClock(degrees, 30, {x:120,y:44}, new Vector3D(27,112,113)), true);
  spinAndMoveClock(buildClock(degrees, 30, {y:172,z:14}, new Vector3D(32,86,64)), true);
  spinAndMoveClock(buildClock(degrees, 30, {x:27,z:57}, new Vector3D(75,64,40)), true);
  console.log(clockLines.targets.map(l => l.toDrawString('green')).join('\n') + '\n\n' +
      clockLines.map((list, i) => `//${i}\n` + list.map((l, i) => l.toDrawString()).join('\n')).join('\n\n'));
  ts.failed('no tests exist: implement manual validation in Test');
});

const buildWeb = (excludeMap, degrees, length, rotation, translation) => {
  const lines = [];
  const clockLines = buildClock(degrees, length, rotation, translation);
  const verts = Line3D.vertices(clockLines).unique(v=>v.toString());
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      const line = new Line3D(verts[i].clone(), verts[j].clone());
      line.directional(false, true);
      if (!excludeMap[line.toDrawString()]) lines.push(line);
    }
  }
  lines.normal = clockLines.normal;
  return lines;
}

Test.add('Parimeter3D', (ts) => {
  const checkParimeter = (exclude, degrees, length, rotation, translation) => {
  const excludeMap = {}
  exclude.forEach(l => (excludeMap[l.toDrawString()] = true) && (excludeMap[l.negitive().toDrawString()] = true));
  const lines = buildWeb(excludeMap, degrees, length);
  // lines.concatInPlace(buildWeb(excludeMap, degrees, length, {z:5}, {x:length*2, y:length*2, z:length*2}));
  // lines.concatInPlace(buildWeb(excludeMap, degrees, length, {z:-5}, {x:length*-2, y:length*-2, z:length*-2}));
  const start = new Date().getTime();
  const polys = new Parimeter3D(lines.unique(l => l.toString()), lines.normal);
  const time = new Date().getTime() - start;
  console.log(time/1000);
  const polyLines = polys.map(p => p.lines()).elements();
  console.log(polys.map(p => p.lines().map(l => l.toDrawString('green')).join('\n')).join('\n\n') + '\n\n' +
                lines.filter(l => !polyLines.find(l2=>l.equivalent(l2) === true)).map(l=>l.toDrawString()).join('\n'));
}

  let exclude = [new Line3D([-38.64,-10.35,0], [-34.64,-20,0]),new Line3D([-34.64,-20,0], [-28.28,-28.28,0]),new Line3D([-28.28,-28.28,0], [-20,-34.64,0]),new Line3D([-20,-34.64,0], [-10.35,-38.64,0]),new Line3D([-10.35,-38.64,0], [0,-40,0]),new Line3D([0,-40,0], [10.35,-38.64,0]),new Line3D([10.35,-38.64,0], [20,-34.64,0]),new Line3D([20,-34.64,0], [28.28,-28.28,0]),new Line3D([28.28,-28.28,0], [34.64,-20,0]),new Line3D([34.64,-20,0], [38.64,-10.35,0]),new Line3D([38.64,-10.35,0], [40,0,0]),new Line3D([40,0,0], [38.64,10.35,0]),new Line3D([38.64,10.35,0], [34.64,20,0]),new Line3D([34.64,20,0], [28.28,28.28,0]),new Line3D([28.28,28.28,0], [20,34.64,0]),new Line3D([20,34.64,0], [10.35,38.64,0]),new Line3D([10.35,38.64,0], [0,40,0]),new Line3D([0,40,0], [-10.35,38.64,0]),new Line3D([-10.35,38.64,0], [-20,34.64,0]),new Line3D([-20,34.64,0], [-28.28,28.28,0]),new Line3D([-28.28,28.28,0], [-34.64,20,0]),new Line3D([-34.64,20,0], [-38.64,10.35,0]),new Line3D([-38.64,10.35,0], [-40,0,0]),new Line3D([-40,0,0], [-38.64,-10.35,0])];
  // checkParimeter(exclude, 20, 40, {z: 90});

  exclude.concatInPlace([new Line3D([40,0,0], [37.59,-13.68,0]),new Line3D([37.59,13.68,0], [-30.64,25.71,0]),new Line3D([37.59,13.68,0], [-37.59,13.68,0]),new Line3D([0,0,0], [40,0,0]),new Line3D([-37.59,-13.68,0], [37.59,13.68,0]),new Line3D([0,0,0], [30.64,25.71,0]),new Line3D([0,0,0], [6.95,39.39,0]),new Line3D([40,0,0], [-40,0,0]),new Line3D([0,0,0], [6.95,-39.39,0]),new Line3D([0,0,0], [20,-34.64,0]),new Line3D([0,0,0], [30.64,-25.71,0]),new Line3D([0,0,0], [37.59,-13.68,0]),new Line3D([40,0,0], [6.95,-39.39,0]),new Line3D([40,0,0], [20,-34.64,0]),new Line3D([40,0,0], [30.64,-25.71,0]),new Line3D([37.59,13.68,0], [20,34.64,0]),new Line3D([37.59,13.68,0], [6.95,39.39,0]),new Line3D([37.59,13.68,0], [-6.95,39.39,0]),new Line3D([37.59,13.68,0], [-20,34.64,0]),new Line3D([30.64,-25.71,0], [37.59,-13.68,0]),new Line3D([37.59,-13.68,0], [40,0,0]),new Line3D([40,0,0], [37.59,13.68,0]),new Line3D([37.59,13.68,0], [30.64,25.71,0]),new Line3D([30.64,25.71,0], [20,34.64,0]),new Line3D([20,34.64,0], [6.95,39.39,0]),new Line3D([6.95,39.39,0], [-6.95,39.39,0]),new Line3D([-6.95,39.39,0], [-20,34.64,0]),new Line3D([-20,34.64,0], [-30.64,25.71,0]),new Line3D([-30.64,25.71,0], [-37.59,13.68,0]),new Line3D([-37.59,13.68,0], [-40,0,0]),new Line3D([-40,0,0], [-37.59,-13.68,0]),new Line3D([-37.59,-13.68,0], [-30.64,-25.71,0]),new Line3D([-30.64,-25.71,0], [-20,-34.64,0]),new Line3D([-20,-34.64,0], [-6.95,-39.39,0]),new Line3D([-6.95,-39.39,0], [6.95,-39.39,0]),new Line3D([6.95,-39.39,0], [20,-34.64,0]),new Line3D([20,-34.64,0], [30.64,-25.71,0]),new Line3D([0,0,0], [20,34.64,0]),new Line3D([-6.95,-39.39,0], [6.95,39.39,0]),new Line3D([0,0,0], [-6.95,39.39,0]),new Line3D([0,0,0], [-20,34.64,0]),new Line3D([0,0,0], [-30.64,25.71,0]),new Line3D([0,0,0], [-37.59,13.68,0]),new Line3D([40,0,0], [-40,0,0]),new Line3D([0,0,0], [-37.59,-13.68,0]),new Line3D([0,0,0], [-30.64,-25.71,0]),new Line3D([0,0,0], [-20,-34.64,0]),new Line3D([0,0,0], [-6.95,-39.39,0]),new Line3D([-6.95,39.39,0], [6.95,-39.39,0]),new Line3D([-20,34.64,0], [20,-34.64,0]),new Line3D([-30.64,25.71,0], [30.64,-25.71,0]),new Line3D([-37.59,13.68,0], [37.59,-13.68,0]),new Line3D([40,0,0], [30.64,25.71,0]),new Line3D([40,0,0], [20,34.64,0]),new Line3D([40,0,0], [6.95,39.39,0]),new Line3D([40,0,0], [-6.95,39.39,0]),new Line3D([40,0,0], [-20,34.64,0]),new Line3D([40,0,0], [-30.64,25.71,0]),new Line3D([40,0,0], [-37.59,13.68,0]),new Line3D([40,0,0], [-40,0,0]),new Line3D([40,0,0], [-37.59,-13.68,0]),new Line3D([40,0,0], [-30.64,-25.71,0]),new Line3D([40,0,0], [-20,-34.64,0]),new Line3D([40,0,0], [-6.95,-39.39,0]),new Line3D([37.59,13.68,0], [30.64,-25.71,0]),new Line3D([37.59,13.68,0], [37.59,-13.68,0]),new Line3D([30.64,25.71,0], [6.95,39.39,0]),new Line3D([30.64,25.71,0], [-6.95,39.39,0]),new Line3D([30.64,25.71,0], [-20,34.64,0]),new Line3D([30.64,25.71,0], [-30.64,25.71,0]),new Line3D([30.64,25.71,0], [-37.59,13.68,0]),new Line3D([30.64,25.71,0], [-40,0,0]),new Line3D([30.64,25.71,0], [-37.59,-13.68,0]),new Line3D([30.64,25.71,0], [-30.64,-25.71,0]),new Line3D([30.64,25.71,0], [-20,-34.64,0]),new Line3D([30.64,25.71,0], [-6.95,-39.39,0]),new Line3D([30.64,25.71,0], [6.95,-39.39,0]),new Line3D([30.64,25.71,0], [20,-34.64,0]),new Line3D([30.64,25.71,0], [30.64,-25.71,0]),new Line3D([30.64,25.71,0], [37.59,-13.68,0]),new Line3D([20,34.64,0], [-6.95,39.39,0]),new Line3D([20,34.64,0], [-20,34.64,0]),new Line3D([20,34.64,0], [20,-34.64,0]),new Line3D([20,34.64,0], [30.64,-25.71,0]),new Line3D([20,34.64,0], [37.59,-13.68,0]),new Line3D([6.95,39.39,0], [-20,34.64,0]),new Line3D([6.95,39.39,0], [-30.64,25.71,0]),new Line3D([6.95,39.39,0], [-37.59,13.68,0]),new Line3D([6.95,39.39,0], [-40,0,0]),new Line3D([6.95,39.39,0], [-37.59,-13.68,0]),new Line3D([6.95,39.39,0], [-30.64,-25.71,0]),new Line3D([6.95,39.39,0], [-20,-34.64,0]),new Line3D([6.95,39.39,0], [-6.95,-39.39,0]),new Line3D([6.95,39.39,0], [6.95,-39.39,0]),new Line3D([6.95,39.39,0], [20,-34.64,0]),new Line3D([6.95,39.39,0], [30.64,-25.71,0]),new Line3D([6.95,39.39,0], [37.59,-13.68,0]),new Line3D([-6.95,39.39,0], [-30.64,25.71,0]),new Line3D([-6.95,39.39,0], [-37.59,13.68,0]),new Line3D([-6.95,39.39,0], [-40,0,0]),new Line3D([-20,-34.64,0], [20,-34.64,0]),new Line3D([-20,-34.64,0], [30.64,-25.71,0]),new Line3D([-20,-34.64,0], [37.59,-13.68,0]),new Line3D([-6.95,-39.39,0], [20,-34.64,0]),new Line3D([-6.95,-39.39,0], [30.64,-25.71,0]),new Line3D([-6.95,-39.39,0], [37.59,-13.68,0]),new Line3D([6.95,-39.39,0], [30.64,-25.71,0]),new Line3D([6.95,-39.39,0], [37.59,-13.68,0]),new Line3D([20,-34.64,0], [37.59,-13.68,0])]);
  checkParimeter(exclude, 20, 40, {z: 90});

});

Test.add('Excavated: regular', ts => {
  const landscape = Polygon3D.fromCSG(CSG.fromString('[(1.27,1.27,-24.765),(97.79,1.27,-24.765),(97.79,121.92,-24.765),(1.27,121.92,-24.765)]').polygons)[0];
  const center = landscape.scale(.2, null, true);
  const topLeft = center.translate({x:25,y:25,z:0});
  const bottomRight = center.translate({x:-15,y:-15,z:0});
  const topRight = center.translate({x:-25,y:25,z:0});
  const bottomLeft = center.translate({x:15,y:-15,z:0});
  const excavations = [center, topLeft, bottomRight, topRight, bottomLeft];
  const excavated = new Excavated3D(landscape.vertices(), excavations);
  const grid = excavated.grid();
  const polys = new LinePolys(grid);
  console.log(polys.filter((poly) => !excavations.find(e => poly.isWithin(e.center()))).map(p => p.toDrawString(Color.next(), true)).join('\n'))
  console.log(Line3D.removeIntersecting(grid, true));
});

Test.add('Layer: lines', ts => {
  const layer = Layer.fromCSG(shatteredScarFaceCSG)[0];
  const start = new Date().getTime();
  const lines = layer.lines();
  console.log((new Date().getTime() - start)/1000);
  console.log(lines.map(l => l.toDrawString('blue')).join('\n'))
});


Test.add('Layer: parimeter', ts => {
  const layers = Layer.fromPolygons(complexPolyList);
  const layerStrs = [];
  layers.forEach(l => layerStrs.push(`${l.toDrawString()}\n` + l.parimeter().map(p => p.lines().map(l => l.toDrawString()).join('\n')).join('\n')));
  console.log(layerStrs.map((str, i) => `//${i}\n${str}`).join('\n\n'));
});

Test.add('Polygon3D: area', ts => {
  const poly = complexPolyList[0].copy();
  poly.rotate({x:55});
  const area = poly.area();
});

// Test.add('async not returning', ts => {
//   let simplified = Polygon3D.merge(complexPolyList);
//   console.log(Polygon3D.toDrawString(simplified));
// });
//
//
//
const complexPolyList = [
  new Polygon3D([[32.2,12.1,-11.4],[54.9,12.1,-11.4],[54.9,12.1,-59.1],[32.2,12.1,-59.1]]),
  new Polygon3D([[32.2,12.1,0],[54.9,12.1,0],[54.9,12.1,-10.2],[32.2,12.1,-10.2]]),
  new Polygon3D([[32.2,12.1,-10.2],[54.9,12.1,-10.2],[54.9,12.1,-11.4],[32.2,12.1,-11.4]]),
  new Polygon3D([[8.5,12.1,-11.4],[30.3,12.1,-11.4],[30.3,12.1,-59.1],[8.5,12.1,-59.1]]),
  new Polygon3D([[8.5,12.1,0],[30.3,12.1,0],[30.3,12.1,-10.2],[8.5,12.1,-10.2]]),
  new Polygon3D([[8.5,12.1,-10.2],[30.3,12.1,-10.2],[30.3,12.1,-11.4],[8.5,12.1,-11.4]]),
  new Polygon3D([[6.6,12.1,-11.4],[6.6,12.1,-59.1],[1,12.1,-59.1],[1,12.1,-11.4]]),
  new Polygon3D([[6.6,12.1,0],[6.6,12.1,-10.2],[1,12.1,-10.2],[1,12.1,0]]),
  new Polygon3D([[6.6,12.1,-10.2],[6.6,12.1,-11.4],[1,12.1,-11.4],[1,12.1,-10.2]]),
  new Polygon3D([[32.2,10.2,-11.4],[32.2,10.2,-59.1],[54.9,10.2,-59.1],[54.9,10.2,-11.4]]),
  new Polygon3D([[32.2,10.2,0],[32.2,10.2,-10.2],[54.9,10.2,-10.2],[54.9,10.2,0]]),
  new Polygon3D([[54,10.2,-10.2],[54,10.2,-11.4],[54.9,10.2,-11.4],[54.9,10.2,-10.2]]),
  new Polygon3D([[30.3,10.2,-11.4],[8.5,10.2,-11.4],[8.5,10.2,-59.1],[30.3,10.2,-59.1]]),
  new Polygon3D([[30.3,10.2,0],[8.5,10.2,0],[8.5,10.2,-10.2],[30.3,10.2,-10.2]]),
  new Polygon3D([[6.6,10.2,-11.4],[1,10.2,-11.4],[1,10.2,-59.1],[6.6,10.2,-59.1]]),
  new Polygon3D([[6.6,10.2,0],[1,10.2,0],[1,10.2,-10.2],[6.6,10.2,-10.2]]),
  new Polygon3D([[1.9,10.2,-10.2],[1,10.2,-10.2],[1,10.2,-11.4],[1.9,10.2,-11.4]]),
  new Polygon3D([[8.5,10.2,-11.4],[6.6,10.2,-11.4],[6.6,10.2,-59.1],[8.5,10.2,-59.1]]),
  new Polygon3D([[8.5,10.2,0],[6.6,10.2,0],[6.6,10.2,-10.2],[8.5,10.2,-10.2]]),
  new Polygon3D([[32.2,10.2,-11.4],[30.3,10.2,-11.4],[30.3,10.2,-59.1],[32.2,10.2,-59.1]]),
  new Polygon3D([[32.2,10.2,0],[30.3,10.2,0],[30.3,10.2,-10.2],[32.2,10.2,-10.2]]),
  new Polygon3D([[54.9,10.2,-11.4],[54.9,10.2,-59.1],[54.9,12.1,-59.1],[54.9,12.1,-11.4]]),
  new Polygon3D([[54.9,10.2,0],[54.9,10.2,-10.2],[54.9,12.1,-10.2],[54.9,12.1,0]]),
  new Polygon3D([[54.9,11.1,-10.2],[54.9,11.1,-11.4],[54.9,12.1,-11.4],[54.9,12.1,-10.2]]),
  new Polygon3D([[54.9,11.1,-10.2],[54.9,10.2,-10.2],[54.9,10.2,-11.4],[54.9,11.1,-11.4]]),
  new Polygon3D([[54.9,10.2,-59.1],[32.2,10.2,-59.1],[32.2,12.1,-59.1],[54.9,12.1,-59.1]]),
  new Polygon3D([[30.3,10.2,-59.1],[8.5,10.2,-59.1],[8.5,12.1,-59.1],[30.3,12.1,-59.1]]),
  new Polygon3D([[6.6,10.2,-59.1],[1,10.2,-59.1],[1,12.1,-59.1],[6.6,12.1,-59.1]]),
  new Polygon3D([[8.5,11.4,-59.1],[8.5,10.2,-59.1],[6.6,10.2,-59.1],[6.6,11.4,-59.1]]),
  new Polygon3D([[32.2,11.4,-59.1],[32.2,10.2,-59.1],[30.3,10.2,-59.1],[30.3,11.4,-59.1]]),
  new Polygon3D([[1,10.2,-59.1],[1,10.2,-11.4],[1,12.1,-11.4],[1,12.1,-59.1]]),
  new Polygon3D([[1,10.2,-10.2],[1,10.2,0],[1,12.1,0],[1,12.1,-10.2]]),
  new Polygon3D([[1,11.1,-11.4],[1,11.1,-10.2],[1,12.1,-10.2],[1,12.1,-11.4]]),
  new Polygon3D([[1,11.1,-11.4],[1,10.2,-11.4],[1,10.2,-10.2],[1,11.1,-10.2]]),
  new Polygon3D([[32.2,10.2,0],[54.9,10.2,0],[54.9,12.1,0],[32.2,12.1,0]]),
  new Polygon3D([[8.5,10.2,0],[30.3,10.2,0],[30.3,12.1,0],[8.5,12.1,0]]),
  new Polygon3D([[1,10.2,0],[6.6,10.2,0],[6.6,12.1,0],[1,12.1,0]]),
  new Polygon3D([[6.6,11.4,0],[6.6,10.2,0],[8.5,10.2,0],[8.5,11.4,0]]),
  new Polygon3D([[30.3,11.4,0],[30.3,10.2,0],[32.2,10.2,0],[32.2,11.4,0]]),
  new Polygon3D([[32.2,10.2,-11.4],[54,10.2,-11.4],[54,11.1,-11.4],[32.2,11.1,-11.4]]),
  new Polygon3D([[8.5,10.2,-11.4],[30.3,10.2,-11.4],[30.3,11.1,-11.4],[8.5,11.1,-11.4]]),
  new Polygon3D([[6.6,10.2,-11.4],[6.6,11.1,-11.4],[1.9,11.1,-11.4],[1.9,10.2,-11.4]]),
  new Polygon3D([[6.6,10.2,-11.4],[8.5,10.2,-11.4],[8.5,11.1,-11.4],[6.6,11.1,-11.4]]),
  new Polygon3D([[30.3,10.2,-11.4],[32.2,10.2,-11.4],[32.2,11.1,-11.4],[30.3,11.1,-11.4]]),
  new Polygon3D([[54,10.2,-10.2],[32.2,10.2,-10.2],[32.2,11.1,-10.2],[54,11.1,-10.2]]),
  new Polygon3D([[30.3,10.2,-10.2],[8.5,10.2,-10.2],[8.5,11.1,-10.2],[30.3,11.1,-10.2]]),
  new Polygon3D([[6.6,10.2,-10.2],[1.9,10.2,-10.2],[1.9,11.1,-10.2],[6.6,11.1,-10.2]]),
  new Polygon3D([[8.5,10.2,-10.2],[6.6,10.2,-10.2],[6.6,11.1,-10.2],[8.5,11.1,-10.2]]),
  new Polygon3D([[32.2,10.2,-10.2],[30.3,10.2,-10.2],[30.3,11.1,-10.2],[32.2,11.1,-10.2]]),
  new Polygon3D([[54,11.1,-10.2],[32.2,11.1,-10.2],[32.2,11.1,-11.4],[54,11.1,-11.4]]),
  new Polygon3D([[30.3,11.1,-10.2],[8.5,11.1,-10.2],[8.5,11.1,-11.4],[30.3,11.1,-11.4]]),
  new Polygon3D([[6.6,11.1,-10.2],[1.9,11.1,-10.2],[1.9,11.1,-11.4],[6.6,11.1,-11.4]]),
  new Polygon3D([[8.5,11.1,-10.2],[6.6,11.1,-10.2],[6.6,11.1,-11.4],[8.5,11.1,-11.4]]),
  new Polygon3D([[32.2,11.1,-10.2],[30.3,11.1,-10.2],[30.3,11.1,-11.4],[32.2,11.1,-11.4]]),
  new Polygon3D([[1.9,10.2,-10.2],[1.9,10.2,-11.4],[1.9,11.1,-11.4],[1.9,11.1,-10.2]]),
  new Polygon3D([[54,11.1,-11.4],[54,10.2,-11.4],[54,10.2,-10.2],[54,11.1,-10.2]]),
  new Polygon3D([[8.5,12.1,-10.2],[8.5,12.1,-11.4],[8.5,11.4,-11.4],[8.5,11.4,-10.2]]),
  new Polygon3D([[6.6,12.1,-11.4],[6.6,12.1,-10.2],[6.6,11.4,-10.2],[6.6,11.4,-11.4]]),
  new Polygon3D([[6.6,11.4,-11.4],[6.6,11.4,-10.2],[8.5,11.4,-10.2],[8.5,11.4,-11.4]]),
  new Polygon3D([[32.2,12.1,-10.2],[32.2,12.1,-11.4],[32.2,11.4,-11.4],[32.2,11.4,-10.2]]),
  new Polygon3D([[30.3,12.1,-11.4],[30.3,12.1,-10.2],[30.3,11.4,-10.2],[30.3,11.4,-11.4]]),
  new Polygon3D([[30.3,11.4,-11.4],[30.3,11.4,-10.2],[32.2,11.4,-10.2],[32.2,11.4,-11.4]]),
  new Polygon3D([[8.5,12.1,-10.2],[8.5,11.4,-10.2],[8.5,11.4,0],[8.5,12.1,0]]),
  new Polygon3D([[6.6,12.1,-10.2],[6.6,12.1,0],[6.6,11.4,0],[6.6,11.4,-10.2]]),
  new Polygon3D([[6.6,11.4,-10.2],[6.6,11.4,0],[8.5,11.4,0],[8.5,11.4,-10.2]]),
  new Polygon3D([[32.2,12.1,-10.2],[32.2,11.4,-10.2],[32.2,11.4,0],[32.2,12.1,0]]),
  new Polygon3D([[30.3,12.1,-10.2],[30.3,12.1,0],[30.3,11.4,0],[30.3,11.4,-10.2]]),
  new Polygon3D([[30.3,11.4,-10.2],[30.3,11.4,0],[32.2,11.4,0],[32.2,11.4,-10.2]]),
  new Polygon3D([[8.5,12.1,-11.4],[8.5,12.1,-59.1],[8.5,11.4,-59.1],[8.5,11.4,-11.4]]),
  new Polygon3D([[6.6,12.1,-11.4],[6.6,11.4,-11.4],[6.6,11.4,-59.1],[6.6,12.1,-59.1]]),
  new Polygon3D([[6.6,11.4,-59.1],[6.6,11.4,-11.4],[8.5,11.4,-11.4],[8.5,11.4,-59.1]]),
  new Polygon3D([[32.2,12.1,-11.4],[32.2,12.1,-59.1],[32.2,11.4,-59.1],[32.2,11.4,-11.4]]),
  new Polygon3D([[30.3,12.1,-11.4],[30.3,11.4,-11.4],[30.3,11.4,-59.1],[30.3,12.1,-59.1]]),
  new Polygon3D([[30.3,11.4,-59.1],[30.3,11.4,-11.4],[32.2,11.4,-11.4],[32.2,11.4,-59.1]])
]

const scarFaceCSG = CSG.fromString(`blue[(1.27,1.27,-24.765),(1.27,121.92,-24.765),(14.878,74.53,-24.765)]
blue[(84.182,74.53,-24.765),(97.79,121.92,-24.765),(97.79,1.27,-24.765)]
blue[(44.182,34.53,-24.765),(97.79,1.27,-24.765),(1.27,1.27,-24.765)]
blue[(34.182,98.66,-24.765),(1.27,121.92,-24.765),(97.79,121.92,-24.765)]
blue[(1.27,1.27,-24.765),(14.878,74.53,-24.765),(24.878,34.53,-24.765)]
blue[(74.182,34.53,-24.765),(84.182,74.53,-24.765),(97.79,1.27,-24.765)]
blue[(64.878,98.66,-24.765),(34.182,98.66,-24.765),(97.79,121.92,-24.765)]
blue[(84.182,98.66,-24.765),(64.878,98.66,-24.765),(97.79,121.92,-24.765)]
blue[(59.182,73.66,-24.765),(34.182,98.66,-24.765),(64.878,98.66,-24.765)]
blue[(59.182,73.66,-24.765),(64.878,98.66,-24.765),(64.878,74.53,-24.765)]
blue[(97.79,1.27,-24.765),(44.182,34.53,-24.765),(54.878,34.53,-24.765)]
blue[(24.878,34.53,-24.765),(44.182,34.53,-24.765),(1.27,1.27,-24.765)]
blue[(97.79,1.27,-24.765),(54.878,34.53,-24.765),(74.182,34.53,-24.765)]
blue[(14.878,98.66,-24.765),(14.878,74.53,-24.765),(1.27,121.92,-24.765)]
blue[(97.79,121.92,-24.765),(84.182,74.53,-24.765),(84.182,98.66,-24.765)]
blue[(1.27,121.92,-24.765),(34.182,98.66,-24.765),(14.878,98.66,-24.765)]
blue[(24.878,34.53,-24.765),(14.878,74.53,-24.765),(24.878,58.66,-24.765)]
blue[(84.182,74.53,-24.765),(74.182,34.53,-24.765),(74.182,58.66,-24.765)]
blue[(34.182,74.53,-24.765),(34.182,98.66,-24.765),(59.182,73.66,-24.765)]
blue[(84.182,74.53,-24.765),(74.182,58.66,-24.765),(64.878,74.53,-24.765)]
blue[(64.878,74.53,-24.765),(74.182,58.66,-24.765),(59.182,58.66,-24.765)]
blue[(54.878,49.53,-24.765),(54.878,34.53,-24.765),(44.182,34.53,-24.765),(44.182,49.53,-24.765)]
blue[(39.878,73.66,-24.765),(34.182,74.53,-24.765),(59.182,73.66,-24.765)]
blue[(39.878,58.66,-24.765),(34.182,74.53,-24.765),(39.878,73.66,-24.765)]
blue[(59.182,73.66,-24.765),(64.878,74.53,-24.765),(59.182,58.66,-24.765)]`);

const shatteredScarFaceCSG = CSG.fromString(`red[(39.878,58.66,-24.765),(34.182,74.53,-24.765),(39.878,73.66,-24.765)]
red[(54.878,49.53,-24.765),(54.878,34.53,-24.765),(44.182,34.53,-24.765),(44.182,49.53,-24.765)]
red[(76.682,62.628,-24.765),(74.182,58.66,-24.765),(71.856,62.628,-24.765)]
red[(76.682,62.628,-24.765),(71.856,62.628,-24.765),(69.53,66.595,-24.765)]
red[(76.682,62.628,-24.765),(69.53,66.595,-24.765),(74.356,66.595,-24.765)]
red[(76.682,62.628,-24.765),(74.356,66.595,-24.765),(79.182,66.595,-24.765)]
red[(74.356,66.595,-24.765),(69.53,66.595,-24.765),(67.204,70.563,-24.765)]
red[(74.356,66.595,-24.765),(67.204,70.563,-24.765),(64.878,74.53,-24.765)]
red[(74.356,66.595,-24.765),(64.878,74.53,-24.765),(72.03,70.563,-24.765)]
red[(74.356,66.595,-24.765),(72.03,70.563,-24.765),(79.182,66.595,-24.765)]
red[(72.03,70.563,-24.765),(64.878,74.53,-24.765),(69.704,74.53,-24.765)]
red[(72.03,70.563,-24.765),(69.704,74.53,-24.765),(74.53,74.53,-24.765)]
red[(72.03,70.563,-24.765),(74.53,74.53,-24.765),(76.856,70.563,-24.765)]
red[(72.03,70.563,-24.765),(76.856,70.563,-24.765),(79.182,66.595,-24.765)]
red[(76.856,70.563,-24.765),(74.53,74.53,-24.765),(79.356,74.53,-24.765)]
red[(76.856,70.563,-24.765),(79.356,74.53,-24.765),(84.182,74.53,-24.765)]
red[(76.856,70.563,-24.765),(84.182,74.53,-24.765),(81.682,70.563,-24.765)]
red[(76.856,70.563,-24.765),(81.682,70.563,-24.765),(79.182,66.595,-24.765)]
red[(76.682,44.53,-24.765),(74.182,34.53,-24.765),(74.182,40.563,-24.765)]
red[(76.682,44.53,-24.765),(74.182,40.563,-24.765),(74.182,46.595,-24.765)]
red[(76.682,44.53,-24.765),(74.182,46.595,-24.765),(76.682,50.563,-24.765)]
red[(76.682,44.53,-24.765),(76.682,50.563,-24.765),(79.182,54.53,-24.765)]
red[(76.682,50.563,-24.765),(74.182,46.595,-24.765),(74.182,52.628,-24.765)]
red[(76.682,50.563,-24.765),(74.182,52.628,-24.765),(74.182,58.66,-24.765)]
red[(76.682,50.563,-24.765),(74.182,58.66,-24.765),(76.682,56.595,-24.765)]
red[(76.682,50.563,-24.765),(76.682,56.595,-24.765),(79.182,54.53,-24.765)]
red[(76.682,56.595,-24.765),(74.182,58.66,-24.765),(76.682,62.628,-24.765)]
red[(76.682,56.595,-24.765),(76.682,62.628,-24.765),(79.182,66.595,-24.765)]
red[(76.682,56.595,-24.765),(79.182,66.595,-24.765),(79.182,60.563,-24.765)]
red[(76.682,56.595,-24.765),(79.182,60.563,-24.765),(79.182,54.53,-24.765)]
red[(79.182,60.563,-24.765),(79.182,66.595,-24.765),(81.682,70.563,-24.765)]
red[(79.182,60.563,-24.765),(81.682,70.563,-24.765),(84.182,74.53,-24.765)]
red[(79.182,60.563,-24.765),(84.182,74.53,-24.765),(81.682,64.53,-24.765)]
red[(79.182,60.563,-24.765),(81.682,64.53,-24.765),(79.182,54.53,-24.765)]
red[(1.27,121.92,-24.765),(34.182,98.66,-24.765),(14.878,98.66,-24.765)]
red[(14.878,80.563,-24.765),(14.878,74.53,-24.765),(11.476,86.378,-24.765)]
red[(14.878,80.563,-24.765),(11.476,86.378,-24.765),(8.074,98.225,-24.765)]
red[(14.878,80.563,-24.765),(8.074,98.225,-24.765),(11.476,92.41,-24.765)]
red[(14.878,80.563,-24.765),(11.476,92.41,-24.765),(14.878,86.595,-24.765)]
red[(11.476,92.41,-24.765),(8.074,98.225,-24.765),(4.672,110.072,-24.765)]
red[(11.476,92.41,-24.765),(4.672,110.072,-24.765),(1.27,121.92,-24.765)]
red[(11.476,92.41,-24.765),(1.27,121.92,-24.765),(8.074,104.257,-24.765)]
red[(11.476,92.41,-24.765),(8.074,104.257,-24.765),(14.878,86.595,-24.765)]
red[(8.074,104.257,-24.765),(1.27,121.92,-24.765),(4.672,116.105,-24.765)]
red[(8.074,104.257,-24.765),(4.672,116.105,-24.765),(8.074,110.29,-24.765)]
red[(8.074,104.257,-24.765),(8.074,110.29,-24.765),(11.476,98.443,-24.765)]
red[(8.074,104.257,-24.765),(11.476,98.443,-24.765),(14.878,86.595,-24.765)]
red[(11.476,98.443,-24.765),(8.074,110.29,-24.765),(11.476,104.475,-24.765)]
red[(11.476,98.443,-24.765),(11.476,104.475,-24.765),(14.878,98.66,-24.765)]
red[(11.476,98.443,-24.765),(14.878,98.66,-24.765),(14.878,92.628,-24.765)]
red[(11.476,98.443,-24.765),(14.878,92.628,-24.765),(14.878,86.595,-24.765)]
red[(39.356,34.53,-24.765),(44.182,34.53,-24.765),(33.454,26.215,-24.765)]
red[(39.356,34.53,-24.765),(33.454,26.215,-24.765),(22.726,17.9,-24.765)]
red[(39.356,34.53,-24.765),(22.726,17.9,-24.765),(28.628,26.215,-24.765)]
red[(39.356,34.53,-24.765),(28.628,26.215,-24.765),(34.53,34.53,-24.765)]
red[(28.628,26.215,-24.765),(22.726,17.9,-24.765),(11.998,9.585,-24.765)]
red[(28.628,26.215,-24.765),(11.998,9.585,-24.765),(1.27,1.27,-24.765)]
red[(28.628,26.215,-24.765),(1.27,1.27,-24.765),(17.9,17.9,-24.765)]
red[(28.628,26.215,-24.765),(17.9,17.9,-24.765),(34.53,34.53,-24.765)]
red[(17.9,17.9,-24.765),(1.27,1.27,-24.765),(7.172,9.585,-24.765)]
red[(17.9,17.9,-24.765),(7.172,9.585,-24.765),(13.074,17.9,-24.765)]
red[(17.9,17.9,-24.765),(13.074,17.9,-24.765),(23.802,26.215,-24.765)]
red[(17.9,17.9,-24.765),(23.802,26.215,-24.765),(34.53,34.53,-24.765)]
red[(23.802,26.215,-24.765),(13.074,17.9,-24.765),(18.976,26.215,-24.765)]
red[(23.802,26.215,-24.765),(18.976,26.215,-24.765),(24.878,34.53,-24.765)]
red[(23.802,26.215,-24.765),(24.878,34.53,-24.765),(29.704,34.53,-24.765)]
red[(23.802,26.215,-24.765),(29.704,34.53,-24.765),(34.53,34.53,-24.765)]
red[(63.454,92.41,-24.765),(64.878,98.66,-24.765),(64.878,92.628,-24.765)]
red[(63.454,92.41,-24.765),(64.878,92.628,-24.765),(64.878,86.595,-24.765)]
red[(63.454,92.41,-24.765),(64.878,86.595,-24.765),(63.454,86.378,-24.765)]
red[(63.454,92.41,-24.765),(63.454,86.378,-24.765),(62.03,86.16,-24.765)]
red[(63.454,86.378,-24.765),(64.878,86.595,-24.765),(64.878,80.563,-24.765)]
red[(63.454,86.378,-24.765),(64.878,80.563,-24.765),(64.878,74.53,-24.765)]
red[(63.454,86.378,-24.765),(64.878,74.53,-24.765),(63.454,80.345,-24.765)]
red[(63.454,86.378,-24.765),(63.454,80.345,-24.765),(62.03,86.16,-24.765)]
red[(63.454,80.345,-24.765),(64.878,74.53,-24.765),(63.454,74.313,-24.765)]
red[(63.454,80.345,-24.765),(63.454,74.313,-24.765),(62.03,74.095,-24.765)]
red[(63.454,80.345,-24.765),(62.03,74.095,-24.765),(62.03,80.128,-24.765)]
red[(63.454,80.345,-24.765),(62.03,80.128,-24.765),(62.03,86.16,-24.765)]
red[(62.03,80.128,-24.765),(62.03,74.095,-24.765),(60.606,73.878,-24.765)]
red[(62.03,80.128,-24.765),(60.606,73.878,-24.765),(59.182,73.66,-24.765)]
red[(62.03,80.128,-24.765),(59.182,73.66,-24.765),(60.606,79.91,-24.765)]
red[(62.03,80.128,-24.765),(60.606,79.91,-24.765),(62.03,86.16,-24.765)]
red[(69.704,98.66,-24.765),(64.878,98.66,-24.765),(73.106,104.475,-24.765)]
red[(69.704,98.66,-24.765),(73.106,104.475,-24.765),(81.334,110.29,-24.765)]
red[(69.704,98.66,-24.765),(81.334,110.29,-24.765),(77.932,104.475,-24.765)]
red[(69.704,98.66,-24.765),(77.932,104.475,-24.765),(74.53,98.66,-24.765)]
red[(77.932,104.475,-24.765),(81.334,110.29,-24.765),(89.562,116.105,-24.765)]
red[(77.932,104.475,-24.765),(89.562,116.105,-24.765),(97.79,121.92,-24.765)]
red[(77.932,104.475,-24.765),(97.79,121.92,-24.765),(86.16,110.29,-24.765)]
red[(77.932,104.475,-24.765),(86.16,110.29,-24.765),(74.53,98.66,-24.765)]
red[(86.16,110.29,-24.765),(97.79,121.92,-24.765),(94.388,116.105,-24.765)]
red[(86.16,110.29,-24.765),(94.388,116.105,-24.765),(90.986,110.29,-24.765)]
red[(86.16,110.29,-24.765),(90.986,110.29,-24.765),(82.758,104.475,-24.765)]
red[(86.16,110.29,-24.765),(82.758,104.475,-24.765),(74.53,98.66,-24.765)]
red[(82.758,104.475,-24.765),(90.986,110.29,-24.765),(87.584,104.475,-24.765)]
red[(82.758,104.475,-24.765),(87.584,104.475,-24.765),(84.182,98.66,-24.765)]
red[(82.758,104.475,-24.765),(84.182,98.66,-24.765),(79.356,98.66,-24.765)]
red[(82.758,104.475,-24.765),(79.356,98.66,-24.765),(74.53,98.66,-24.765)]
red[(81.682,64.53,-24.765),(84.182,74.53,-24.765),(87.584,56.215,-24.765)]
red[(81.682,64.53,-24.765),(87.584,56.215,-24.765),(90.986,37.9,-24.765)]
red[(81.682,64.53,-24.765),(90.986,37.9,-24.765),(85.084,46.215,-24.765)]
red[(81.682,64.53,-24.765),(85.084,46.215,-24.765),(79.182,54.53,-24.765)]
red[(85.084,46.215,-24.765),(90.986,37.9,-24.765),(94.388,19.585,-24.765)]
red[(85.084,46.215,-24.765),(94.388,19.585,-24.765),(97.79,1.27,-24.765)]
red[(85.084,46.215,-24.765),(97.79,1.27,-24.765),(88.486,27.9,-24.765)]
red[(85.084,46.215,-24.765),(88.486,27.9,-24.765),(79.182,54.53,-24.765)]
red[(88.486,27.9,-24.765),(97.79,1.27,-24.765),(91.888,9.585,-24.765)]
red[(88.486,27.9,-24.765),(91.888,9.585,-24.765),(85.986,17.9,-24.765)]
red[(88.486,27.9,-24.765),(85.986,17.9,-24.765),(82.584,36.215,-24.765)]
red[(88.486,27.9,-24.765),(82.584,36.215,-24.765),(79.182,54.53,-24.765)]
red[(82.584,36.215,-24.765),(85.986,17.9,-24.765),(80.084,26.215,-24.765)]
red[(82.584,36.215,-24.765),(80.084,26.215,-24.765),(74.182,34.53,-24.765)]
red[(82.584,36.215,-24.765),(74.182,34.53,-24.765),(76.682,44.53,-24.765)]
red[(82.584,36.215,-24.765),(76.682,44.53,-24.765),(79.182,54.53,-24.765)]
red[(34.182,98.66,-24.765),(1.27,121.92,-24.765),(97.79,121.92,-24.765)]
red[(90.986,98.225,-24.765),(97.79,121.92,-24.765),(97.79,61.595,-24.765)]
red[(90.986,98.225,-24.765),(97.79,61.595,-24.765),(97.79,1.27,-24.765)]
red[(90.986,98.225,-24.765),(97.79,1.27,-24.765),(90.986,37.9,-24.765)]
red[(90.986,98.225,-24.765),(90.986,37.9,-24.765),(84.182,74.53,-24.765)]
red[(1.27,91.757,-24.765),(1.27,121.92,-24.765),(4.672,110.072,-24.765)]
red[(1.27,91.757,-24.765),(4.672,110.072,-24.765),(8.074,98.225,-24.765)]
red[(1.27,91.757,-24.765),(8.074,98.225,-24.765),(4.672,79.91,-24.765)]
red[(1.27,91.757,-24.765),(4.672,79.91,-24.765),(1.27,61.595,-24.765)]
red[(4.672,79.91,-24.765),(8.074,98.225,-24.765),(11.476,86.378,-24.765)]
red[(4.672,79.91,-24.765),(11.476,86.378,-24.765),(14.878,74.53,-24.765)]
red[(4.672,79.91,-24.765),(14.878,74.53,-24.765),(8.074,68.063,-24.765)]
red[(4.672,79.91,-24.765),(8.074,68.063,-24.765),(1.27,61.595,-24.765)]
red[(8.074,68.063,-24.765),(14.878,74.53,-24.765),(11.476,56.215,-24.765)]
red[(8.074,68.063,-24.765),(11.476,56.215,-24.765),(8.074,37.9,-24.765)]
red[(8.074,68.063,-24.765),(8.074,37.9,-24.765),(4.672,49.748,-24.765)]
red[(8.074,68.063,-24.765),(4.672,49.748,-24.765),(1.27,61.595,-24.765)]
red[(4.672,49.748,-24.765),(8.074,37.9,-24.765),(4.672,19.585,-24.765)]
red[(4.672,49.748,-24.765),(4.672,19.585,-24.765),(1.27,1.27,-24.765)]
red[(4.672,49.748,-24.765),(1.27,1.27,-24.765),(1.27,31.433,-24.765)]
red[(4.672,49.748,-24.765),(1.27,31.433,-24.765),(1.27,61.595,-24.765)]
red[(44.182,34.53,-24.765),(97.79,1.27,-24.765),(1.27,1.27,-24.765)]
red[(1.27,1.27,-24.765),(14.878,74.53,-24.765),(24.878,34.53,-24.765)]
red[(64.878,98.66,-24.765),(34.182,98.66,-24.765),(97.79,121.92,-24.765)]
red[(46.682,86.16,-24.765),(34.182,98.66,-24.765),(49.53,98.66,-24.765)]
red[(46.682,86.16,-24.765),(49.53,98.66,-24.765),(64.878,98.66,-24.765)]
red[(46.682,86.16,-24.765),(64.878,98.66,-24.765),(62.03,86.16,-24.765)]
red[(46.682,86.16,-24.765),(62.03,86.16,-24.765),(59.182,73.66,-24.765)]
red[(70.986,17.9,-24.765),(44.182,34.53,-24.765),(49.53,34.53,-24.765)]
red[(70.986,17.9,-24.765),(49.53,34.53,-24.765),(54.878,34.53,-24.765)]
red[(70.986,17.9,-24.765),(54.878,34.53,-24.765),(76.334,17.9,-24.765)]
red[(70.986,17.9,-24.765),(76.334,17.9,-24.765),(97.79,1.27,-24.765)]
red[(97.79,1.27,-24.765),(54.878,34.53,-24.765),(74.182,34.53,-24.765)]
red[(97.79,121.92,-24.765),(84.182,74.53,-24.765),(84.182,98.66,-24.765)]
red[(19.878,54.53,-24.765),(14.878,74.53,-24.765),(19.878,66.595,-24.765)]
red[(19.878,54.53,-24.765),(19.878,66.595,-24.765),(24.878,58.66,-24.765)]
red[(19.878,54.53,-24.765),(24.878,58.66,-24.765),(24.878,46.595,-24.765)]
red[(19.878,54.53,-24.765),(24.878,46.595,-24.765),(24.878,34.53,-24.765)]
red[(34.182,92.628,-24.765),(34.182,98.66,-24.765),(40.432,92.41,-24.765)]
red[(34.182,92.628,-24.765),(40.432,92.41,-24.765),(46.682,86.16,-24.765)]
red[(34.182,92.628,-24.765),(46.682,86.16,-24.765),(40.432,86.378,-24.765)]
red[(34.182,92.628,-24.765),(40.432,86.378,-24.765),(34.182,86.595,-24.765)]
red[(40.432,86.378,-24.765),(46.682,86.16,-24.765),(52.932,79.91,-24.765)]
red[(40.432,86.378,-24.765),(52.932,79.91,-24.765),(59.182,73.66,-24.765)]
red[(40.432,86.378,-24.765),(59.182,73.66,-24.765),(46.682,80.128,-24.765)]
red[(40.432,86.378,-24.765),(46.682,80.128,-24.765),(34.182,86.595,-24.765)]
red[(46.682,80.128,-24.765),(59.182,73.66,-24.765),(52.932,73.878,-24.765)]
red[(46.682,80.128,-24.765),(52.932,73.878,-24.765),(46.682,74.095,-24.765)]
red[(46.682,80.128,-24.765),(46.682,74.095,-24.765),(40.432,80.345,-24.765)]
red[(46.682,80.128,-24.765),(40.432,80.345,-24.765),(34.182,86.595,-24.765)]
red[(40.432,80.345,-24.765),(46.682,74.095,-24.765),(40.432,74.313,-24.765)]
red[(40.432,80.345,-24.765),(40.432,74.313,-24.765),(34.182,74.53,-24.765)]
red[(40.432,80.345,-24.765),(34.182,74.53,-24.765),(34.182,80.563,-24.765)]
red[(40.432,80.345,-24.765),(34.182,80.563,-24.765),(34.182,86.595,-24.765)]
red[(71.856,62.628,-24.765),(74.182,58.66,-24.765),(70.432,58.66,-24.765)]
red[(71.856,62.628,-24.765),(70.432,58.66,-24.765),(66.682,58.66,-24.765)]
red[(71.856,62.628,-24.765),(66.682,58.66,-24.765),(68.106,62.628,-24.765)]
red[(71.856,62.628,-24.765),(68.106,62.628,-24.765),(69.53,66.595,-24.765)]
red[(68.106,62.628,-24.765),(66.682,58.66,-24.765),(62.932,58.66,-24.765)]
red[(68.106,62.628,-24.765),(62.932,58.66,-24.765),(59.182,58.66,-24.765)]
red[(68.106,62.628,-24.765),(59.182,58.66,-24.765),(64.356,62.628,-24.765)]
red[(68.106,62.628,-24.765),(64.356,62.628,-24.765),(69.53,66.595,-24.765)]
red[(64.356,62.628,-24.765),(59.182,58.66,-24.765),(60.606,62.628,-24.765)]
red[(64.356,62.628,-24.765),(60.606,62.628,-24.765),(62.03,66.595,-24.765)]
red[(64.356,62.628,-24.765),(62.03,66.595,-24.765),(65.78,66.595,-24.765)]
red[(64.356,62.628,-24.765),(65.78,66.595,-24.765),(69.53,66.595,-24.765)]
red[(65.78,66.595,-24.765),(62.03,66.595,-24.765),(63.454,70.563,-24.765)]
red[(65.78,66.595,-24.765),(63.454,70.563,-24.765),(64.878,74.53,-24.765)]
red[(65.78,66.595,-24.765),(64.878,74.53,-24.765),(67.204,70.563,-24.765)]
red[(65.78,66.595,-24.765),(67.204,70.563,-24.765),(69.53,66.595,-24.765)]
red[(37.03,74.095,-24.765),(34.182,74.53,-24.765),(46.682,74.095,-24.765)]
red[(37.03,74.095,-24.765),(46.682,74.095,-24.765),(59.182,73.66,-24.765)]
red[(37.03,74.095,-24.765),(59.182,73.66,-24.765),(49.53,73.66,-24.765)]
red[(37.03,74.095,-24.765),(49.53,73.66,-24.765),(39.878,73.66,-24.765)]
red[(62.03,74.095,-24.765),(64.878,74.53,-24.765),(62.03,66.595,-24.765)]
red[(62.03,74.095,-24.765),(62.03,66.595,-24.765),(59.182,58.66,-24.765)]
red[(62.03,74.095,-24.765),(59.182,58.66,-24.765),(59.182,66.16,-24.765)]
red[(62.03,74.095,-24.765),(59.182,66.16,-24.765),(59.182,73.66,-24.765)]
red[(126.074,-27.014,-24.765),(69.506,-27.014,-24.765),(69.506,29.554,-24.765),(126.074,29.554,-24.765)]
green[(97.79,1.27,-24.765),(69.506,1.27,-24.765),(69.506,29.554,-24.765),(97.79,29.554,-24.765)]
`);
