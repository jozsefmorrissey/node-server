const DisplayManager = require('../display-utils/displayManager.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const LoadingDisplay = require('../../../../public/js/utils/display/loading.js');
const Global = require('../services/global');
const ThreeDModel = require('../three-d/three-d-model.js');
const ThreeView = require('three-view');

const modelDisplayManager = new DisplayManager('model-display-cnt', 'display-menu');
const threeView = new ThreeView(du.id('disp-canvas-p2d'));


function renderRoom() {
   const room = Global.room();
  const allObjects = [];
  for (let index = 0; index < room.groups.length; index++) {
    allObjects.concatInPlace(room.groups[index].objects);
  }
  // TODO: Track non-Assembly objects in a better way.
  const objects = Global.room().layout().objects().filter(o => o.constructor.name === 'Object3D');
  ThreeDModel.renderNow(allObjects, {extraObjects: objects});
}

function  renderCabinet() {
  ThreeDModel.renderNow(Global.cabinet());
}

function  renderParts() {
  ThreeDModel.renderNow(Global.cabinet(), {parts: true});
}

let openTabId = 'two-d-model';
function render() {
  const isRoom = openTabId === 'disp-canvas-room';
  const isCabinet = openTabId === 'disp-canvas-cab';
  const isParts2D = openTabId === 'disp-canvas-p2d';
  const isParts = openTabId === 'disp-canvas-p3d';
  const isLayout = openTabId === 'two-d-model';
  const threeDmodel = du.id('three-d-model');
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
    } else if (isParts2D) {
      threeView.update();
    } else {
      throw new Error(`unkown display '${openTabId}'`);
    }
  }

}

modelDisplayManager.onSwitch((details) => {
  const id = details.to.id;
  openTabId = id;
  render();
});

Global.onChange.order(async () => {
    setTimeout(renderRoom);
});

module.exports = {
  render
}
