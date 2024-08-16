
const Color = require('./modeling/utils/color');

const cutterReg = /^Cutter/;
function unionAll(payload, environment) {
  const assemIds = payload.assemblies;
  let csg = new CSG();
  for (let index = 0; index < assemIds.length; index++) {
    const id = assemIds[index];
    if (!id.match(cutterReg)) {
      let model = environment.getModel(id, 'joined');
      if (model) {
        model = CSG.fromPolygons(model.polygons, true);
        model.setColors(...Color());
        csg = csg.union(model);
      }
    }
  }
  environment.unioned = csg.polygons.length > 0 ? csg : null;
  return environment.unioned;
}

module.exports = unionAll;
