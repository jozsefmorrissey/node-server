
const du = require('../../../public/js/utils/dom-utils');
const Measurement = require('../../../public/js/utils/measurement');
const panZoom = require('../../../public/js/utils/canvas/two-d/pan-zoom-click-measure');
const Draw2D = require('../../../public/js/utils/canvas/two-d/draw.js');
const Circle2d = require('../../../public/js/utils/canvas/two-d/objects/circle.js');
const Vertex2d = require('../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Line2d = require('../../../public/js/utils/canvas/two-d/objects/line.js');
const HoverMap = require('../../../public/js/utils/canvas/two-d/hover-map.js');
const PopUp = require('../../../public/js/utils/display/pop-up');

function reportError(msg) {
  console.error(msg);
}

let lines = [];
let verts;
let hoverMap = new HoverMap();
const popUp = new PopUp({resize: false});
let active = false;

function addVertex(x, y) {
  const vert = new Vertex2d(x,y);
  hoverMap.add(vert);
  verts.push(vert);
  return vert;
}

function polyAddFunc() {
  let points = [];
  return (x,y) => {
    points.push(addVertex(x,y));
    verts.push(points[points.length - 1]);
    if (points.length > 1) {
      const line = new Line2d(points[points.length - 2], points[points.length - 1]);
      const mp = line.midpoint();
      addVertex(mp.x(), mp.y());
      hoverMap.add(line);
    }
  }
}
// (circle, lineColor, fillColor, lineWidth)
function drawObject(obj) {
  const target = obj.target();
  if (target instanceof Vertex2d) {
    draw.circle(new Circle2d(1, target), color(target), 0, color(target));
  } else {
    draw.line(target, color(target),  .5);
  }
}


let colors = {};
function color(lineOvert, color) {
  const key = lineOvert.toString();
  if (color) {
    colors[key] = color;
  }
  return colors[key];
}

const parseFloat = (str) => Number.parseFloat(str) * scale;
function vertColorReplace(garb, c, vertStr) {
  const match = vertStr.match(pointReg)
  const x = parseFloat(match[2]);
  const y = parseFloat(match[5]);
  color(new Vertex2d(x,y), c);
  return vertStr;
}

function pathColorReplace(garb, c, pathStr) {
  const pointStrs = pathStr.match(pointsReg);
  const points = [];
  pointStrs.forEach((pointStr) => {
    const match = pointStr.match(pointReg)
    const x = parseFloat(match[2]);
    const y = parseFloat(match[5]);
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

const splitReg = /(\],\[|\],\(|\),\[)/;
const pointsReg = /\(\s*(((-|)([0-9]{1,}\.[0-9]{1,}|[0-9]{1,}|\.[0-9]{1,}))\s*,\s*((-|)([0-9]{1,}\.[0-9]{1,}|[0-9]{1,}|\.[0-9]{1,})))\s*\)/g;
const pointReg = /\(\s*(((-|)([0-9]{1,}\.[0-9]{1,}|[0-9]{1,}|\.[0-9]{1,}))\s*,\s*((-|)([0-9]{1,}\.[0-9]{1,}|[0-9]{1,}|\.[0-9]{1,})))\s*\)/;



function splitLocationData(str) {
  str = parseColors(str);
  const breakdown = str.split(splitReg);
  for (let index = 0; index < breakdown.length; index+=2) {
    const start = index === 0 ? '' : breakdown[index-1].substr(breakdown[index-1].length - 1, 1);
    const end = index === breakdown.length - 1 ? '' : breakdown[index+1].substr(0,1);
    const piece = start + breakdown[index] + end;
    const illustrateFunc = piece.charAt(0) === '[' ?  polyAddFunc() : addVertex;
    const pointStrs = piece.match(pointsReg);
    if (pointStrs === null) reportError(`trouble parsing section ${piece}`);
    else {
      pointStrs.forEach(pointStr => {
        const match = pointStr.match(pointReg)
        const x = parseFloat(match[2]);
        const y = parseFloat(match[5]);
        illustrateFunc(x,y);
      });
    }
  }
}

function drawFunc() {
  verts = [];
  hoverMap.objects().forEach(obj => drawObject(obj));
  console.log('wtf');
}
// [(1,.1),(2.2,88888.2),(.000003,3)],[(4445654.345,4),(-5,-5)],(6,7),[(4,4),(5,5)]
const canvas = du.find('#two-d-display>canvas');
const height = du.convertCssUnit('100vh');
canvas.height = height;
canvas.width = height;
draw = new Draw2D(canvas, true);

panZ = new panZoom(canvas, drawFunc, () => hoverMap);
panZ.disable.move()
draw.circle(new Circle2d(2, new Vertex2d(10,10)), null, 'green');

let scale;
function parse(newLines, sc) {
  scale = sc;
  lines = newLines;
  panZ.once();
  hoverMap.clear();
  colors = {};
  lines.forEach((line) =>  {
    line = line.trim();
    if (line) splitLocationData(line);
  })
}

const clickStack = [];
const lastClicked = () => clickStack[clickStack.length - 1];

const centerOnVertices = () => {
    if (verts.length === 0) return;
    const minMax = Math.minMax(verts, ['x', 'y'])
    const x = (minMax.x.max - minMax.x.min)/2;
    const y = (minMax.y.max - minMax.y.min)/-2;
    const center = new Vertex2d(x, y);
    panZ.centerOn(center.x(), center.y());
  };

du.on.match('click', '#two-d-display [type="checkbox"]', (elem) => {
  panZ.measurements[elem.checked ? 'enable' : 'disable']();
});


module.exports = {
  oft: (on_off_toggle) => {
    if (on_off_toggle === true) active = true;
    if (on_off_toggle === false) active = false;
    if (on_off_toggle === null) active = !active;
    panZ.oft(active);
    return active
  },
  parse,
  initialValue: '//Points\npurple(-5,-5)' +
    '\n\n// Paths\nred[(1,.1),(2.2,88.2),blue(.000003,3)],pink[(54.35,4),(-5,-5)],[(4,4),(5,5)]' +
    '\n\n// Combination\nyellow[(1,.1),(2.2,88.2),(.000003,3)],green[(54.35,4),(-5,-5)][(4,4),(5,5)]'
}
