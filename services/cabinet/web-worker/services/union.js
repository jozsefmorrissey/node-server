
function unionAll(assemIds, environment) {
  let csg = new CSG();
  const modelAttr = environment.modelAttribute || 'joined';
  const map = environment.modelInfo[modelAttr];
  for (let index = 0; index < assemIds.length; index++) {
    const id = assemIds[index];
    let model = map[id];
    if (model) {
      csg = csg.union(CSG.fromPolygons(model.polygons, true));
    }
  }
  return csg.polygons.length > 0 ? csg : null;
}

module.exports = unionAll;
