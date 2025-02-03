
const {Line3D, Parimeter3D, Vector3D} =
    require('../../../../../public/js/utils/canvas/three-d/lib');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');

const union = (assemIds, env, filter, concat, type) => {
  let csg = new CSG();
  for (let index = 0; index < assemIds.length; index++) {
    const part = env.byId[assemIds[index]];
    if (filter(part)) {
      const model = env.getModel(part, type || 'joined');
      model.setColors(Color.next());
      if (concat) csg.polygons.concatInPlace(model.polygons);
      else csg = csg.union(model);
    }
  }
  return csg;
}

function getSilhouettes(env, boxOnlyCuts) {
  const top = Parimeter3D.fromCSG(boxOnlyCuts, {i:0,j:1,k:0}).to2D('x', 'z');
  const root = env.root();
  const openings = !root.openings ? [] : root.openings.map(o => {
    const norms = o.normals;
    const parimeter = Parimeter3D.fromCSG(boxOnlyCuts, norms.z);
    return parimeter;
  });
  return {top, openings};
}

const boxOnlyFilter = part => part.id.match(/PanelSectionPanel/) ||
                                    !part.locationCode.match(/c_S($|_|:)/);
const frontsOnlyFilter = part => part.id.match(/Door|Front/)
const handleFilter = p => p.id.match(/Handle/);
const dbFilter = p => p.id.match(/DrawerBox/);
const cabinetPartFilter = p => !handleFilter(p) && !dbFilter(p) && !frontsOnlyFilter(p);
const unionModels = (payload, env) => {
  const assemIds = payload.assemblies.concat(env.generated);
  const handles = union(assemIds, env, handleFilter, true);
  const fronts = union(assemIds, env, frontsOnlyFilter, true);
  const drawerBoxes = union(assemIds, env, dbFilter, true);
  const external = union(assemIds, env, part =>
              part.id.match(/Door|Front|Handle/) ||
              !part.locationCode.match(/_S(_|:)/), true);
  const boxOnly = union(assemIds, env, boxOnlyFilter);
  const boxOnlyCuts = union(assemIds, env, boxOnlyFilter, true, 'cut');
  const silhouettes = getSilhouettes(env, boxOnlyCuts);
  const all = union(assemIds, env, cabinetPartFilter, true);
  all.polygons.concatInPlace(fronts.polygons.concat(drawerBoxes.polygons));
  return {all, external, boxOnly, fronts, silhouettes, handles};
}

module.exports = unionModels;
