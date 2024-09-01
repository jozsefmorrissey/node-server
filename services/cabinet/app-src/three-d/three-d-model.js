const CSG = require('../../../../public/js/utils/3d-modeling/csg.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const Vertex3D = require('./objects/vertex');
const Vector3D = require('./objects/vector');
const Line3D = require('./objects/line');
const CustomEvent = require('../../../../public/js/utils/custom-event.js');
const OrientationArrows = require('../../../../public/js/utils/display/orientation-arrows.js');
const Viewer = require('../../../../public/js/utils/3d-modeling/viewer.js').Viewer;
const addViewer = require('../../../../public/js/utils/3d-modeling/viewer.js').addViewer;
const CabinetModel = require('./cabinet-model');
const LoadingDisplay = require('../../../../public/js/utils/display/loading.js');
const loadingDisplay = new LoadingDisplay();
const Global = require('../services/global');

const ThreeDModel = {};

let lastViewId;
function centerOnObj(x,y,z, viewId) {
  const csg = ThreeDModel.lastRendered;
  const center = new Vertex3D(csg.center());
  center.x += 200 * y;
  center.y += -200 * x;
  center.z += 100;
  const rotation = {x: x*90, y: y*90, z: z*90};
  // const rotation = {x: 0, y: 0, z: 0};

  lastViewId = viewId;
  return [center, rotation];
}

let viewer;
let viewerSelector = '#three-d-model';
let viewerSize = '60vh';
ThreeDModel.getViewer = (model) => {
  if (viewer) return viewer;
  const canvas = du.find(viewerSelector);
  if (canvas) {
    const size = du.convertCssUnit(viewerSize);
    if (model === undefined) return undefined;
    viewer = new Viewer(model, size, size, 50);
    addViewer(viewer, viewerSelector);
    const orientArrows = new OrientationArrows(`${viewerSelector} .orientation-controls`);
    orientArrows.on.center(() =>
      viewer.viewFrom(...(lastViewId === 'front' ? centerOnObj(2,0,2, 'back') : centerOnObj(0,0, 0, 'front'))));
    orientArrows.on.up(() =>
      viewer.viewFrom(...centerOnObj(1, 0,0)));
    orientArrows.on.down(() =>
      viewer.viewFrom(...centerOnObj(-1,0,0)));
    orientArrows.on.left(() =>
      viewer.viewFrom(...centerOnObj(0,-1,0)));
    orientArrows.on.right(() =>
      viewer.viewFrom(...centerOnObj(0,1,0)));
  }
  return viewer;
}

ThreeDModel.display = (displayModel) => {
  if (displayModel instanceof CSG && displayModel.polygons.length > 0) {
    ThreeDModel.lastRendered = displayModel;
    ThreeDModel.getViewer(displayModel);
    viewer.mesh = displayModel.toMesh();
    viewer.gl.ondraw();
    renderObjectUpdateEvent.trigger(undefined, displayModel);
  }
}

const renderObjectUpdateEvent = new CustomEvent('renderObjectUpdate');
ThreeDModel.on = {};
ThreeDModel.on.renderObjectUpdate = (func) => renderObjectUpdateEvent.on(func);


module.exports = ThreeDModel
