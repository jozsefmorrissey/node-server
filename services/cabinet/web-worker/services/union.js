
function unionAll(assemblies, environment) {
  let csg = new CSG();
  const modelAttr = environment.modelAttribute || 'joined';
  const map = environment.modelInfo[modelAttr];
  for (let index = 0; index < assemblies.length; index++) {
    const assem = assemblies[index];
    if (assem.included && map[assem.id]) {
      let model = map[assem.id];
      if (model) {
        csg = csg.union(CSG.fromPolygons(model.polygons, true));
      }
    }
  }
  return csg.polygons.length > 0 ? csg : null;
}

module.exports = unionAll;
