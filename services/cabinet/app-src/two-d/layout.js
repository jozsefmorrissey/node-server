const Layout2D = require('../objects/layout');
const panZoom = require('./pan-zoom');
const du = require('../../../../public/js/utils/dom-utils.js');
const TwoDLayout = {};

const layout = new Layout2D();

// du.on.match('keycombo:Control,z', '*', layout.history().undo);
// du.on.match('keycombo:Control,r', '*', layout.history().redo);

const hoverMap = {Window2D: {}, Door2D: {}, Wall2D: {}, Vertex2D: {}};

const windowLineWidth = 8;
const tolerance = 1;
let hovering;
let clickHolding = false;
const quickChangeFuncs = {};

function registerQuickChangeFunc(type, func) {
  if ((typeof func) === 'function') quickChangeFuncs[type] = func;
}

function onMousedown(event, stdEvent) {
  if (stdEvent.button == 0) {
    if (hovering !== undefined && !clickHolding) console.log('down');
    clickHolding = clickHolding || hovering !== undefined;
    return clickHolding;
  } else {
    if (hovering && quickChangeFuncs[hovering.constructor.name]) {
      quickChangeFuncs[hovering.constructor.name](hovering, event, stdEvent);
    }
    console.log('rightClick: do stuff!!');
    return true;
  }
}

function addVertex(hovering, event, stdEvent) {
  const point = hovering.closestPointOnLine({x: event.imageX, y: event.imageY});
  hovering.endVertex().nextVertex(point, Layout2D.Wall2D);
}

registerQuickChangeFunc('Wall2D', addVertex);

function hoverId () {
  return hovering ? hovering.id() : undefined;
}

function onMouseup(event, stdEvent) {
  if (stdEvent.button == 0) {
    console.log('leftClick');
    console.log('up');
    const clickWasHolding = clickHolding;
    clickHolding = false;
    hovering = undefined;
    return clickWasHolding;
  } else {
    console.log('rightClick: do stuff!!');
  }
}

function  drag(event)  {
  const dragging = clickHolding && hovering && hovering.move(event);
  return dragging;
}

function hover(event) {
  if (clickHolding) return true;
  let found = false;
  const tuple = {x: event.imageX, y: event.imageY};
  function  check(list) {
    for (let index = 0; index < list.length; index += 1) {
      if (withinTolerance(tuple, list[index])) {
        hovering = list[index].item;
        found = true;
      }
    }
    if (!clickHolding && !found) hovering = undefined;
  }
  check(Object.values(hoverMap.Vertex2D));
  found || check(Object.values(hoverMap.Window2D));
  found || check(Object.values(hoverMap.Door2D));
  found || check(Object.values(hoverMap.Wall2D));

  return found;
}

function onMove(event) {
  return drag(event) || hover(event);
}

function withinTolerance(point, map) {
  const x0 = point.x;
  const y0 = point.y;
  const x1 = map.start.x;
  const y1 = map.start.y;
  const x2 = map.end.x;
  const y2 = map.end.y;
  const num = Math.abs((y2 - y1)*x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1)
  const denom = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
  console.log(num/denom);
  return num / denom < map.tolerance;
}

function withinTolerance(point, map) {
  const t = map.tolerance;
  const x0 = point.x;
  const y0 = point.y;
  const x1 = map.start.x > map.end.x ? map.end.x : map.start.x;
  const y1 = map.start.y > map.end.y ? map.end.y : map.start.y;
  const x2 = map.start.x < map.end.x ? map.end.x : map.start.x;
  const y2 = map.start.y < map.end.y ? map.end.y : map.start.y;
  return x0>x1-t && x0 < x2+t && y0>y1-t && y0<y2+t;
}

function updateHoverMap(item, start, end, tolerance) {
  hoverMap[item.constructor.name][item.id()] = {start, end, tolerance, item};
}

let windowCount = 0;
let getWindowColor = () => {
  switch (Math.floor(Math.random() * 4)) {
    case 0: return 'red'; case 1: return 'green';
    case 2: return 'yellow'; case 3: return 'pink';
  }
  return 'white';
}

function drawWindow(ctx, wallStartPoint, window, wallTheta) {
  ctx.beginPath();
  const points = window.endpoints2D(wallStartPoint);
  ctx.moveTo(points.start.x, points.start.y);
  ctx.lineWidth = 8;
  ctx.strokeStyle = hoverId() === window.id() ? 'blue' : 'white';
  ctx.lineTo(points.end.x, points.end.y);
  updateHoverMap(window, points.start, points.end, 5);
  ctx.stroke();
}

function updateDoorHoverMap(door, startpointRight, startpointLeft) {
  updateHoverMap(door, startpointRight, startpointLeft, 15);
}

function drawDoor(ctx, startpoint, door, wallTheta) {
  const initialAngle = wallTheta - 1.5708;
  const endAngle = wallTheta + 1.5708;
  const width = door.width();
  ctx.beginPath();
  ctx.strokeStyle = hoverId() === door.id() ? 'blue' : 'black';

  const distLeft = door.fromPreviousWall() + width;
  const startpointLeft = {x: startpoint.x + distLeft * Math.cos(theta), y: startpoint.y + distLeft * Math.sin(theta)};
  const distRight = door.fromPreviousWall();
  const startpointRight = {x: startpoint.x + distRight * Math.cos(theta), y: startpoint.y + distRight * Math.sin(theta)};
  if (door.hingeRight()) {
    ctx.moveTo(startpointLeft.x, startpointLeft.y);
    ctx.arc(startpointLeft.x, startpointLeft.y, width, endAngle, initialAngle, false);
    ctx.lineTo(startpointLeft.x, startpointLeft.y);
  } else {
    ctx.moveTo(startpointRight.x, startpointRight.y);
    ctx.arc(startpointRight.x, startpointRight.y, width, initialAngle, endAngle, false);
    ctx.lineTo(startpointRight.x, startpointRight.y);
  }
  updateDoorHoverMap(door, startpointRight, startpointLeft);

  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.stroke();
}

function drawLine(ctx, line, color, width) {
  if (line === undefined) return;
  color = color ||  'black';
  width = width || 10;
  ctx.beginPath();
  ctx.strokeStyle = hoverId() === line.id() ? 'blue' : color;
  ctx.lineWidth = width;
  ctx.moveTo(line.startVertex().x(), line.startVertex().y());
  ctx.lineTo(line.endVertex().x(), line.endVertex().y());
  ctx.stroke();
}

function drawMeasurmentValue(ctx, line) {
  if (line === undefined) return;
  const mindpoint = line.midpoint();
  ctx.fillStyle = "black";
  ctx.fillText(line.length(), mindpoint.x(), mindpoint.y());
  ctx.stroke()
}

const measurementLineWidth = 1;
function drawMeasurment(ctx, measurement)  {
  const lines = measurement.I();
  try {
    drawLine(ctx, lines.startLine, 'blue', measurementLineWidth);
    drawLine(ctx, lines.endLine, 'blue', measurementLineWidth);
    drawLine(ctx, lines.outer, 'blue', measurementLineWidth);
    drawLine(ctx, lines.inner, 'blue', measurementLineWidth);
    drawMeasurmentValue(ctx, lines.outer);
    drawMeasurmentValue(ctx, lines.inner);
  } catch (e) {
    console.log('Measurement render error:', e);
  }
}

function drawWall(ctx, wall) {
  const startpoint = wall.startVertex().point();
  r =  wall.length();
  theta = wall.radians();
  ctx.beginPath();
  ctx.moveTo(startpoint.x, startpoint.y);
  ctx.lineWidth = 10;
  ctx.strokeStyle = hoverId() === wall.id() ? 'blue' : 'black';
  const endpoint = wall.endVertex().point();
  ctx.lineTo(endpoint.x, endpoint.y);
  ctx.stroke();
  drawMeasurment(ctx, wall.measurement());
  updateHoverMap(wall, startpoint, endpoint, 5);
  drawDoor(ctx, startpoint, wall.doors()[0], wall.radians());
  drawWindow(ctx, startpoint, wall.windows()[0], wall.radians());
  return endpoint;
}

function drawVertex(ctx, vertex) {
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'black';
  const p = vertex.point();
  ctx.arc(p.x,p.y,10,0, 2*Math.PI);
  ctx.fillStyle = hoverId() === vertex.id() ? 'blue' : 'white';
  ctx.stroke();
  ctx.fill();
  const startpoint = {x: p.x - 8, y: p.y}
  const endpoint = {x: p.x + 8, y: p.y};
  updateHoverMap(vertex, startpoint, endpoint, 8);
}

function draw(canvas) {
  const ctx = canvas.getContext('2d');
  let lastEndPoint = {x: 20, y: 20};

  ctx.beginPath();

  const walls = layout.walls();
  let previousEndpoint;
  let wl = walls.length;
  walls.forEach((wall, index) => {
    lastEndPoint = drawWall(ctx, wall, lastEndPoint);
    const previousWall = walls[(index - 1) % wl];
    if (previousEndpoint)
      drawVertex(ctx, wall.startVertex());
    previousEndpoint = lastEndPoint;
  });
  drawVertex(ctx, walls[0].startVertex());
}

function init() {
  const canvas = document.getElementById('canV');
  const panZ = panZoom(canvas, draw);
  panZ.onMove(onMove);
  panZ.onMousedown(onMousedown);
  panZ.onMouseup(onMouseup);
  // draw(canvas);
}

TwoDLayout.init = init;
module.exports = TwoDLayout;
