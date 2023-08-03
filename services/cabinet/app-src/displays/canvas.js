const DisplayManager = require('../display-utils/displayManager.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const LoadingDisplay = require('../../../../public/js/utils/display/loading.js');
const Global = require('../services/global');
const ThreeDModel = require('../three-d/three-d-model.js');

const modelDisplayManager = new DisplayManager('model-display-cnt', 'display-menu');


const loadingDisplay = new LoadingDisplay();
function renderRoom() {
   const room = Global.room();
  const allObjects = [];
  for (let index = 0; index < room.groups.length; index++) {
    allObjects.concatInPlace(room.groups[index].objects);
  }
  ThreeDModel.renderNow(allObjects);
  loadingDisplay.deactivate()
}

function  renderCabinet() {
  ThreeDModel.renderNow(Global.cabinet());
  loadingDisplay.deactivate();
}

function  renderParts() {
  ThreeDModel.renderNow(Global.cabinet(), {parts: true});
  loadingDisplay.deactivate();
}

let openTab = 'Layout';
function render(tab) {
  const isRoom = openTab === 'Room';
  const isCabinet = openTab === 'Cabinet';
  const isParts = openTab === 'Parts';
  const threeDmodel = du.id('three-d-model');
  loadingDisplay.activate();
  if (isRoom || isCabinet || isParts) {
    threeDmodel.hidden = false;
    if(isRoom) {
      setTimeout(renderRoom);
    } else if (isCabinet) {
      setTimeout(renderCabinet);
    } else if (isParts) {
      setTimeout(renderParts);
    }
  } else {
    threeDmodel.hidden = true;
    loadingDisplay.deactivate();
  }

}

modelDisplayManager.onSwitch((details) => {
  const toName = details.to.getAttribute('name');
  openTab = toName;
  render();
});

Global.onChange.order(async () => {
    loadingDisplay.activate();
    setTimeout(renderRoom);
});

module.exports = {
  render
}
