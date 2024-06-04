
const Color = require('./modeling/utils/color');

function unionAll(payload, environment) {
  const assemIds = payload.assemblies;
  let csg = new CSG();
  const map = environment.modelInfo.joined;
  for (let index = 0; index < assemIds.length; index++) {
    const id = assemIds[index];
    let model = map[id];
    if (model) {
      model = CSG.fromPolygons(model.polygons, true);
      model.setColors(...Color());
      csg = csg.union(model);
    }
  }
  environment.unioned = csg.polygons.length > 0 ? csg : null;
  return environment.unioned;
}

module.exports = unionAll;
