const Layout2D = require('../two-d/layout/layout.js');
const panZoom = require('../two-d/pan-zoom');
const $t = require('../../../../public/js/utils/$t.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const PopUp = require('../../../../public/js/utils/display/pop-up');
const Properties = require('../config/properties');
const Measurement = require('../../../../public/js/utils/measurement.js');
const StringMathEvaluator = require('../../../../public/js/utils/string-math-evaluator.js');
const Draw2D = require('../two-d/draw.js');
const Vertex2d = require('../two-d/objects/vertex.js');
const Line2d = require('../two-d/objects/line.js');
const EPNTS = require('../../generated/EPNTS.js');
const Snap2d = require('../two-d/objects/snap.js');
const Circle2d = require('../two-d/objects/circle.js');
const SnapLocation2d = require('../two-d/objects/snap-location.js');
const LineMeasurement2d = require('../two-d/objects/line-measurement');
const ThreeDMain = require('three-d-main');
const ThreeDModel = require('../three-d/three-d-model.js');


const localEnv = EPNTS.getEnv() === 'local';
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

du.on.match('enter,focusout', '.value-2d', (elem) => {
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
      // panZ.once();
      return;
    case 'cabinet':
      const cabinet = props.obj.payload();
      const cabCnt = du.find(`.cabinet-dem-cnt[cabinet-id='${cabinet.id()}']`);
      if (cabCnt) {
        const input = du.find.down(`input[name='${props.key}']`, cabCnt);
        input.value = props.display;
      }
      cabinet[props.key](props.value);
      ThreeDMain.update(cabinet)
      return;
  }
  if (props.obj.payload && props.obj.payload() === 'placeholder') {
    if (props.key === 'thickness') props.key = 'height';
    props.obj = props.obj.snap2d.top().object();
  }
  props.obj.snap2d.top()[props.key](props.value);
  elem.value = props.display;
  // props.obj.snap2d.top().update();
  // panZ.once();
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
  obj.snap2d.top().onChange(() => console.log('snap on change???????'));
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
  event.lastImagePoint = new Vertex2d(lastImagePoint);
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
registerQuickChangeFunc('SnapLocation2d', (snapLoc, event) => {
  if (!snapLoc.disconnect()) {
    const possible = layout.atWall(event.lastImagePoint);
    if (possible instanceof Line2d) {
      snapLoc.pairWith(possible);
      snapLoc.parent().move(event.lastImagePoint);
    } else if (possible instanceof Vertex2d) {
      snapLoc.pairWith(possible);
      snapLoc.move(possible);
    }
    else snapLoc.pairWith(new Vertex2d(event.lastImagePoint));
  }
});
registerQuickChangeFunc('Door2D', (door) => door.hinge(true));

function hoverId () {
  return hovering ? hovering.toString() : undefined;
}


const templateMap = {};
function getTemplate(item) {
  const isSnap = item instanceof Snap2d;
  const cxtrName = item.constructor.name;
  const templateLocation = `2d/pop-up/${isSnap ? 'snap-2d' : cxtrName.toKebab()}`;
  if (templateMap[templateLocation] === undefined) {
    templateMap[templateLocation] = new $t(templateLocation);
  }
  return templateMap[templateLocation];
}

function display(value) {
  return new Measurement(value).display();
}

let which;
let snapLoc;
let snapLocScope = {
  partner: () => snapLoc && (snapLoc.pairedWith() || snapLoc.courting()),
  snapPartner: () => snapLocScope.partner() instanceof SnapLocation2d,
  selected: () => snapLocScope.partner() && (which === snapLocScope.name1() ? snapLoc :
    (which === snapLocScope.name2() ? snapLocScope.partner() : undefined)),
  targetObject: () => {const sl = snapLocScope.selected(); return (sl && sl.parent()) || snapLoc},
  name1: () => snapLoc && snapLoc.parent().parent().name(),
  name2: () => {
    const partner = snapLocScope.partner();
    return partner instanceof SnapLocation2d && partner.parent().parent().name();
  },
  angle: () => {
    if (!snapLoc) return hovering.parent().angle()
    const partner = snapLocScope.partner();
    if (!partner) return snapLoc.parent().angle();
    if (which === snapLocScope.name1()) return snapLoc.parent().angle();
    if (which === snapLocScope.name2()) return partner.parent().angle();
    return 0;
  }
}

function updateSnapLocDisplay(elem) {
  const angleElem = du.find.closest('[name="angle"]', elem);
  angleElem.value = snapLocScope.angle();
}

du.on.match('change', '[name="which"]', (elem) => {
  which = elem.value
  hovering = snapLocScope.targetObject();
  const angleElem = du.find.closest('[name="angle"]', elem);
  angleElem.previousElementSibling.innerText = which !== 'Both' ? 'Angle' : 'Rotate';
  updateSnapLocDisplay(elem);
  panZ.once();
});

du.on.match('change', '[member="snap-loc"][name="fix"]', (elem) => {
  const angleElem = du.find.closest('[name="angle"]', elem);
  if (elem.checked) {
    const center = hovering.center().copy();
    snapLoc = hovering;
    hovering.pairWith(center);
    angleElem.previousElementSibling.innerText = 'Rotate';
  } else {
    hovering.disconnect();
    snapLoc = null;
    angleElem.previousElementSibling.innerText = 'Angle';
  }
  panZ.once();
});


du.on.match('enter', '[member="snap-loc"][name="angle"]', (elem) => {
  const radians = Math.toRadians(Number.parseFloat(elem.value || 0));
  let selected = snapLocScope.selected();
  if (selected || !snapLoc) {
    selected ||= hovering;
    selected.disconnect();
    selected.setRadians(radians);
    hovering = selected;
    snapLoc = null;
    du.find.closest('.which-radio-cnt', elem).hidden = true;
    du.find.closest('.fix-cnt', elem).hidden = false;
  } else snapLoc.rotateAround(radians);
  panZ.once();
});

du.on.match('enter', '[member="snap-loc"][name="x"],[member="snap-loc"][name="y"]', (elem) => {
  const value = new Measurement(elem.value || 0, true).decimal();
  const coord = elem.getAttribute('name');
  let selected = snapLocScope.selected();
  if (selected || !snapLoc) {
    selected ||= hovering;
    selected.disconnect();
    const center = selected.center();
    center[coord](value);
    selected.move(center);
    hovering = selected;
    snapLoc = null;
    du.find.closest('.which-radio-cnt', elem).hidden = true;
    du.find.closest('.fix-cnt', elem).hidden = false;
  } else {
    const center = snapLoc.center();
    center[coord](value);
    snapLoc.move(center);
  }
  panZ.once();
});

function getTemplateScope(cxtrName) {
  const scope = {display, UNITS: Properties.UNITS, target: hovering, lastImagePoint};
  switch (cxtrName) {
    case 'SnapLocation2d':
      hovering.pairWith();
      snapLoc = hovering.pairedWith() ? hovering : null;
      which = null;
      Object.merge(scope, snapLocScope);
      break;
  }
  return scope;
}

function openPopup(event, stdEvent) {
  if (hovering) {
    popupOpen = true;
    const msg = `${hovering.constructor.name}: ${hoverId()}`;
    const scope = getTemplateScope(hovering.constructor.name);
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
    hovering.move && hovering.move(new Vertex2d({x: event.imageX, y: event.imageY}), event);
  return dragging;
}

function hover(event) {
  if (clickHolding) return true;
  const tuple = {x: event.imageX, y: event.imageY};
  hovering = layout.at(new Vertex2d(tuple));
  let found = hovering == true;
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
      ctx.stroke();
    }
  }
  windowDrawMap[lookupKey]();
}

function doorDrawingFunc(startpointLeft, startpointRight) {
  return (door) => {
    const ctx = draw.ctx();
    ctx.beginPath();
    ctx.strokeStyle = hoverId() === door.toString() ? 'green' : 'black';
    const hinge = door.hinge();

    if (hinge === 4) {
      ctx.moveTo(startpointLeft.x(), startpointLeft.y());
      ctx.lineWidth = 8;
      ctx.strokeStyle = hoverId() === door.toString() ? 'green' : 'white';
      ctx.lineTo(startpointRight.x(), startpointRight.y());
      ctx.stroke();
    } else {
      const offset = Math.PI * hinge / 2;
      const initialAngle = (door.wall().radians() + offset) % (2 * Math.PI);
      const endAngle = initialAngle + (Math.PI / 2);

      if (hinge === 0 || hinge === 3) {
        ctx.moveTo(startpointRight.x(), startpointRight.y());
        ctx.arc(startpointRight.x(), startpointRight.y(), door.width(), initialAngle, endAngle, false);
        ctx.lineTo(startpointRight.x(), startpointRight.y());
      } else {
        ctx.moveTo(startpointLeft.x(), startpointLeft.y());
        ctx.arc(startpointLeft.x(), startpointLeft.y(), door.width(), endAngle, initialAngle, true);
        ctx.lineTo(startpointLeft.x(), startpointLeft.y());
      }

      ctx.fillStyle = 'white';
      ctx.fill();
    }
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
    doorDrawMap[lookupKey] = doorDrawingFunc(door.startVertex(), door.endVertex(), initialAngle);
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
  const center = layout.vertices(focalVertex, 2, 3);
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
  ctx.lineWidth = 4;
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
    const vertices = wall.vertices();
    let measLines = {};
    level = measureOnWall(wall.doors(), level);
    level = measureOnWall(wall.windows(), level);
  }
  const measurement = new LineMeasurement2d(wall, undefined, undefined, layout.reconsileLength(wall));
  drawMeasurement(measurement, level, wall.startVertex());

  return endpoint;
}

function drawVertex(vertex) {
  const hovering = hoverId() === vertex.toString();
  const fillColor = hovering ? 'green' : 'white';
  const p = vertex.point();
  const radius = hovering ? 6 : 4;
  const circle = new Circle2d(radius, p);
  draw.circle(circle, 'black', fillColor);
}

function drawObjects() {
  let target;
  layout.objects().forEach((obj) => {
    const color = hoverId() === obj.snap2d.top().toString() ? 'green' : 'black';
    draw(obj.snap2d.top(), color, 3);
    obj.snap2d.top().snapLocations().forEach((snapLoc) => {
      const beingHovered = hoverId() === snapLoc.toString();
      const identfied = Snap2d.identfied(snapLoc);
      const snapColor = identfied ? 'red' : (beingHovered ? 'green' :
            (snapLoc.courting() ? 'white' : (snapLoc.pairedWith() ? 'black' : undefined)));
      const hasPartner = snapLoc.courting() || snapLoc.pairedWith();
      const radius = identfied ? 6 : (beingHovered || hasPartner ? 4 : 1.5);
      if (!beingHovered) draw(snapLoc, snapColor, radius);
      else target = {radius, color: snapColor};
    });
  });
  if (target) draw(hovering, target.color, target.radius);
}

function illustrate(canvas) {
  if (layout === undefined) return;
  SnapLocation2d.clear();
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
  drawObjects();
}

let panZ;
function init() {
  const canvas = document.getElementById('two-d-model');
  const height = du.convertCssUnit('80vh');
  canvas.height = height;
  canvas.width = height;
  draw = new Draw2D(canvas);
  panZ = panZoom(canvas, illustrate);
  panZ.onMove(onMove);
  panZ.onMousedown(onMousedown);
  panZ.onMouseup(onMouseup);
  // draw(canvas);
  TwoDLayout.panZoom = panZ;
  ThreeDModel.onRenderObjectUpdate(panZ.once);
  du.on.match('keycombo:Control,z', '*', undo);
  du.on.match('keycombo:Control,Shift,Z', '*', redo);
}

TwoDLayout.init = init;
module.exports = TwoDLayout;
