const Test = require('../test.js').Test;
const Polygon3D = require('../../canvas/three-d/objects/polygon.js');
const Layer = require('../../canvas/three-d/objects/layer.js');
const du = require('../../dom-utils.js');
const HtmlTest = require('../../test/html-test');
const Draw = require('../../canvas/two-d/draw.js');

const poly1 = `red[(89.476,0.476,0),(1.964,0.476,0),(17.204,63.312,0),(74.236,63.312,0)]\ngreen[(91.44,0,1.905),(76.2,62.836,1.905),(15.24,62.836,1.905),(0,0,1.905)]\n1,0,255[(74.236,63.312,0),(17.204,63.312,0),(15.24,62.836,1.905),(76.2,62.836,1.905)]\nred[(91.44,0,1.905),(0,0,1.905),(1.964,0.476,0),(89.476,0.476,0)]\n255,0,1[(0,0,1.905),(15.24,62.836,1.905),(17.204,63.312,0),(1.964,0.476,0)]\ngreen[(76.2,62.836,1.905),(91.44,0,1.905),(89.476,0.476,0),(74.236,63.312,0)]\n`
const poly2 = `blue[(1.964,0.476,1.905),(89.476,0.476,1.905),(74.236,63.312,1.905),(17.204,63.312,1.905)]\nblue[(0,0,0),(15.24,62.836,0),(76.2,62.836,0),(91.44,0,0)]\nblue[(17.204,63.312,1.905),(74.236,63.312,1.905),(76.2,62.836,0),(15.24,62.836,0)]\nblue[(0,0,0),(91.44,0,0),(89.476,0.476,1.905),(1.964,0.476,1.905)]\nblue[(91.44,0,0),(76.2,62.836,0),(74.236,63.312,1.905),(89.476,0.476,1.905)]\nblue[(15.24,62.836,0),(0,0,0),(1.964,0.476,1.905),(17.204,63.312,1.905)]\n`;


Test.add('CSG: fromString',(ts) => {
  const csg = CSG.fromString(poly1);
  const colors = ['red', 'green', [1,0,255], 'red', [255,0,1], 'green'];
  ts.assertEquals(colors.length, csg.polygons.length);
  csg.polygons.forEach((p, i) => ts.assertTrue(Object.equals(p.color(), colors[i])));
  ts.assertEquals(csg.toString(null, true), poly1)

  const fail = CSG.fromString('blue[(-94.615,10.16,-10.16),(140.335,10.16,-10.16),(140.335,0,-10.16),(-94.615,0,-10.16)]\nblue[(-94.615,0,10000),(140.335,0,10000),(140.335,10.16,10000),(-94.615,10.16,10000)]\nblue[(140.335,10.16,-10.16),(-94.615,10.16,-10.16),(-94.615,10.16,10000),(140.335,10.16,10000)]\nblue[(140.335,0,-10.16),(140.335,10.16,-10.16),(140.335,10.16,10000),(140.335,0,10000)]\nblue[(140.335,0,10000),(-94.615,0,10000),(-94.615,0,-10.16),(140.335,0,-10.16)]\nblue[(-94.615,0,10000),(-94.615,10.16,10000),(-94.615,10.16,-10.16),(-94.615,0,-10.16)]\n');
  ts.assertTrue(fail instanceof CSG);
  ts.success();
});

const abs = Math.abs;
const sortByVector = (vector) => (p1, p2) => {
  const norm1 = p1.vertices[0].normal;
  const norm2 = p2.vertices[0].normal;
  const cross1 = norm1.cross(vector);
  const cross2 = norm2.cross(vector);
  const sum1 = Math.roundTo(abs(cross1.x) + abs(cross1.y) + abs(cross1.z), .000001);
  const sum2 = Math.roundTo(abs(cross2.x) + abs(cross2.y) + abs(cross2.z), .000001);
  if (sum1 !== 0 && sum2 === 0) return 1;
  if (sum1 === 0 && sum2 !== 0) return -1;
  const diff = sum1 - sum2;
  if (diff !== 0) return diff;
  const dot1 = norm1.dot(vector);
  const dot2 = norm2.dot(vector);
  return dot2 - dot1;
}


function squareSlice(slice, vector, index, offset) {
  slice.polygons.sort(sortByVector(vector));
  return CSG.fromPolygon(slice.polygons[index], offset);
}

function frontView(intersection, config) {
  if (config.slices.length === 0) {
    const sqSlice = squareSlice(intersection, config.step, 1, -config.width);
    return sqSlice.union(intersection);
  }
  const backOne = config.slices[config.slices.length - 1];
  const squared =  squareSlice(backOne.clone(), config.step, 0, 2*config.width);
  squared.translate(config.step.times(-1));
  const remaining = intersection.subtract(squared);
  // console.log(ps.map((p,i) => `// ${i} ${p.plane.normal}\n${p.toString()}`).join('\n'));
  if (remaining.polygons.length === 0) return squared.union(backOne);
  return squared.union(remaining).union(backOne);
}

Test.add('Draw: position', (ts) => {
  const title = 'Draw Position';
  const width = 300;
  const height = 300;
  const style = `width: ${width}px; height: ${height}px`;
  const canvas = du.create.element('canvas', {class: 'upside-down'});
  canvas.height = height;
  canvas.width = width;
  const draw = new Draw(canvas);
  HtmlTest.register(title, () => 'Loading...');
  const cnt = HtmlTest.container(title);

  cnt.append(canvas);
  draw.translate(500, -200)
  draw.translate(4322, -132324);
  draw.scale(1, 1);

  const corners = draw.corners();
  const center = draw.center();
  draw(center, 'green', 3);
  const topLeft = draw.topLeft();
  draw(topLeft, null, 1);
  corners.forEach(c => draw(c, null, 3));
  corners.forEach(c => {
    const src = draw.toDataURL();
    cnt.append(du.create.element('img', {src}));
  });
  // draw.translate(-150, -200);//(corners[0]);
});


Test.add('CSG: slice',(ts) => {
  const csg1 = CSG.fromString(poly1);
  const csg = CSG.fromString(poly2);
  const title = 'slice drawings';
  csg.center({x:150, y:50, z:0});
  HtmlTest.register(title, () => 'Loading...');
  const cnt = HtmlTest.container(title);
  const start = new Date().getTime();
  let time = 0;
  for (let index = 0; index < 160; index++) {
    // csg.center({x:0, y:0, z:0});
    // csg.center({x:150, y:50, z:0});
    const layers = Layer.fromCSG(csg);
    layers.sort((a,b) => a.center().z - b.center().z);
    const canvas = du.create.element('canvas', {class: 'upside-down'});
    const draw = new Draw(canvas);
    const s = new Date().getTime();
    draw.position(csg.center(), csg.demensions());
    draw(layers);
    time += new Date().getTime() - s;
    cnt.append(canvas);
    csg.rotate({z:5})
      // const src = canvas.toDataURL();
      // cnt.append(du.create.element('img', {src}));
  }
  time = Math.roundTo(time / 1000, .001);
  console.log(`Time: ${time}s Per: ${time/24}`);

  ts.success();
});
