
const SimpleModels = require('../generic-models');
const SectionPropertiesUtil = require('./section-properties');
const Utils = require('./utils');
const {Vertex3D, BiPolygon} =
    require('../../../../../../../public/js/utils/canvas/three-d/lib');

function drawerDepth(depth, guideDepths, assembly) {
  const guideDepth = guideDepths.find(gd => gd.min <= depth && gd.max >= depth);
  if (!guideDepth) return 0;
  const drawerDepth = guideDepth.actual ? guideDepth.approx : depth - guideDepth.clearance;
  return drawerDepth;
}

const drawerBox = (assembly, environment) => {
  const sectionUtils = SectionPropertiesUtil.instance(assembly, environment);
  const propConfig = environment.propertyConfig;
  const props = Utils.property.set(assembly, environment, 'Guides');
  const innerPoly = sectionUtils.innerPoly.copy();
  const coverInfo = sectionUtils.coverInfo();
  const depth = drawerDepth(sectionUtils.drawerDepth(), props.dbdepths, assembly);
  const normal = coverInfo.biPolygon.normal();
  const offsetVect = normal.scale(-coverInfo.backOffset);
  const sideOffset = props.dbsos;
  const topOffset = props.dbtos;
  const bottomOffset = props.dbbos;
  innerPoly.offset(-sideOffset, -topOffset - bottomOffset);
  innerPoly.translate(offsetVect);
  assembly.position.current.normals = coverInfo.normals;
  const dbProps = Utils.property.set(assembly, environment, 'DrawerBox');
  return SimpleModels.DrawerBox(innerPoly, normal, depth, props.merge(dbProps));
}

module.exports = {drawerBox};
