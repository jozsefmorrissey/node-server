const Canvas = require('../canvas');
const Jobs = require('../../../web-worker/external/jobs.js');

function  renderAssembly(assembly) {
  new Jobs.CSG.Assembly(assembly).then((modelInfo, job) => {
    const csg = modelInfo.unioned().clone();
    Canvas.render3Dmodel(csg, assembly);
  }).queue();
}

function  renderSimple(simpleObj) {
  new Jobs.CSG.Simple.Model(simpleObj).then((csg, job) => {
    csg = csg.clone();
    csg.center({x:0,y:0,z:0})
    Canvas.render3Dmodel(csg);
  }).queue();
}

function  renderCabinet(cabinet) {
  new Jobs.CSG.Assembly(cabinet).then((modelInfo, job) => {
    const csg = modelInfo.unioned().clone();
    Canvas.render3Dmodel(csg, cabinet);
  }).queue();
}

function  render() {
  const target = Global.target();
  if (!target) return;
  if (target.constructor.name === 'Cabinet') renderCabinet(target);
  else if (target.constructor.name === 'Assembly') renderAssembly(assembly);
  else renderSimple(target);
}
exports.module = new Canvas.View3D('Model', render, 'disp-canvas-cab');
Canvas.register(exports.module)
