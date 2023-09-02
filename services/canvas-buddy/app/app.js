
require('../../../public/js/utils/utils');
const du = require('../../../public/js/utils/dom-utils');
const Measurement = require('../../../public/js/utils/measurement');
const panZoom = require('../../../public/js/utils/canvas/two-d/pan-zoom');
const Draw2D = require('../../../public/js/utils/canvas/two-d/draw.js');
const Circle2d = require('../../../public/js/utils/canvas/two-d/objects/circle.js');
const Vertex2d = require('../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Line2d = require('../../../public/js/utils/canvas/two-d/objects/line.js');
const HoverMap = require('../../../public/js/utils/canvas/two-d/hover-map.js');
const PopUp = require('../../../public/js/utils/display/pop-up');

function reportError(msg) {
  console.error(msg);
}

let verts;
let hoverMap = new HoverMap();
const popUp = new PopUp({resize: false});

function addVertex(x, y) {
  const vert = new Vertex2d(x,y);
  hoverMap.add(vert);
  verts.push(vert);
  return vert;
}

function polyDrawFunc() {
  let points = [];
  return (x,y) => {
    points.push(addVertex(x,y));
    verts.push(points[points.length - 1]);
    if (points.length > 1) {
      const line = new Line2d(points[points.length - 2], points[points.length - 1]);
      const mp = line.midpoint();
      addVertex(mp.x(), mp.y());
      hoverMap.add(line);
      if (isIdentified(line.startVertex())) drawVertex(line.startVertex());
      if (isIdentified(mp)) drawVertex(mp);
      if (isIdentified(line.endVertex())) drawVertex(line.endVertex());
      const hoveringLine = isHovering(line);
      if (hoveringLine) {
        console.log('hover');
      }
      draw.line(line, color(line), hoveringLine ? 1 : .5, hoveringLine);
    }
  }
}
// (circle, lineColor, fillColor, lineWidth)
function drawVertex(x, y) {
  const vert = x instanceof Vertex2d ? x : addVertex(x,y);
  const radius = isHovering(vert) ? 2 : 1;
  draw.circle(new Circle2d(radius, vert), null, color(vert), 0);
}

let colors = {};
this.isHovering = (obj) => obj && obj.equals(hovering);
this.isLastClicked = (obj) => obj && obj.equals(lastClicked());
this.isIdentified = (obj) => isHovering(obj) || isLastClicked(obj);
function color(lineOvert, color) {
  if (isHovering(lineOvert) || isLastClicked(lineOvert)) return 'blue';
  const key = lineOvert.toString();
  if (color) {
    colors[key] = color;
  }
  return colors[key];
}

function vertColorReplace(garb, c, vertStr) {
  const match = vertStr.match(pointReg)
  const x = Number.parseFloat(match[2]);
  const y = Number.parseFloat(match[5]);
  color(new Vertex2d(x,y), c);
  return vertStr;
}

function pathColorReplace(garb, c, pathStr) {
  const pointStrs = pathStr.match(pointsReg);
  const points = [];
  pointStrs.forEach((pointStr) => {
    const match = pointStr.match(pointReg)
    const x = Number.parseFloat(match[2]);
    const y = Number.parseFloat(match[5]);
    points.push(new Vertex2d(x,y));
    if (points.length > 1) color(new Line2d(points[points.length - 2], points[points.length - 1]), c);
  });
  return pathStr;
}


const pathColorReg = /([a-zA-Z]{1,})(\[.*?\])/g;
const vertColorReg = /([a-zA-Z]{1,})(\(.*?\))/g;
function parseColors(line) {
  line = line.replace(pathColorReg, pathColorReplace) || line;
  line = line.replace(vertColorReg, vertColorReplace) || line;
  return line;
}

const input = du.find('textarea');
console.log('hello buddy');
const splitReg = /(\],\[|\],\(|\),\[)/;
const pointsReg = /\(\s*(((-|)([0-9]{1,}\.[0-9]{1,}|[0-9]{1,}|\.[0-9]{1,}))\s*,\s*((-|)([0-9]{1,}\.[0-9]{1,}|[0-9]{1,}|\.[0-9]{1,})))\s*\)/g;
const pointReg = /\(\s*(((-|)([0-9]{1,}\.[0-9]{1,}|[0-9]{1,}|\.[0-9]{1,}))\s*,\s*((-|)([0-9]{1,}\.[0-9]{1,}|[0-9]{1,}|\.[0-9]{1,})))\s*\)/;
const commentReg = /\s*\/\/.*/;

function splitLocationData(str) {
  str = parseColors(str);
  const breakdown = str.split(splitReg);
  for (let index = 0; index < breakdown.length; index+=2) {
    const start = index === 0 ? '' : breakdown[index-1].substr(breakdown[index-1].length - 1, 1);
    const end = index === breakdown.length - 1 ? '' : breakdown[index+1].substr(0,1);
    const piece = start + breakdown[index] + end;
    const illustrateFunc = piece.charAt(0) === '[' ?  polyDrawFunc() : drawVertex;
    const pointStrs = piece.match(pointsReg);
    if (pointStrs === null) reportError(`trouble parsing section ${piece}`);
    else {
      pointStrs.forEach(pointStr => {
        const match = pointStr.match(pointReg)
        const x = Number.parseFloat(match[2]);
        const y = Number.parseFloat(match[5]);
        illustrateFunc(x,y);
      });
    }
  }
}

function drawFunc() {
  colors = {};
  verts = [];
  hoverMap.clear();
  const lines  = input.value.split('\n');
  lines.forEach((line) =>  {
    line =  line.replace(commentReg, '');
    line = line.trim();
    if (line) splitLocationData(line);
  })

}
// [(1,.1),(2.2,88888.2),(.000003,3)],[(4445654.345,4),(-5,-5)],(6,7),[(4,4),(5,5)]
const canvas = du.find('canvas');
const height = du.convertCssUnit('100vh');
canvas.height = height;
canvas.width = height;
draw = new Draw2D(canvas, true);
panZ = panZoom(canvas, drawFunc);
draw.circle(new Circle2d(2, new Vertex2d(10,10)), null, 'green');

let lastHash;
input.onkeyup = (event) => {
  const thisHash = input.value.hash();
  if (thisHash !== lastHash) {
    lastHash = thisHash;
    panZ.once();
  }
}

let hovering;
panZ.onMove((event) => {
  const vertex = new Vertex2d(event.imageX, -1*event.imageY);
  hovering = hoverMap.hovering(event.imageX, -1*event.imageY);
});

const clickStack = [];
const lastClicked = () => clickStack[clickStack.length - 1];
panZ.onMouseup((event) => {
  const last = lastClicked();
  if (last && hovering) {
    const point = {x: event.screenX, y: event.screenY};
    if (hovering.equals(last)) popUp.open(hovering.toString(), point);
    else popUp.open(new Measurement(hovering.distance(last)).display(), point);
    clickStack.push(undefined);
  } else {
    clickStack.push(hovering);
  }
});

setTimeout(() => {
    const minMax = Math.minMax(verts, ['x', 'y'])
    const x = (minMax.x.max - minMax.x.min)/2;
    const y = (minMax.y.max - minMax.y.min)/-2;
    const center = new Vertex2d(x, y);
    panZ.centerOn(center.x(), center.y());
  });

input.onkeyup(true);

const initialValue = `\npurple(-5,-5)//Points

// Paths\n
red[(1,.1),(2.2,88.2),blue(.000003,3)],pink[(54.35,4),(-5,-5)],[(4,4),(5,5)]

     // Combination\n
     yellow[(1,.1),(2.2,88.2),(.000003,3)],green[(54.35,4),(-5,-5)][(4,4),(5,5)]`;

input.value = initialValue;
