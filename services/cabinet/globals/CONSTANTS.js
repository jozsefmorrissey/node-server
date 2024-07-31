
const APP_ID = 'cabinet-builder';
const Draw2d = require('../../../public/js/utils/canvas/two-d/draw.js');


const PULL_TYPE = {
  DRAWER: 'Drawer',
  DOOR: 'Door'
};

const debug = {
  showNormals: false
}

Draw2d.debug.showNormals = debug.showNormals;

exports.VIEWER = {height: 600, width: 600}
exports.APP_ID = APP_ID
exports.PULL_TYPE = PULL_TYPE
