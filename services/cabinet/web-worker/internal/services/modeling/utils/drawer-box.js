
const SimpleModels = require('../generic-models');
const SectionPropertiesUtil = require('./section-properties');

function getDrawerDepth(depth) {
  const adjustedDepth = (depth/2.54) - 1;
  if (adjustedDepth < 3) return 0;
  return Math.floor((adjustedDepth/3) * 3) * 2.54;
}

module.exports = (assembly, environment) => {
  const sectionUtils = SectionPropertiesUtil.instance(assembly, environment);
  const propConfig = environment.propertyConfig;
  const props = propConfig.Guides;
  const innerPoly = sectionUtils.innerPoly.copy();
  const coverInfo = sectionUtils.coverInfo().copy();
  const depth = getDrawerDepth(sectionUtils.drawerDepth());
  const normal = coverInfo.biPolygon.normal();
  const offsetVect = normal.scale(-coverInfo.backOffset);
  const sideOffset = props.dbsos;
  const topOffset = props.dbtos;
  const bottomOffset = props.dbbos;
  innerPoly.offset(sideOffset/2, sideOffset/2, topOffset, bottomOffset);
  innerPoly.translate(offsetVect);
  return SimpleModels.DrawerBox(innerPoly, normal, depth, propConfig.DrawerBox);
}
