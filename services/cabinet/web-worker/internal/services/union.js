
const Line3D = require('../../../app-src/three-d/objects/line.js');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Parimeters = require('../../../../../public/js/utils/canvas/two-d/maps/parimeters.js');
const Color = require('./modeling/utils/color');

function topSilloute(csg) {
  const lines = Line3D.fromCSG(csg).map(l => l.to2D('x', 'z'));
  const poly = new Parimeters(Line2d.consolidate(lines)).polygons()[0];
  return poly;
}

const union = (assemIds, env, filter) => {
  let csg = new CSG();
  for (let index = 0; index < assemIds.length; index++) {
    const part = env.byId[assemIds[index]];
    if (filter(part)) {
      csg.setColors(Color());
      csg = csg.union(env.getModel(part, 'joined'));
    }
  }
  return csg;
}

const unionModels = (payload, env) => {
  const assemIds = payload.assemblies.concat(env.generated);
  const all = union(assemIds, env, p => true);
  const external = union(assemIds, env, part =>
              part.id.match(/Door|Front|Handle|PanelSectionPanel/) ||
              !part.locationCode.match(/_S(_|:)/));
  const boxOnly = union(assemIds, env, part =>
                          !part.locationCode.match(/c_(S|void-[0-9]*)($|_|:)/));
  const fronts = union(assemIds, env, part =>
              part.id.match(/Door|Front|Handle|PanelSectionPanel/));
  const silloute = topSilloute(boxOnly);
  return {all, external, boxOnly, fronts, silloute};
}

module.exports = unionModels;
