const Layout2D = require('../objects/layout');
const panZoom = require('./pan-zoom');
const $t = require('../../../../public/js/utils/$t.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const PopUp = require('../../../../public/js/utils/display/pop-up');
const Properties = require('../config/properties');
const Measurement = require('../../../../public/js/utils/measurement.js');
const StringMathEvaluator = require('../../../../public/js/utils/string-math-evaluator.js');
const Draw2D = require('./draw.js');
const Vertex2d = require('../two-d/objects/vertex.js');
const Line2d = require('../two-d/objects/line.js');
const Snap2d = require('../two-d/objects/snap.js');
const Circle2d = require('../two-d/objects/circle.js');
const SnapLocation2d = require('../two-d/objects/snap-location.js');
const LineMeasurement2d = require('../two-d/objects/line-measurement');

// TODO: Rename
const TwoDLayout = {};

let draw;
const eval = new StringMathEvaluator({Math}).eval;
const popUp = new PopUp({resize: false});

let layout;
TwoDLayout.set = (l) => {
  if (l instanceof Layout2D) {
    layout = l;
    if (panZ) panZ.once();
  }
}

let hoverMap;

const resetHoverMap = () => hoverMap = {
    Window2D: {}, Door2D: {}, Wall2D: {}, Vertex2d: {}, LineMeasurement2d: {},
    Object2d: {}, Square2d: {}, Snap2d: {}, SnapLocation2d: {}
  };

const windowLineWidth = 8;
const tolerance = 1;
let lastImagePoint;
let hovering;
let dragging;
let clickHolding = false;
let popupOpen = false;
let measurementModify = false;
let lastDown = 0;
const selectTimeBuffer = 200;
const quickChangeFuncs = {};

function getPopUpAttrs(elem) {
  const cnt =  du.find.up('[type-2d]', elem);
  if (cnt === undefined) return {};
  const type = cnt.getAttribute('type-2d');
  const key = elem.getAttribute('key');
  const raw = elem.type === 'input' ? eval(elem.value) : elem.value;
  let value, display;
  if (elem.getAttribute('convert') === 'false') {
    value = raw;
    display = raw;
  } else {
    const measurement = new Measurement(raw, true);
    value = measurement.decimal();
    display = measurement.display();
  }
  const id = cnt.id;
  return {
    type,id,key,value,display,raw,
    obj:  Layout2D.get(id),
    point: {
      x: cnt.getAttribute('x'),
      y: cnt.getAttribute('y')
    }
  };
}

du.on.match('enter', '.value-2d', (elem) => {
  const props = getPopUpAttrs(elem);
  const member = elem.getAttribute('member');
  switch (member) {
    case 'object':
      props.obj[props.key](props.raw);
      const cab = props.obj.payload();
      if (cab && cab.constructor.name === 'Cabinet') {
        const cabDemCnt = du.find(`.cabinet-dem-cnt[cabinet-id='${cab.id()}']`);
        const idInput = du.find.closest('.cabinet-id-input', cabDemCnt);
        idInput.value = props.raw;
      }
      panZ.once();
      return;
    case 'cabinet':
      const cabinet = props.obj.payload();
      const cabCnt = du.find(`.cabinet-dem-cnt[cabinet-id='${cabinet.id()}']`);
      if (cabCnt) {
        const input = du.find.down(`input[name='${props.key}']`, cabCnt);
        input.value = props.display;
      }
      cabinet[props.key](props.value);
      const poly = props.obj.topview();
      poly[props.key === 'thickness' ? 'height' : props.key](props.value);
      poly.update();
      panZ.once();
      return;
  }
  if (props.obj.payload && props.obj.payload() === 'placeholder') {
    if (props.key === 'thickness') props.key = 'height';
    props.obj = props.obj.topview().object();
  }

  props.obj.topview()[props.key](props.value);
  elem.value = props.display;
  props.obj.topview().update();
  panZ.once();
});

du.on.match('change', 'input[name=\'UNIT2\']', (elem) => {
  const props = getPopUpAttrs(elem);
  const input = du.find.closest('.measurement-mod', elem);
  if (input) setTimeout(() =>
      input.value = props.obj.display(), 0);
});

function remove() {
  if (hovering.parent) {
    if (hovering.parent().payload().constructor.name === 'Cabinet') {
      const cabinet = hovering.parent().payload();
      const cabinetHeader = du.find(`.cabinet-header[cabinet-id='${cabinet.id()}']`);
      const removeButton = du.find.closest('.expandable-item-rm-btn', cabinetHeader)
      if (removeButton) removeButton.click();
      else console.warn('Remove button for cabinet should be present but is not present');
    }
    layout.remove(hovering.parent().id());
  } else {
    layout.remove(hovering.id());
  }
  popUp.close();
  TwoDLayout.panZoom.once();
}

du.on.match('click', '.remove-btn-2d', remove, popUp.container());

du.on.match('click', '.add-door-btn-2d', (elem) => {
  const attrs = getPopUpAttrs(elem);
  const distance = attrs.obj.startVertex().distance(attrs.point);
  attrs.obj.addDoor(distance);
  panZ.once();
});

du.on.match('click', '.hinge-btn', (elem) => {
  const attrs = getPopUpAttrs(elem);
  attrs.obj.hinge(true);
  panZ.once();
});

du.on.match('click', '.add-window-btn-2d', (elem) => {
  const attrs = getPopUpAttrs(elem);
  const distance = attrs.obj.startVertex().distance(attrs.point);
  attrs.obj.addWindow(distance);
  panZ.once();
});

du.on.match('click', '.add-object-btn-2d', (elem) => {
  const props = getPopUpAttrs(elem);
  const obj = layout.addObject(props.point, 'placeholder');
  obj.topview().onChange(console.log);
  panZ.once();
});

du.on.match('click', '.add-vertex-btn-2d', (elem) => {
  const attrs = getPopUpAttrs(elem);
  const point = hovering.closestPointOnLine(attrs.point);
  layout.addVertex(point, hovering);
  panZ.once();
});

du.on.match('enter', '.measurement-mod', (elem) => {
  const value = eval(elem.value);
  getPopUpAttrs(elem).obj.modify(value);
  panZ.once();
});

// TODO: define cache better.
function clearCache() {
  measurementIs = {};
}

function undo(target) {
  layout.history().back();
  clearCache();
  panZ.once();
}

function redo () {
  layout.history().forward();
  clearCache();
  panZ.once();
}

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
  const point = {x: event.imageX, y: event.imageY};
  layout.addVertex(point, hovering);
}

registerQuickChangeFunc('Wall2D', addVertex);
registerQuickChangeFunc('Vertex2d', remove);
registerQuickChangeFunc('Window2D', remove);
registerQuickChangeFunc('SnapLocation2d', (snapLoc) => snapLoc.disconnect());
registerQuickChangeFunc('Door2D', (door) => door.hinge(true));

function hoverId () {
  return hovering ? hovering.toString() : undefined;
}

const templateMap = {};
function getTemplate(item) {
  const isSnap = item instanceof Snap2d;
  const templateLocation = `2d/pop-up/${isSnap ? 'snap-2d' : item.constructor.name.toKebab()}`;
  if (templateMap[templateLocation] === undefined) {
    templateMap[templateLocation] = new $t(templateLocation);
  }
  return templateMap[templateLocation];
}

function display(value) {
  return new Measurement(value).display();
}

function openPopup(event, stdEvent) {
  if (hovering) {
    if (hovering instanceof Snap2d) hovering.pairWithLast();
    popupOpen = true;
    const msg = `${hovering.constructor.name}: ${hoverId()}`;
    const scope = {display, UNITS: Properties.UNITS, target: hovering, lastImagePoint};
    const html = getTemplate(hovering).render(scope);
    popUp.open(html, {x: event.screenX, y: event.screenY});
  }
}

popUp.onClose((elem, event) => {
  setTimeout(() => popupOpen = false, 200);
  const attrs = getPopUpAttrs(du.find.closest('[type-2d]',popUp.container()));
  measurementModify = attrs.type === 'LineMeasurement2d';
  lastDown = new Date().getTime();
  clickHolding = false;
  if (layout) layout.history().newState();
});

function onMouseup(event, stdEvent) {
  if (stdEvent.button == 0) {
    if (lastDown > new Date().getTime() - selectTimeBuffer) {
      if (hovering) {
        setTimeout(() => openPopup(event, stdEvent), 5);
      } else {
        measurementModify = !measurementModify;
      }
    } else {
      const clickWasHolding = clickHolding;
      clickHolding = false;
      hovering = undefined;
      if (layout) layout.history().newState();
      return clickWasHolding;
    }
  } else {
    console.log('rightClick: do stuff!!');
    if (layout) layout.history().newState();
  }
}

let pending = 0;
function  drag(event)  {
  const dragging = !popupOpen && clickHolding && hovering;
  if (dragging)
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

  if (measurementModify) {
    check(Object.values(hoverMap.LineMeasurement2d));
    found || check(Object.values(hoverMap.SnapLocation2d));
    found || check(Object.values(hoverMap.Snap2d));
    found || check(Object.values(hoverMap.Object2d));
    found || check(Object.values(hoverMap.Square2d));
  } else {
    check(Object.values(hoverMap.Vertex2d));
    found || check(Object.values(hoverMap.Window2D));
    found || check(Object.values(hoverMap.Door2D));
    found || check(Object.values(hoverMap.Wall2D));
  }

  return found;
}

function onMove(event) {
  if (layout === undefined) return;
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
  let group;
  if (item instanceof Snap2d) group = 'Snap2d';
  else group = item.constructor.name;
  hoverMap[group][item.toString()] = {start, end, tolerance, item};
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
function drawWindow(wallStartPoint, window, wallTheta) {
  draw.beginPath();
  const points = window.endpoints2D(wallStartPoint);
  const lookupKey = window.toString();
  const ctx = draw.ctx();
  if (windowDrawMap[lookupKey] === undefined) {
    windowDrawMap[lookupKey] = () => {
      ctx.moveTo(points.start.x(), points.start.y());
      ctx.lineWidth = 8;
      ctx.strokeStyle = hoverId() === window.toString() ? 'green' : 'blue';
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

function doorDrawingFunc(startpointLeft, startpointRight) {
  return (door) => {
    const ctx = draw.ctx();
    ctx.beginPath();
    ctx.strokeStyle = hoverId() === door.toString() ? 'green' : 'black';
    const hinge = door.hinge();

    if (hinge === 4) {
      ctx.moveTo(startpointLeft.x, startpointLeft.y);
      ctx.lineWidth = 8;
      ctx.strokeStyle = hoverId() === door.toString() ? 'green' : 'white';
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
function drawDoor(startpoint, door, wallTheta) {
  const lookupKey = door.toString();
  if (doorDrawMap[lookupKey] === undefined) {
    const initialAngle = wallTheta;
    const width = door.width();

    const distLeft = door.fromPreviousWall() + width;
    const startpointLeft = {x: startpoint.x + distLeft * Math.cos(theta), y: startpoint.y + distLeft * Math.sin(theta)};
    const distRight = door.fromPreviousWall();
    const startpointRight = {x: startpoint.x + distRight * Math.cos(theta), y: startpoint.y + distRight * Math.sin(theta)};
    doorDrawMap[lookupKey] = doorDrawingFunc(startpointLeft, startpointRight, initialAngle);
  }
  doorDrawMap[lookupKey](door);
}

const blank = 40;
const hblank = blank/2;
function drawMeasurementValue(line, midpoint, measurement) {
  if (line === undefined) return;
  const ctx = draw.ctx();
  midpoint = line.midpoint();

  ctx.save();
  ctx.lineWidth = 0;
  const length = measurement.display();
  const textLength = length.length;
  ctx.translate(midpoint.x(), midpoint.y());
  ctx.rotate(line.radians());
  ctx.beginPath();
  ctx.fillStyle = hoverId() === measurement.toString() ? 'green' : "white";
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

const measurementLineMap = {};
const getMeasurementLine = (vertex1, vertex2) => {
  const lookupKey = `${vertex1} => ${vertex2}`;
  if (measurementLineMap[lookupKey] === undefined) {
    const line = new Line2d(vertex1, vertex2);
    measurementLineMap[lookupKey] = new LineMeasurement2d(line)
  }
  return measurementLineMap[lookupKey];
}

let measurementValues = [];
function measurementValueToDraw(line, midpoint, measurement) {
  measurementValues.push({line, midpoint, measurement});
}

function drawMeasurementValues() {
  let values = measurementValues;
  measurementValues = [];
  for (let index = 0; index < values.length; index += 1) {
    let m = values[index];
    drawMeasurementValue(m.line, m.midpoint, m.measurement);
  }
}

const measurementLineWidth = 3;
let measurementIs = {};
function drawMeasurement(measurement, level, focalVertex)  {
  const lookupKey = `${measurement.toString()}-[${level}]`;
  // if (measurementIs[lookupKey] === undefined) {
    measurementIs[lookupKey] = measurement.I(level);
  // }
  const lines = measurementIs[lookupKey];
  const center = layout.verticies(focalVertex, 2, 3);
  const measurementColor = hoverId() === measurement.toString() ? 'green' : 'grey';
  try {
    draw.beginPath();
    const isWithin = layout.within(lines.furtherLine().midpoint());
    const line = isWithin ? lines.closerLine() : lines.furtherLine();
    const midpoint = Vertex2d.center(line.startLine.endVertex(), line.endLine.endVertex());
    if (measurementModify || popupOpen) {
      draw.line(line.startLine, measurementColor, measurementLineWidth);
      draw.line(line.endLine, measurementColor, measurementLineWidth);
      draw.line(line, measurementColor, measurementLineWidth);
      updateHoverMap(measurement, midpoint, midpoint, 15);
    }
    measurementValueToDraw(line, midpoint, measurement);
    return line;
  } catch (e) {
    console.error('Measurement render error:', e);
  }
}

function measureOnWall(list, level) {
  for (let index = 0; index < list.length; index += 1) {
    let item = list[index];
    const wall = item.wall();
    const points = item.endpoints2D();
    const measureLine1 = getMeasurementLine(wall.startVertex(), points.start);
    const measureLine2 = getMeasurementLine(points.end, wall.endVertex());
    measureLine1.modificationFunction(item.fromPreviousWall);
    measureLine2.modificationFunction(item.fromNextWall);
    drawMeasurement(measureLine1, level, wall.startVertex())
    drawMeasurement(measureLine2, level, wall.startVertex())
    level += 4;
  }
  return level;
}

function includeDetails() {
  return !dragging && (measurementModify || popupOpen)
}

function drawWall(wall) {
  const ctx = draw.ctx();
  const startpoint = wall.startVertex().point();
  r =  wall.length();
  theta = wall.radians();
  ctx.beginPath();
  ctx.moveTo(startpoint.x, startpoint.y);
  ctx.lineWidth = 10;
  ctx.strokeStyle = hoverId() === wall.toString() ? 'green' : 'black';
  const endpoint = wall.endVertex().point();
  ctx.lineTo(endpoint.x, endpoint.y);
  ctx.stroke();

  wall.doors().forEach((door) =>
    drawDoor(startpoint, door, wall.radians()));
  wall.windows().forEach((window) =>
    drawWindow(startpoint, window, wall.radians()));

  let level = 8;
  if (includeDetails()) {
    const verticies = wall.verticies();
    let measLines = {};
    level = measureOnWall(wall.doors(), level);
    level = measureOnWall(wall.windows(), level);
  }
  const measurement = new LineMeasurement2d(wall, undefined, undefined, layout.reconsileLength(wall));
  drawMeasurement(measurement, level, wall.startVertex());

  updateHoverMap(wall, startpoint, endpoint, 5);

  return endpoint;
}

function drawVertex(vertex) {
  const fillColor = hoverId() === vertex.toString() ? 'green' : 'white';
  const p = vertex.point();
  const radius = 10;
  const circle = new Circle2d(radius, p);
  draw.circle(circle, 'black', fillColor);
  updateHoverMap(vertex, p, p, 12);
}

function snapLocColor(snapLoc) {
  switch (snapLoc.location()) {
    case "backRight": return 'red';
    case "frontRight": return 'yellow';
    case "frontLeft": return 'green';
    case "backLeft": return 'blue';
    case "backCenter": return 'purple';
    case "diagonalRight": return 'lime';
    case "diagonalLeft": return 'azure';
    default: return "grey"
  }
}

function drawSnapLocation(locations, color) {
  for (let index = 0; index < locations.length; index += 1) {
    const loc = locations[index];
    const c = hoverId() === loc.toString() ? 'green' : (color || snapLocColor(loc));
    draw.circle(loc.circle(), 'black', c);
    const vertex = loc.vertex();
    updateHoverMap(loc, vertex.point(), vertex.point(), 8);
  }
}

let showAllSnapLocations = true;
function drawObject(object) {
  let center, coolor, potentalSnap;
  switch (object.object().constructor.name) {
    case 'Square2d':
      const square = object.object();
      center = square.center();
      updateHoverMap(object, center, center, 30);
      color = hoverId() === object.toString() ? 'green' : 'white';
      draw.square(square, color, object.parent().name());
      potentalSnap = object.potentalSnapLocation();
      if (showAllSnapLocations)
        drawSnapLocation(object.snapLocations());

      drawSnapLocation(object.snapLocations.paired(), 'black');
      if (potentalSnap instanceof SnapLocation2d) drawSnapLocation([potentalSnap], 'white');
      SnapLocation2d.active(object.snapLocations.notPaired());
      break;
    case 'Polygon2d':
      const poly = object.object();
      center = poly.center();
      updateHoverMap(object, center, center, 30);
      color = hoverId() === object.toString() ? 'green' : 'black';
      draw(poly, color, object.parent().name());
      potentalSnap = object.potentalSnapLocation();
      if (showAllSnapLocations)
        drawSnapLocation(object.snapLocations());

      drawSnapLocation(object.snapLocations.paired(), 'black');
      if (potentalSnap instanceof SnapLocation2d) drawSnapLocation([potentalSnap], 'white');
      SnapLocation2d.active(object.snapLocations.notPaired());
      break;
    case 'Line2d':
      draw.line(object);
      break;
    case 'Circle2d':
      draw.circle(object);
      break;
    case 'Layout2d':
      drawLayout(object); // NOT IMPLEMENTED YET!!!
      break;
    default:
      throw new Error(`Cannot draw object with constructor: ${object.object().constructor.name}`);
  }
}

function illustrate(canvas) {
  if (layout === undefined) return;
  SnapLocation2d.clear();
  resetHoverMap();
  let lastEndPoint = {x: 20, y: 20};

  draw.beginPath();
  const walls = layout.walls();
  let previousEndpoint;
  let wl = walls.length;
  walls.forEach((wall, index) => {
    lastEndPoint = drawWall(wall, lastEndPoint);
    const previousWall = walls[(index - 1) % wl];
    if (previousEndpoint)
      drawVertex(wall.startVertex());
    previousEndpoint = lastEndPoint;
  }, true);
  drawVertex(walls[0].startVertex());
  drawMeasurementValues();
  layout.objects().forEach((obj) => drawObject(obj.topview()));
}

let panZ;
function init() {
  const canvas = document.getElementById('two-d-model');
  draw = new Draw2D(canvas);
  panZ = panZoom(canvas, illustrate);
  panZ.onMove(onMove);
  panZ.onMousedown(onMousedown);
  panZ.onMouseup(onMouseup);
  // draw(canvas);
  TwoDLayout.panZoom = panZ;
  du.on.match('keycombo:Control,z', '*', undo);
  du.on.match('keycombo:Control,Shift,Z', '*', redo);
}

TwoDLayout.init = init;
module.exports = TwoDLayout;
