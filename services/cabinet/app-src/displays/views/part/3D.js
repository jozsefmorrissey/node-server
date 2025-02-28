const Canvas = require('../../canvas');
const Jobs = require('../../../../web-worker/external/jobs.js');
const ColorManager = require('../../managers/color-manager');

function  renderCabinet(cabinet) {
  new Jobs.CSG.Assembly.Construction(cabinet).then((modelInfo, job) => {
    const csg = modelInfo.unioned().clone();
    Canvas.render3Dmodel(csg, cabinet);
  }).queue();
}

function  render() {
  renderCabinet(Global.cabinet());
  return '<div id="model-controller">part-3d</div>'
}
exports.module = new Canvas.View3D('part-3d', render);
Canvas.register(exports.module)
