const DisplayManager = require('../display-utils/displayManager.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const LoadingDisplay = require('../../../../public/js/utils/display/loading.js');
const Global = require('../services/global');
const ThreeDModel = require('../three-d/three-d-model.js');
const TwoDLayout = require('../displays/two-d-layout');
const ThreeView = require('three-view');
const CustomEvent = require('../../../../public/js/utils/custom-event.js');
const Jobs = require('../../web-worker/external/jobs.js');

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
  for (let index = 0; index < extraCsgObjsObj.length; index++) {
    let ecoObj = extraCsgObjsObj[index];
    if (ecoObj.shouldApply(info)) {
      const objs = ecoObj.objects instanceof Function ? ecoObj.objects() : ecoObj.objects;
      for (let oi = 0; oi < objs.length; oi++) {
        if (objs[oi] instanceof CSG) csg.polygons.concatInPlace(objs[oi].polygons);
      }
    }
  }
  ThreeDModel.display(csg);
}

function renderRoom() {
  new Jobs.CSG.Room.Simple(Global.room()).then((csg) => {
    applyExtraObjAndDisplay(Global.room(), csg);
  }).queue();
}

// TODO: rename this is actually render cabinet or simple objects
function  renderCabinet() {
  const target = Global.target();
  if (target.constructor.name === 'Cabinet') {
    new Jobs.CSG.Cabinet.Complex(target).then((modelInfo, job) => {
      applyExtraObjAndDisplay(target, modelInfo.unioned());
    }).queue();
  } else {
    new Jobs.CSG.Simple([target]).then((csgs, job) => {
      applyExtraObjAndDisplay(target, CSG.fromPolygons(csgs[0].polygons));
    }).queue();
  }
}

const set = {};
let locationPrefix, locationCode, _parts, ufidPrefix;
const resetAll = () => locationCode = _parts = locationPrefix = ufidPrefix = undefined;
const lcPrefixFilter = p => p.locationCode().match(`^${locationPrefix}(_|:|$)`);
const pcPrefixFilter = p => p.userFriendlyId().match(`^${ufidPrefix}(_|:|$)`);
set.locationPrefix = (lp) => resetAll() & (locationPrefix = lp);
set.ufidPrefix = (pc) => resetAll() & (ufidPrefix = pc);
set.locationCode = (lc) => resetAll() & (locationCode = lc);
set.parts = (parts) => resetAll() & (_parts = parts);
function  renderParts() {
  const cabinet = Global.cabinet();
  if (!cabinet) return;
  let parts;
  if (locationPrefix) parts = cabinet.getParts().filter(lcPrefixFilter);
  else if (ufidPrefix) parts = cabinet.getParts().filter(pcPrefixFilter);
  else if (locationCode) parts = [cabinet.getAssembly(locationCode)];
  else if (_parts) parts = _parts;
  if (!parts || parts.length === 0) {
    resetAll();
    parts = cabinet.getParts();
  }
  new Jobs.CSG.Assembly.Join(parts).then((modelInfo, job) => {
    applyExtraObjAndDisplay(parts, modelInfo.unioned());
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

let openTabId = ids.parts;
modelDisplayManager.open(openTabId);
function render() {
  const isRoom = openTabId === ids.room;
  const isCabinet = openTabId === ids.cabinet;
  const isParts2D = openTabId === ids.parts2D;
  const isParts = openTabId === ids.parts;
  const isLayout = openTabId === ids.layout;
  const threeDmodel = du.id(ids.threeDmodel);
  if (isRoom || isCabinet || isParts) {
    threeDmodel.hidden = false;
    if(isRoom) {
      setTimeout(renderRoom);
    } else if (isCabinet) {
      setTimeout(renderCabinet);
    } else if (isParts) {
      setTimeout(renderParts);
    } else {
      throw new Error(`unkown display '${openTabId}'`);
    }
  } else {
    threeDmodel.hidden = true;
    if (isLayout) {
      if (TwoDLayout.panZoom) TwoDLayout.panZoom.once();
      else {
        du.id(ids.layout).hidden = true;
        hide('layout');
        switchTo(ids.cabinet);
        render();
      }
    } else if (isParts2D) {
      threeView.update();
    } else {
      throw new Error(`unkown display '${openTabId}'`);
    }
  }

}

const switchTo = (id) => {
  if (openTabId !== id) switchEvent.trigger(id);
  openTabId = id;
  render();
};

modelDisplayManager.onSwitch(details => switchTo(details.to.id));

const build = async (cabinet) => {
  await ThreeDModel.build(cabinet || Global.cabinet());
  render();
}

const hide = (sectionName) => {
  du.id(ids.cabinet).hidden = true;
  du.find(`[display-id='${ids[sectionName]}']`).hidden = true;
}

du.on.match('enter', '*', () => {
  // TODO(timeout): this should not be nessisary.
  console.log('rendering');
    setTimeout(render, 1500);
});

module.exports = {
  render, build, hide, set, extraCsgObjects,
  on: {switch: switchEvent.on}
}
