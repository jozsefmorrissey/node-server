const CSG = require('../../../../public/js/utils/3d-modeling/csg.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const {Vertex3D, Vector3D, Line3D} = require('../../../../public/js/utils/canvas/three-d/lib');
const CustomEvent = require('../../../../public/js/utils/custom-event.js');
const OrientationControls = require('../../../../public/js/utils/display/orientation-controls.js');
const Viewer = require('../../../../public/js/utils/3d-modeling/viewer.js').Viewer;
const addViewer = require('../../../../public/js/utils/3d-modeling/viewer.js').addViewer;
const LoadingDisplay = require('../../../../public/js/utils/display/loading.js');
const loadingDisplay = new LoadingDisplay();
const Global = require('../services/global');

const ThreeDModel = {};

let viewer;
let viewerSelector = '#three-d-model';
let viewerSize = '90vh';
ThreeDModel.getViewer = (model) => {
  if (viewer) return viewer;
  const canvas = du.find(viewerSelector);
  if (canvas) {
    const size = du.convertCssUnit(viewerSize);
    if (model === undefined) return undefined;
    viewer = new Viewer(model, size, size, 50);
    addViewer(viewer, viewerSelector);
    const orientSelector = `${viewerSelector} .orientation-controls`;
    const orientArrows = OrientationControls.forCSG(orientSelector, viewer, () => ThreeDModel.lastRendered);
    ThreeDModel.trigger.viewer.set(viewer);
  }
  return viewer;
}

ThreeDModel.display = (displayModel) => {
  if (displayModel instanceof CSG) {
    ThreeDModel.lastRendered = displayModel;
    ThreeDModel.getViewer(displayModel);
    viewer.mesh = displayModel.toMesh();
    viewer.gl.ondraw();
    ThreeDModel.trigger.render(undefined, displayModel);
  }
}

const renderObjectUpdateEvent = new CustomEvent('renderObjectUpdate');
CustomEvent.all(ThreeDModel, 'render', 'viewer.set')

module.exports = ThreeDModel
