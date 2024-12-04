
const Line3D = require('../../../app-src/three-d/objects/line.js');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Parimeter3D = require('../../../app-src/three-d/objects/parimeter.js');
const Color = require('./modeling/utils/color');

const union = (assemIds, env, filter) => {
  let csg = new CSG();
  for (let index = 0; index < assemIds.length; index++) {
    const part = env.byId[assemIds[index]];
    if (filter(part)) {
      const model = env.getModel(part, 'joined');
      model.setColors(String.color.next());
      csg = csg.union(model);
    }
  }
  return csg;
}

const unionModels = (payload, env) => {
  const assemIds = payload.assemblies.concat(env.generated);
  const all = union(assemIds, env, p => !p.id.match(/Handle/));
  const handles = union(assemIds, env, p => p.id.match(/Handle/));
  const external = union(assemIds, env, part =>
              part.id.match(/Door|Front|Handle|PanelSectionPanel/) ||
              !part.locationCode.match(/_S(_|:)/));
  const boxOnly = union(assemIds, env, part =>
                          !part.locationCode.match(/c_S($|_|:)/));
  const fronts = union(assemIds, env, part =>
              part.id.match(/Door|Front|Handle|PanelSectionPanel/));
  const silhouette = Parimeter3D.fromCSG(boxOnly, {i:0,j:1,k:0});
  return {all, external, boxOnly, fronts, silhouette, handles};
}

module.exports = unionModels;
