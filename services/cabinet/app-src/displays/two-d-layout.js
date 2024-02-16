const Layout2D = require('../two-d/layout/layout.js');
const PanZoomClickMeasure = require('../../../../public/js/utils/canvas/two-d/pan-zoom-click-measure');
const $t = require('../../../../public/js/utils/$t.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const PopUp = require('../../../../public/js/utils/display/pop-up');
const Properties = require('../config/properties');
const Measurement = require('../../../../public/js/utils/measurement.js');
const StringMathEvaluator = require('../../../../public/js/utils/string-math-evaluator.js');
const Draw2D = require('../../../../public/js/utils/canvas/two-d/draw.js');
const Vertex2d = require('../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Line2d = require('../../../../public/js/utils/canvas/two-d/objects/line.js');
const EPNTS = require('../../generated/EPNTS.js');
const Snap2d = require('../../../../public/js/utils/canvas/two-d/objects/snap.js');
const Circle2d = require('../../../../public/js/utils/canvas/two-d/objects/circle.js');
const SnapLocation2d = require('../../../../public/js/utils/canvas/two-d/objects/snap-location.js');
const HoverMap2d = require('../../../../public/js/utils/canvas/two-d/hover-map.js');
const Cabinet = require('../objects/assembly/assemblies/cabinet.js');
const AutoLocationProperties = require('../../../../public/js/utils/canvas/two-d/objects/snap/auto-location-properties.js');
const Global = require('../services/global');
const SimpleModel = require('../objects/simple/simple.js');
const DrawLayout = require('./draw/layout');
const LayoutHoverMap = require('../services/layout-hover-map.js');

const localEnv = EPNTS.getEnv() === 'local';
const TwoDLayout = {};

let draw;
const eval = new StringMathEvaluator({Math}).eval;
const popUp = new PopUp({resize: false});

const getLayout = () =>
      Global.room().layout();

const getHoverMap = () =>
      Global.room().layout().hoverMap();

TwoDLayout.set = (l) => {
    if (panZ) panZ.once();
}

function rulerClick(elem) {
  du.class.toggle(elem, 'active');
  if (du.class.has(elem, 'active')) {
    panZ.measurements.enable()
  } else {
    panZ.measurements.disable();
  }
}

du.on.match('click', `.layout.ruler`, rulerClick);


const windowLineWidth = 8;
const tolerance = 1;
let lastImagePoint;
let mouseupId = 0;
let mousedownId = 0;
let popupOpen = false;
let lastDown = 0;
const selectTimeBuffer = 200;
const quickChangeFuncs = {};

function determineObject(id, member) {
  const referenceObj = Layout2D.get(id);
  switch (member) {
    case 'snap':  return referenceObj;
    case 'bridge':  return referenceObj.bridge.top();
    default:
    if ((typeof referenceObj.payload) === 'function') {
      const pld = referenceObj.payload();
      if (pld instanceof Layout2D.IdString) return Layout2D.get(pld);
      return pld ? pld : referenceObj;
    }
    return referenceObj;
  }
}

function getPopUpAttrs(elem) {
  const cnt =  du.find.up('[type-2d]', elem);
  if (cnt === undefined) return {};
  const member = elem.getAttribute('member');
  const type = cnt.getAttribute('type-2d');
  const key = elem.getAttribute('key');
  const isRaw = elem.hasAttribute('is-raw');
  const evaluated = !isRaw ? eval(elem.value) : elem.value;
  const raw = Number.isFinite(evaluated) ? evaluated : elem.value;
  let value, display;
  if (isRaw || elem.getAttribute('convert') === 'false') {
    value = elem.type === 'checkbox' ? elem.checked : raw;
    display = value;
  } else {
    const measurement = new Measurement(raw, true);
    value = measurement.decimal();
    display = measurement.display();
  }
  const id = cnt.id;
  const obj = determineObject(id, member);
  point = {
            x: Number.parseFloat(cnt.getAttribute('x')),
            y: Number.parseFloat(cnt.getAttribute('y'))
          };
  let prevValue, cascade;
  if (key) prevValue = Object.pathValue(obj, key);
  const cascadeStr = elem.getAttribute('cascade');
  if (cascadeStr) cascade = cascadeStr.split(',');
  return {type,id,key,value,display,raw,obj,prevValue,cascade,point,elem,member};
}

function cascadeChanges(props, cascaded) {
  cascaded ||= [];
  if (props.cascade) {
    for (let index = 0; index < props.cascade.length; index++) {
      const cascadeKey = props.cascade[index];
      if (cascaded.indexOf(cascadeKey) === -1) {
        const input = du.find.closest(`[key="${cascadeKey}"]`, props.elem);
        const currProps = getPopUpAttrs(input);
        input.value = display(currProps.prevValue);
        cascadeChanges(currProps, [cascadeKey].concat(cascaded));
      }
    }
  }
}

function updateFloorCeil(elem, bridge) {
  du.find.closest("[key='fromCeiling']", elem).value = bridge.fromCeiling();
}

du.on.match('enter:focusout', '.value-2d', (elem) => {
  const props = getPopUpAttrs(elem);
  switch (props.member) {
    case 'object':
      if (props.obj instanceof Cabinet) {
        const cabinet = props.obj;
        const cabCnt = du.find(`.cabinet-dem-cnt[cabinet-id='${cabinet.id()}']`);
        if (cabCnt) {
          const input = du.find.closest(`input[name='${props.key}']`, cabCnt);
          input.value = props.value ? props.display : props.raw;
        }
        cabinet[props.key](props.value || props.raw);
        return;
      } else {
        props.obj[props.key](props.value || props.raw);
        panZ.once();
      }
      return;
    case 'snap':
      props.obj = props.obj.snap2d.top();
      break;
    case 'hover-map':
      props.obj = props.obj.hoverMap();
      break;
  }

  if (props.key === 'thickness') props.key = 'height';
  Object.pathValue(props.obj, props.key, props.value);
  if (props.key === 'depth') {
    const display = new Measurement(props.obj.fromCeiling()).display();
    du.find.closest("[key='fromCeiling']", elem).value = display;
  }
  cascadeChanges(props);
  panZ.once();
});

du.on.match('change', 'input[name=\'UNIT2\']', (elem) => {
  const props = getPopUpAttrs(elem);
  const input = du.find.closest('.measurement-mod', elem);
  if (input) setTimeout(() =>
      input.value = props.obj.display(), 0);
});

function remove() {
  let hoverin = getHoverMap().hovering();
  if (hoverin.parent) {
    if (hoverin.parent().payload().constructor.name === 'Cabinet') {
      const cabinet = hoverin.parent().payload();
      const cabinetHeader = du.find(`.cabinet-header[cabinet-id='${cabinet.id()}']`);
      const removeButton = du.find.closest('.expandable-item-rm-btn', cabinetHeader)
      if (removeButton) removeButton.click();
      else console.warn('Remove button for cabinet should be present but is not present');
    }
    getLayout().remove(hoverin.parent().id());
  } else {
    getLayout().remove(hoverin.id());
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
  const obj = getLayout().addObject(props.point);
  panZ.once();
});

du.on.match('click', '.add-vertex-btn-2d', (elem) => {
  const attrs = getPopUpAttrs(elem);
  let hoverin = getHoverMap().hovering();
  const point = hoverin.closestPointOnLine(attrs.point);
  getLayout().addVertex(point.point(), hoverin);
  panZ.once();
});

du.on.match('enter', '.measurement-mod', (elem) => {
  const value = eval(elem.value);
  getPopUpAttrs(elem).obj.modify(value);
  panZ.once();
});

function undo(target) {
  getLayout().history().back();
  clearCache();
  panZ.once();
}

function redo () {
  getLayout().history().forward();
  clearCache();
  panZ.once();
}

function registerQuickChangeFunc(type, func) {
  if ((typeof func) === 'function') quickChangeFuncs[type] = func;
}

function onMousedown(event, stdEvent) {
  lastDown = new Date().getTime();
  lastImagePoint = {x: event.imageX, y: event.imageY};
  let hoverin = getHoverMap().hovering();
  event.lastImagePoint = new Vertex2d(lastImagePoint);
  if (stdEvent.button == 0) {
    if (!popupOpen && hoverin) {
      console.log('should do something???');
    }
  } else {
    if (hoverin && quickChangeFuncs[hoverin.constructor.name]) {
      quickChangeFuncs[hoverin.constructor.name](hoverin, event, stdEvent);
    }
    return true;
  }
}

function addVertex(hoverin, event, stdEvent) {
  const point = {x: event.imageX, y: event.imageY};
  getLayout().addVertex(point, hoverin);
}

registerQuickChangeFunc('Wall2D', addVertex);
registerQuickChangeFunc('Vertex2d', remove);
registerQuickChangeFunc('Window2D', remove);
registerQuickChangeFunc('SnapLocation2d', (snapLoc, event) => {
  if (!snapLoc.disconnect()) {
    const possible = getLayout().atWall(event.lastImagePoint);
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
    if (!snapLoc) return getHoverMap().hovering().parent().angle()
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
  // hovering = snapLocScope.targetObject();
  const angleElem = du.find.closest('[name="angle"]', elem);
  angleElem.previousElementSibling.innerText = which !== 'Both' ? 'Angle' : 'Rotate';
  updateSnapLocDisplay(elem);
  panZ.once();
});

du.on.match('change', '[member="snap-loc"][name="fix"]', (elem) => {
  const angleElem = du.find.closest('[name="angle"]', elem);
  let hoverin = getHoverMap().hovering();
  if (elem.checked) {
    const center = hoverin.center().copy();
    snapLoc = hoverin;
    hoverin.pairWith(center);
    angleElem.previousElementSibling.innerText = 'Rotate';
  } else {
    hoverin.disconnect();
    snapLoc = null;
    angleElem.previousElementSibling.innerText = 'Angle';
  }
  panZ.once();
});


du.on.match('enter', '[member="snap-loc"][name="angle"]', (elem) => {
  const radians = Math.toRadians(Number.parseFloat(elem.value || 0));
  let hoverin = getHoverMap().hovering();
  let selected = snapLocScope.selected();
  if (selected || !snapLoc) {
    selected ||= hoverin;
    selected.disconnect();
    selected.setRadians(radians);
    // hovering = selected;
    snapLoc = null;
    du.find.closest('.which-radio-cnt', elem).hidden = true;
    du.find.closest('.fix-cnt', elem).hidden = false;
  } else snapLoc.rotateAround(radians);
  panZ.once();
});

du.on.match('enter', '[member="snap-loc"][name="x"],[member="snap-loc"][name="y"]', (elem) => {
  const value = new Measurement(elem.value || 0, true).decimal();
  const coord = elem.getAttribute('name');
  let hoverin = getHoverMap().hovering();
  let selected = snapLocScope.selected();
  if (selected || !snapLoc) {
    selected ||= hoverin;
    selected.disconnect();
    const center = selected.center();
    center[coord](value);
    selected.move(center);
    // hovering = selected;
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


function getTemplateScope(cxtrName, target) {
  let hoverin = getHoverMap().hovering();
  target ||= hoverin;
  let autoLocProps;
  if ((typeof target.id) === 'function') {
    autoLocProps = AutoLocationProperties.get(target.id());
  }
  const UNITS = Properties.UNITS;
  const hoverMap = getHoverMap();
  const scope = {display, UNITS, panZ, target, hoverMap, autoLocProps,
                  lastImagePoint, SimpleModel};
  switch (cxtrName) {
    case 'SnapLocation2d':
      hoverin.pairWith();
      snapLoc = hoverin.pairedWith() ? hoverin : null;
      which = null;
      target =
      Object.merge(scope, snapLocScope, true);
      break;
  }
  return scope;
}

function openPopup(event, stdEvent) {
  let html;
  let hoverin = panZ.hoverMap().hovering();
  if (hoverin) {
    if (panZ.measurements.enabled()) return;
    popupOpen = true;
    const scope = getTemplateScope(hoverin.constructor.name);
    html = getTemplate(hoverin).render(scope);
  } else {
    popupOpen = true;
    const scope = getTemplateScope(undefined, getLayout());
    html = getTemplate(getLayout()).render(scope);
  }
  popUp.open(html, {x: event.screenX, y: event.screenY});
}

popUp.onClose((elem, event) => {
  setTimeout(() => popupOpen = false, 200);
  const attrs = getPopUpAttrs(du.find.closest('[type-2d]',popUp.container()));
  lastDown = new Date().getTime();
  // if (getLayout()) getLayout().history().newState();
});

function onMouseup(event, stdEvent) {
  if (stdEvent.button == 0) {
    if (lastDown > new Date().getTime() - selectTimeBuffer) {
      setTimeout(() => openPopup(event, stdEvent), 5);
    }
  } else {
    console.log('rightClick: do stuff!!');
    // if (getLayout()) getLayout().history().newState();
  }
}

const Controls2d = require('controls-2d');
let panZ;
let controls2d;
function init() {
  const canvas = document.getElementById('two-d-model-canvas');
  const height = du.convertCssUnit('80vh');

  canvas.height = height;
  canvas.width = height;

  draw = new DrawLayout(canvas, getLayout);
  panZ = new PanZoomClickMeasure(canvas, () => draw(), getHoverMap);

  panZ.onMousedown(onMousedown);
  panZ.onMouseup(onMouseup);
  controls2d = new Controls2d('#two-d-model .orientation-controls', getLayout, panZ);
  // draw(canvas);
  TwoDLayout.panZoom = panZ;
  // du.on.match('keycombo(Control,z)', '*', undo);
  // du.on.match('keycombo(Control,Shift,Z)', '*', redo);
  du.on.match('keycombo(Control, )', '*', getLayout().straightenUp);
}

TwoDLayout.init = init;
module.exports = TwoDLayout;
