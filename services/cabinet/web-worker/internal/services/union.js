
const Line3D = require('../../../app-src/three-d/objects/line.js');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Parimeter3D = require('../../../app-src/three-d/objects/parimeter.js');
const Color = require('./modeling/utils/color');

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
  const boxOnly = union(assemIds, env, boxOnlyFilter, true);
  const boxOnlyCuts = union(assemIds, env, boxOnlyFilter, true, 'cut');
  const silhouette = Parimeter3D.fromCSG(boxOnlyCuts, {i:0,j:1,k:0});
  const all = union(assemIds, env, cabinetPartFilter, true);
  all.polygons.concatInPlace(fronts.polygons.concat(drawerBoxes.polygons));
  return {all, external, boxOnly, fronts, silhouette, handles};
}

module.exports = unionModels;
