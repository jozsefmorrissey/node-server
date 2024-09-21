
const SimpleModels = require('../generic-models');
const SectionPropertiesUtil = require('./section-properties');
const Utils = require('./utils');

function getDrawerDepth(depth) {
  const adjustedDepth = (depth/2.54) - .5;
  if (adjustedDepth < 3) return 0;
  return Math.floor((adjustedDepth/3)) * 3 * 2.54;
}

module.exports = (assembly, environment) => {
  const sectionUtils = SectionPropertiesUtil.instance(assembly, environment);
  const propConfig = environment.propertyConfig;
  const props = Utils.property.set(assembly, environment, 'Guides');
  const innerPoly = sectionUtils.innerPoly.copy();
  const coverInfo = sectionUtils.coverInfo();
  const depth = getDrawerDepth(sectionUtils.drawerDepth());
  const normal = coverInfo.biPolygon.normal();
  const offsetVect = normal.scale(-coverInfo.backOffset);
  const sideOffset = props.dbsos;
  const topOffset = props.dbtos;
  const bottomOffset = props.dbbos;
  innerPoly.offset(-sideOffset, -topOffset - bottomOffset);
  innerPoly.translate(offsetVect);
  assembly.position.current.normals = coverInfo.normals;
  const dbProps = Utils.property.set(assembly, environment, 'DrawerBox');
  return SimpleModels.DrawerBox(innerPoly, normal, depth, dbProps);
}
