const DisplayManager = require('../display-utils/displayManager.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const LoadingDisplay = require('../../../../public/js/utils/display/loading.js');
const Global = require('../services/global');
const ThreeDModel = require('../three-d/three-d-model.js');
const TwoDLayout = require('../displays/two-d-layout');
const ThreeView = require('three-view');
const CustomEvent = require('../../../../public/js/utils/custom-event.js');
const Jobs = require('../../web-worker/external/jobs.js');
const Utils = require('../utils');

const switchEvent = new CustomEvent('switch');

const modelDisplayManager = new DisplayManager('model-display-cnt', 'display-menu');
const threeView = new ThreeView(du.id('disp-canvas-p2d'));

let extraCsgObjsObj = [];
function extraCsgObjects(objects, shouldApply) {
  let obj = {objects, shouldApply,
    remove: () => extraCsgObjsObj.remove(obj)
  };
  extraCsgObjsObj.push(obj);
  return obj;
}

const applyExtraObjAndDisplay = (info, csg) => {
  csg ||= new CSG();
  for (let index = 0; index < extraCsgObjsObj.length; index++) {
    let ecoObj = extraCsgObjsObj[index];
    if (ecoObj.shouldApply(info)) {
      const objs = ecoObj.objects instanceof Function ? ecoObj.objects() : ecoObj.objects;
      for (let oi = 0; oi < objs.length; oi++) {
        if (objs[oi] instanceof CSG) csg.polygons.concatInPlace(objs[oi].polygons);
      }
    }
  }
  csg.center({x:0,y:0,z:0})
  // du.download.binary('bathroom.stl', csg.toSTL().binary.file())
  ThreeDModel.display(csg);
}

function positionAndColorRoomCSGs(modelIdMap) {
  const ids = Object.keys(modelIdMap);
  const csgs = [];
  for (let index = 0; index < ids.length; index++) {
    const id = ids[index];
    const csg = modelIdMap[id].unioned();
    const cabinet = Lookup.get(id);
    csg.setColors(() => cabinet.color());
    csgs.push(Utils.positionAssemblyCsg(csg, cabinet));
  }
  return CSG.concat(csgs);
}

const lineTo3DVerts = (line, bottomHeight, topHeight) => {
  return [{x: line[0].x, y:bottomHeight, z: line[0].y},
                {x: line[1].x, y:bottomHeight, z: line[1].y},
                {x: line[1].x, y:topHeight, z: line[1].y},
                {x: line[0].x, y:topHeight, z: line[0].y}];
}

function lightCSG(light) {
  props = {start: [0,0,0], end: [0,-1,0], slices: 36};
  props.radius = light.radius();
  const fixture = new CSG.cylinder(props);
  fixture.center(light.center());
  fixture.setColor(light.color());
  return fixture;
}

function layoutCsg(room) {
  const walls = room.layout().walls();
  const lights = room.layout().lights();
  let csg = new CSG();
  walls.forEach(w => {
    const wallPoly = CSG.Polygon.fromVertices(lineTo3DVerts(w, 0, w.height()));
    wallPoly.setColor('#D3CB97');
    csg.polygons.push(wallPoly);
    csg.polygons.concatInPlace(CSG.Polygon.Enclosed(lineTo3DVerts(w, 0, 6*2.54), 6, '#D3CB97').polygons);
    w.doors().forEach(d => {
      const verts = lineTo3DVerts(d.line().negitive(), d.fromFloor(), d.height());
      const doorway = CSG.Polygon.Enclosed(verts, 6);
      csg = csg.subtract(doorway);
    });
  });
  // lights.forEach(light => csg.polygons.concatInPlace(lightCSG(light).polygons));
  return csg;
}

function renderRoom() {
  // console.log(JSON.stringify(Global.order().toJson(), null, 2))
  new Jobs.CSG.Room.Complex(Global.room()).then((modelIdMap, job) => {
    let csg = positionAndColorRoomCSGs(modelIdMap);
    const room = Global.room();
    csg.polygons.concatInPlace(layoutCsg(room).polygons);
    applyExtraObjAndDisplay(room, csg);
  }).queue();
}

// TODO: rename this is actually render cabinet or simple objects
function  renderCabinet() {
  Global.target(Global.order().rooms.kitchen.groups[0].objects[4] || Global.order().rooms.kitchen.groups[0].objects[0]);
  const target = Global.target();
  if (target) {
    if (target.constructor.name === 'Cabinet') {
      new Jobs.CSG.Assembly(target).then((modelInfo, job) => {
        const csg = modelInfo.unioned();
        applyExtraObjAndDisplay(target, csg);
      }).queue();
    } else if (target.constructor.name === 'Assembly') {
      new Jobs.CSG.Assembly(target).then((modelInfo, job) => {
        const csg = modelInfo.unioned();
        applyExtraObjAndDisplay(target, csg);
      }).queue();
    } else {
      new Jobs.CSG.Simple.Model(target).then((csg, job) => {
        ThreeDModel.display(csg);
      }).queue();
    }
  }
}

const hide = (sectionName) => {
  du.id(ids.cabinet).hidden = true;
  du.find(`[display-id='${ids[sectionName]}']`).hidden = true;
}

const set = {};
let locationPrefix, locationCode, _parts, ufidPrefix;
let openTabId;
const resetAll = () => locationCode = _parts = locationPrefix = ufidPrefix = undefined;
const lcPrefixFilter = p => p.locationCode().match(`^${locationPrefix}`);
const pcPrefixFilter = p => p.userFriendlyId().match(`^${ufidPrefix}`);
set.locationPrefix = (lp) => resetAll() & (locationPrefix = lp);
set.ufidPrefix = (pc) => resetAll() & (ufidPrefix = pc);
set.locationCode = (lc) => resetAll() & (locationCode = lc);
set.parts = (parts) => resetAll() & (_parts = parts);
function  renderParts() {
  const cabinet = Global.cabinet() || Global.target();
  if (!cabinet) return;
  let parts;
  if (locationPrefix) parts = cabinet.getParts().filter(lcPrefixFilter);
  else if (ufidPrefix) parts = cabinet.getParts().filter(pcPrefixFilter);
  else if (locationCode) parts = [cabinet.getAssembly(locationCode)];
  else if (_parts) parts = _parts;
  if (!parts || parts.length === 0) {
    resetAll();
    parts = cabinet.modelingCollections();
  }
  new Jobs.CSG.Assembly(cabinet, Canvas.explosionFactor()).then((modelInfo, job) => {
    throw new Error('locate part or parts...');
    applyExtraObjAndDisplay(parts, csg);
  }).queue();
}

let ids = {
  room: 'disp-canvas-room',
  cabinet: 'disp-canvas-cab',
  parts2D: 'disp-canvas-p2d',
  parts: 'disp-canvas-p3d',
  layout: 'two-d-model',
  threeDmodel: 'three-d-model',
}
openTabId = ids.cabinet;
const is = {};
Object.keys(ids).forEach(k => is[k] = () => ids[k] === openTabId);

function render() {
  const threeDmodel = du.id(ids.threeDmodel);
  if (is.room() || is.cabinet() || is.parts()) {
    threeDmodel.hidden = false;
    if(is.room()) {
      setTimeout(renderRoom);
    } else if (is.cabinet()) {
      setTimeout(renderCabinet);
    } else if (is.parts()) {
      setTimeout(renderParts);
    } else {
      throw new Error(`unkown display '${openTabId}'`);
    }
  } else {
    threeDmodel.hidden = true;
    if (is.layout()) {
      if (TwoDLayout.panZoom) TwoDLayout.panZoom.once();
      else {
        du.id(ids.layout).hidden = true;
        // hide('layout');
        switchTo(ids.cabinet);
        render();
      }
    } else if (is.parts2D()) {
      threeView.update();
    } else {
      throw new Error(`unkown display '${openTabId}'`);
    }
  }
}

render.cabinet = () => (is.cabinet() || is.parts() || is.parts2D()) && render();

const switchTo = (id) => {
  if (openTabId !== id) switchEvent.trigger(id);
  openTabId = id;
  render();
};

modelDisplayManager.on.switch(details => switchTo(details.to.id));

du.on.match('enter', '*', () => {
  render.lastCall('Render!');
});

setTimeout(() => modelDisplayManager.open(openTabId), 20);

Canvas = {
  render, hide, set, extraCsgObjects,
  on: {switch: switchEvent.on}
};
module.exports = Canvas;
Object.getSet(Canvas, 'explosionFactor');
Canvas.explosionFactor(1.1);
