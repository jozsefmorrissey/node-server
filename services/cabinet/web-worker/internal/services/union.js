
const Color = require('./modeling/utils/color');

const cutterReg = /^Cutter/;
function unionAll(payload, environment) {
  const assemIds = payload.assemblies.concat(environment.generated);
  let csg = new CSG();
  let root = new CSG();
  for (let index = 0; index < assemIds.length; index++) {
    const id = assemIds[index];
    if (!id.match(cutterReg)) {
      let model = environment.getModel(id, 'joined');
      if (model && model.polygons.length > 0) {
        model = CSG.fromPolygons(model.polygons, true);
        model.setColors(...Color());
        csg = csg.union(model);
        const part = environment.byId[id];
        if (part.id.match(/Door|Front|Handle|PanelSectionPanel/) ||
              !part.locationCode.match(/_S1_/)) {
          root = root.union(model);
        }
      }
    }
  }
  for (let index = 0; index < environment.generated.length; index++) {
    csg = csg.union(environment.getModel(environment.generated[index], 'joined'));
  }
  environment.unioned = csg.polygons.length > 0 ? csg : null;
  const rootId = environment.byId[payload.assemblies[0]].find.root().id;
  environment.modelInfo.joined[rootId] = root;
  return environment.unioned;
}

module.exports = unionAll;
