const Canvas = require('../../canvas');
const Jobs = require('../../../../web-worker/external/jobs.js');
const ColorManager = require('../../managers/color-manager');

function  render() {
  return '<div id="model-controller">part-3d</div>'
}
exports.module = new Canvas.View3D('part-3d', render);
Canvas.register(exports.module)
