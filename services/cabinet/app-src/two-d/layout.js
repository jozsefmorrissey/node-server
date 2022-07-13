const Layout2D = require('../objects/layout');
const panZoom = require('./pan-zoom');
const $t = require('../../../../public/js/utils/$t.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const PopUp = require('../../../../public/js/utils/display/pop-up');
const Properties = require('../config/properties');
const Measurement = require('../../../../public/js/utils/measurement.js');
const StringMathEvaluator = require('../../../../public/js/utils/string-math-evaluator.js');
const StateHistory = require('../../../../public/js/utils/services/state-history');
const TwoDLayout = {};

const eval = new StringMathEvaluator({Math}).eval;
const popUp = new PopUp({resize: false});

let layout = new Layout2D();
const currLayoutJson = () => layout.toJson();
const layoutHistory = new StateHistory(currLayoutJson);

let hoverMap;

const resetHoverMap = () => hoverMap = {
    Window2D: {}, Door2D: {}, Wall2D: {}, Vertex2D: {}, LineMeasurment2D: {},
    Object2d: {}, Square2D: {}, Snap2D: {}, SnapLocation2D: {}
  };

const windowLineWidth = 8;
const tolerance = 1;
let lastImagePoint;
let hovering;
let dragging;
let clickHolding = false;
let popupOpen = false;
let measurmentModify = false;
let lastDown = 0;
const selectTimeBuffer = 200;
const quickChangeFuncs = {};

function getPopUpAttrs(elem) {
  const cnt =  du.find.up('[type-2d]', elem);
  if (cnt === undefined) return {};
  const type = cnt.getAttribute('type-2d');
  const key = elem.getAttribute('key');
  const evalVal = eval(elem.value);
  let value, display;
  if (elem.getAttribute('convert') === 'false') {
    value = evalVal;
    display = evalVal;
  } else {
    const measurment = new Measurement(evalVal, true);
    value = measurment.decimal();
    display = measurment.display();
  }
  const id = cnt.id;
  return {
    type,id,key,value,display,
    obj:  Layout2D.get(id),
    point: {
      x: cnt.getAttribute('x'),
      y: cnt.getAttribute('y')
    }
  };
}

du.on.match('enter', '.value-2d', (elem) => {
  const props = getPopUpAttrs(elem);
  props.obj[props.key](props.value);
  elem.value = props.display;
  layoutHistory.forceState();
  panZ.once();
});

du.on.match('change', 'input[name=\'UNIT2\']', (elem) => {
  const props = getPopUpAttrs(elem);
  const input = du.find.closest('.measurment-mod', elem);
  if (input) setTimeout(() =>
      input.value = props.obj.display(), 0);
});

function remove() {
  layout.remove(hovering.id());
  popUp.close();
}

du.on.match('click', '.remove-btn-2d', remove, popUp.container());

du.on.match('click', '.add-door-btn-2d', (elem) => {
  const attrs = getPopUpAttrs(elem);
  const distance = attrs.obj.startVertex().distance(attrs.point);
  attrs.obj.addDoor(distance);
});

du.on.match('click', '.hinge-btn', (elem) => {
  const attrs = getPopUpAttrs(elem);
  attrs.obj.hinge(true);
});

du.on.match('click', '.add-window-btn-2d', (elem) => {
  const attrs = getPopUpAttrs(elem);
  const distance = attrs.obj.startVertex().distance(attrs.point);
  attrs.obj.addWindow(distance);
});

du.on.match('click', '.add-object-btn-2d', (elem) => {
  const props = getPopUpAttrs(elem);
  layout.addObject(props.point);
});

du.on.match('click', '.add-vertex-btn-2d', (elem) => {
  const attrs = getPopUpAttrs(elem);
  const point = hovering.closestPointOnLine(attrs.point);
  attrs.obj.startVertex().nextVertex(point, Layout2D.Wall2D);
});

du.on.match('enter', '.measurment-mod', (elem) => {
  const value = eval(elem.value);
  getPopUpAttrs(elem).obj.modify(value);
  panZ.once();
});

// TODO: define cache better.
function clearCache() {
  measurementIs = {};
}

function undo(target) {
  const state = layoutHistory.back();
  if (state) layout = Layout2D.fromJson(state);
  clearCache();
  panZ.once();
  console.log('undo State:', state);
}

function redo () {
  const state = layoutHistory.forward();
  if (state) layout = Layout2D.fromJson(state);
  clearCache();
  panZ.once();
  console.log(JSON.stringify(layout.toJson(), null, 2));
  console.log('redo State:', state);
}

du.on.match('keycombo:Control,z', '*', undo);
du.on.match('keycombo:Control,Shift,Z', '*', redo);

function registerQuickChangeFunc(type, func) {
  if ((typeof func) === 'function') quickChangeFuncs[type] = func;
}

function onMousedown(event, stdEvent) {
  lastDown = clickHolding ? 0 : new Date().getTime();
  lastImagePoint = {x: event.imageX, y: event.imageY};
  if (stdEvent.button == 0) {
    clickHolding = !popupOpen && (clickHolding || hovering !== undefined);
    return clickHolding;
  } else {
    if (hovering && quickChangeFuncs[hovering.constructor.name]) {
      quickChangeFuncs[hovering.constructor.name](hovering, event, stdEvent);
    }
    return true;
  }
}

function addVertex(hovering, event, stdEvent) {
  const point = hovering.closestPointOnLine({x: event.imageX, y: event.imageY});
  hovering.startVertex().nextVertex(point, Layout2D.Wall2D);
}

registerQuickChangeFunc('Wall2D', addVertex);
registerQuickChangeFunc('Vertex2D', remove);
registerQuickChangeFunc('Window2D', remove);
registerQuickChangeFunc('SnapLocation2D', (snapLoc) => snapLoc.disconnect());
registerQuickChangeFunc('Door2D', (door) => door.hinge(true));

function hoverId () {
  return hovering ? hovering.id() : undefined;
}

const templateMap = {};
function getTemplate(item) {
  const templateLocation = `2d/pop-up/${item.constructor.name.toHypenated()}`;
  if (templateMap[templateLocation] === undefined) {
    templateMap[templateLocation] = new $t(templateLocation);
  }
  return templateMap[templateLocation];
}

function display(value) {
  return new Measurement(value).display();
}

const popupCnt = du.id('controls-2d');
function openPopup(event, stdEvent) {
  if (hovering) {
    if (hovering.constructor.name === 'Snap2D') hovering.pairWithLast();
    popupOpen = true;
    const msg = `${hovering.constructor.name}: ${hovering.id()}`;
    popupCnt.innerHTML = msg;
    const scope = {display, UNITS: Properties.UNITS, target: hovering, lastImagePoint};
    const html = getTemplate(hovering).render(scope);
    popUp.open(html, {x: event.screenX, y: event.screenY});
  }
}

popUp.onClose((elem, event) => {
  setTimeout(() => popupOpen = false, 200);
  const attrs = getPopUpAttrs(du.find.closest('[type-2d]',popUp.container()));
  measurmentModify = attrs.type === 'LineMeasurment2D';
  lastDown = new Date().getTime();
  clickHolding = false;
});

function onMouseup(event, stdEvent) {
  if (stdEvent.button == 0) {
    if (lastDown > new Date().getTime() - selectTimeBuffer) {
      if (hovering) {
        openPopup(event, stdEvent);
      } else {
        measurmentModify = !measurmentModify;
      }
    } else {
      const clickWasHolding = clickHolding;
      clickHolding = false;
      hovering = undefined;
      return clickWasHolding;
    }
  } else {
    console.log('rightClick: do stuff!!');
  }
}

function  drag(event)  {
  dragging = !popupOpen && clickHolding && hovering &&
                      hovering.move && hovering.move({x: event.imageX, y: event.imageY}, event);
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

  if (measurmentModify) {
    check(Object.values(hoverMap.LineMeasurment2D));
    found || check(Object.values(hoverMap.SnapLocation2D));
    found || check(Object.values(hoverMap.Snap2D));
    found || check(Object.values(hoverMap.Object2d));
    found || check(Object.values(hoverMap.Square2D));
  } else {
    check(Object.values(hoverMap.Vertex2D));
    found || check(Object.values(hoverMap.Window2D));
    found || check(Object.values(hoverMap.Door2D));
    found || check(Object.values(hoverMap.Wall2D));
  }

  return found;
}

function onMove(event) {
  layoutHistory.newState();
  const canDrag = !popupOpen && lastDown < new Date().getTime() - selectTimeBuffer * 1.5;
  return (canDrag && drag(event)) || hover(event);
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
  return num / denom < map.tolerance;
}

function withinTolerance(point, map) {
  const t = map.tolerance;
  const start = map.start.point ? map.start.point() : map.start;
  const end = map.end.point ? map.end.point() : map.end;
  const x0 = point.x;
  const y0 = point.y;
  const x1 = start.x > end.x ? end.x : start.x;
  const y1 = start.y > end.y ? end.y : start.y;
  const x2 = start.x < end.x ? end.x : start.x;
  const y2 = start.y < end.y ? end.y : start.y;
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

const windowDrawMap = {};
function drawWindow(ctx, wallStartPoint, window, wallTheta) {
  ctx.beginPath();
  const points = window.endpoints2D(wallStartPoint);
  const lookupKey = window.toString();
  if (windowDrawMap[lookupKey] === undefined) {
    windowDrawMap[lookupKey] = () => {
      ctx.moveTo(points.start.x(), points.start.y());
      ctx.lineWidth = 8;
      ctx.strokeStyle = hoverId() === window.id() ? 'green' : 'blue';
      ctx.lineTo(points.end.x(), points.end.y());
      updateHoverMap(window, points.start, points.end, 5);
      ctx.stroke();
    }
  }
  windowDrawMap[lookupKey]();
}

function updateDoorHoverMap(door, startpointRight, startpointLeft) {
  updateHoverMap(door, startpointRight, startpointLeft, 15);
}

function doorDrawingFunc(ctx, startpointLeft, startpointRight) {
  return (door) => {
    ctx.beginPath();
    ctx.strokeStyle = hoverId() === door.id() ? 'green' : 'black';
    const hinge = door.hinge();

    if (hinge === 4) {
      ctx.moveTo(startpointLeft.x, startpointLeft.y);
      ctx.lineWidth = 8;
      ctx.strokeStyle = hoverId() === door.id() ? 'green' : 'white';
      ctx.lineTo(startpointRight.x, startpointRight.y);
      updateDoorHoverMap(door, startpointRight, startpointLeft, 10);
      ctx.stroke();
    } else {
      const offset = Math.PI * hinge / 2;
      const initialAngle = (door.wall().radians() + offset) % (2 * Math.PI);
      const endAngle = initialAngle + (Math.PI / 2);

      if (hinge === 0 || hinge === 3) {
        ctx.moveTo(startpointRight.x, startpointRight.y);
        ctx.arc(startpointRight.x, startpointRight.y, door.width(), initialAngle, endAngle, false);
        ctx.lineTo(startpointRight.x, startpointRight.y);
      } else {
        ctx.moveTo(startpointLeft.x, startpointLeft.y);
        ctx.arc(startpointLeft.x, startpointLeft.y, door.width(), endAngle, initialAngle, true);
        ctx.lineTo(startpointLeft.x, startpointLeft.y);
      }

      ctx.fillStyle = 'white';
      ctx.fill();
    }
    updateHoverMap(door, startpointRight, startpointLeft, 10);
    ctx.stroke();
  }
}

const doorDrawMap = {};
function drawDoor(ctx, startpoint, door, wallTheta) {
  const lookupKey = door.toString();
  if (doorDrawMap[lookupKey] === undefined) {
    const initialAngle = wallTheta;
    const width = door.width();

    const distLeft = door.fromPreviousWall() + width;
    const startpointLeft = {x: startpoint.x + distLeft * Math.cos(theta), y: startpoint.y + distLeft * Math.sin(theta)};
    const distRight = door.fromPreviousWall();
    const startpointRight = {x: startpoint.x + distRight * Math.cos(theta), y: startpoint.y + distRight * Math.sin(theta)};
    doorDrawMap[lookupKey] = doorDrawingFunc(ctx, startpointLeft, startpointRight, initialAngle);
  }
  doorDrawMap[lookupKey](door);
}

function drawLine(ctx, line, color, width) {
  if (line === undefined) return;
  color = color ||  'black';
  width = width || 10;
  ctx.beginPath();
  ctx.strokeStyle = hoverId() === line.id() ? 'green' : color;
  ctx.lineWidth = width;
  ctx.moveTo(line.startVertex().x(), line.startVertex().y());
  ctx.lineTo(line.endVertex().x(), line.endVertex().y());
  ctx.stroke();
}

const blank = 40;
const hblank = blank/2;
function drawMeasurmentValue(ctx, line, midpoint, measurment) {
  if (line === undefined) return;
  midpoint = line.midpoint();

  ctx.save();
  ctx.lineWidth = 0;
  const length = measurment.display();
  const textLength = length.length;
  ctx.translate(midpoint.x(), midpoint.y());
  ctx.rotate(line.radians());
  ctx.beginPath();
  ctx.fillStyle = hoverId() === measurment.id() ? 'green' : "white";
  ctx.strokeStyle = 'white';
  ctx.rect(textLength * -3, -8, textLength * 6, 16);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'black';
  ctx.fillStyle =  'black';
  ctx.fillText(length, 0, 0);
  ctx.stroke()
  ctx.restore();
}

const measurmentLineMap = {};
const getMeasurmentLine = (vertex1, vertex2) => {
  const lookupKey = `${vertex1.id()} => ${vertex2.id()}`;
  if (measurmentLineMap[lookupKey] === undefined) {
    measurmentLineMap[lookupKey] = new Layout2D.Line2D(vertex1, vertex2);
  }
  return measurmentLineMap[lookupKey];
}

let measurmentValues = [];
function measurementValueToDraw(ctx, line, midpoint, measurment) {
  measurmentValues.push({ctx, line, midpoint, measurment});
}

function drawMeasurmentValues() {
  let values = measurmentValues;
  measurmentValues = [];
  for (let index = 0; index < values.length; index += 1) {
    let m = values[index];
    drawMeasurmentValue(m.ctx, m.line, m.midpoint, m.measurment);
  }
}

const measurementLineWidth = 3;
let measurementIs = {};
function drawMeasurment(ctx, measurement, level, focalVertex)  {
  const lookupKey = `${measurement.line().toString()}-${level}`;
  if (measurementIs[lookupKey] === undefined) {
    measurementIs[lookupKey] = measurement.I(level);
  }
  const lines = measurementIs[lookupKey];
  const center = focalVertex.center(2, 3);
  const measurementColor = hoverId() === measurement.id() ? 'green' : 'grey';
  try {
    ctx.beginPath();
    const isWithin = layout.within(lines.outer.midpoint());
    const line = isWithin ? lines.inner : lines.outer;//lines.furtherLine(center);
    const midpoint = Layout2D.Vertex2D.center(line.startLine.endVertex(), line.endLine.endVertex());
    if (measurmentModify || popupOpen) {
      drawLine(ctx, line.startLine, measurementColor, measurementLineWidth);
      drawLine(ctx, line.endLine, measurementColor, measurementLineWidth);
      drawLine(ctx, line, measurementColor, measurementLineWidth);
      ctx.stroke();
      updateHoverMap(measurement, midpoint, midpoint, 15);
    }
    measurementValueToDraw(ctx, line, midpoint, measurement);
    return line;
  } catch (e) {
    console.error('Measurement render error:', e);
  }
}

function measureOnWall(ctx, list, level) {
  for (let index = 0; index < list.length; index += 1) {
    let item = list[index];
    const wall = item.wall();
    const points = item.endpoints2D();
    const line1 = getMeasurmentLine(wall.startVertex(), points.start);
    const line2 = getMeasurmentLine(points.end, wall.endVertex());
    line1.measurement().modificationFunction(item.fromPreviousWall);
    line2.measurement().modificationFunction(item.fromNextWall);
    drawMeasurment(ctx, line1.measurement(), level, wall.startVertex())
    drawMeasurment(ctx, line2.measurement(), level, wall.startVertex())
    level += 2;
  }
  return level;
}

function includeDetails() {
  return !dragging && (measurmentModify || popupOpen)
}

function drawWall(ctx, wall) {
  const startpoint = wall.startVertex().point();
  r =  wall.length();
  theta = wall.radians();
  ctx.beginPath();
  ctx.moveTo(startpoint.x, startpoint.y);
  ctx.lineWidth = 10;
  ctx.strokeStyle = hoverId() === wall.id() ? 'green' : 'black';
  const endpoint = wall.endVertex().point();
  ctx.lineTo(endpoint.x, endpoint.y);
  ctx.stroke();

  wall.doors().forEach((door) =>
    drawDoor(ctx, startpoint, door, wall.radians()));
  wall.windows().forEach((window) =>
    drawWindow(ctx, startpoint, window, wall.radians()));

  let level = 4;
  if (includeDetails()) {
    const verticies = wall.verticies();
    let measLines = {};
    level = measureOnWall(ctx, wall.doors(), level);
    level = measureOnWall(ctx, wall.windows(), level);
  }
  drawMeasurment(ctx, wall.measurement(), level, wall.startVertex());

  updateHoverMap(wall, startpoint, endpoint, 5);

  return endpoint;
}

function drawCircle(ctx, circle, lineColor, fillColor, lineWidth) {
  const center = circle.center();
  ctx.beginPath();
  ctx.lineWidth = lineWidth || 2;
  ctx.strokeStyle = lineColor || 'black';
  ctx.fillStyle = fillColor || 'white';
  ctx.arc(center.x(),center.y(), circle.radius(),0, 2*Math.PI);
  ctx.stroke();
  ctx.fill();
}

function drawVertex(ctx, vertex) {
  const fillColor = hoverId() === vertex.id() ? 'green' : 'white';
  const p = vertex.point();
  const radius = 10;
  const circle = new Layout2D.Circle2D(radius, p);
  drawCircle(ctx, circle, 'black', fillColor);
  updateHoverMap(vertex, p, p, 12);
}

function drawSnapLocation(ctx, locations, color) {
  for (let index = 0; index < locations.length; index += 1) {
    const loc = locations[index];
    const c = hoverId() === loc.id() ? 'green' : (color || loc.color());
    drawCircle(ctx, loc.circle(), 'black', c);
    const vertex = loc.vertex();
    updateHoverMap(loc, vertex.point(), vertex.point(), 8);
  }
}

function drawSquare(ctx, snap) {
  const square = snap.object();
  ctx.save();
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'black';
  ctx.fillStyle = hoverId() === snap.id() ? 'green' : 'white';

  const center = square.center();
  ctx.translate(center.x(), center.y());
  ctx.rotate(square.radians());
  ctx.rect(square.offsetX(true), square.offsetY(true), square.width(), square.height());
  updateHoverMap(snap, center, center, 30);
  ctx.stroke();
  ctx.fill();

  ctx.beginPath();
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'black';
  ctx.fillStyle =  'black';
  textStart = snap.leftCenter();
  ctx.fillText('HEllo', 0, square.height()/4);
  ctx.stroke()

  ctx.restore();

  const potentalSnap = snap.potentalSnapLocation();
  drawSnapLocation(ctx, snap.snapLocations.paired(), 'black');
  if (potentalSnap) drawSnapLocation(ctx, [potentalSnap], 'white');
  Layout2D.SnapLocation2D.active(snap.snapLocations.notPaired());
}

function drawObject(ctx, object) {
  switch (object.object().constructor.name) {
    case 'Square2D':
      drawSquare(ctx, object);
      break;
    case 'Line2D':
      drawLine(ctx, object);
      break;
    case 'Circle2D':
      drawCircle(ctx, object);
      break;
    case 'Layout2D':
      drawLayout(ctx, object); // NOT IMPLEMENTED YET!!!
      break;
    default:
      throw new Error(`Cannot draw object with constructor: ${object.constructor.name}`);
  }
}

function draw(canvas) {
  // if (!dragging && !popupOpen && initial < 0) return;
  Layout2D.SnapLocation2D.clear();
  resetHoverMap();
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
  }, true);
  drawVertex(ctx, walls[0].startVertex());
  drawMeasurmentValues();
  layout.objects().forEach((obj) => drawObject(ctx, obj.topview()));
}

let panZ;
function init() {
  const canvas = document.getElementById('two-d-model');
  panZ = panZoom(canvas, draw);
  panZ.onMove(onMove);
  panZ.onMousedown(onMousedown);
  panZ.onMouseup(onMouseup);
  // draw(canvas);
}

TwoDLayout.init = init;
module.exports = TwoDLayout;
