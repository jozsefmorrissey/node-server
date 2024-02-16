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


function renderRoom() {
  new Jobs.CSG.Room.Simple(Global.room()).then(ThreeDModel.display).queue();
}

function  renderCabinet() {
  const target = Global.target();
  if (target.constructor.name === 'Cabinet') {
    new Jobs.CSG.Cabinet.Complex(target).then((csg, job) => {
      ThreeDModel.display(csg);
    }).queue();
  } else {
    new Jobs.CSG.Simple([target]).then((csgs, job) => {
      ThreeDModel.display(CSG.fromPolygons(csgs[0].polygons));
    }).queue();

  }
}

function  renderParts() {
  new Jobs.CSG.Cabinet.Simple(Global.cabinet()).then(ThreeDModel.display).queue();
}

let ids = {
  room: 'disp-canvas-room',
  cabinet: 'disp-canvas-cab',
  parts2D: 'disp-canvas-p2d',
  parts: 'disp-canvas-p3d',
  layout: 'two-d-model',
  threeDmodel: 'three-d-model',

}

let openTabId = ids.layout;
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

Global.onChange.order(async () => {
  // TODO(timeout): this should not be nessisary.
    setTimeout(renderRoom, 500);
});

module.exports = {
  render, build, hide,
  on: {switch: switchEvent.on}
}
