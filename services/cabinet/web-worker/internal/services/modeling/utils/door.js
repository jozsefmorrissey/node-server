
const SectionPropertiesUtil = require('./section-properties');
const BiPolygon = require('../../../../../app-src/three-d/objects/bi-polygon.js');
const Polygon3D = require('../../../../../app-src/three-d/objects/polygon.js');

function shrinkPoly(gap, poly, left) {
  const lines = JSON.clone(poly.lines());
  const offset = (lines[0].length() - gap) / 2;
  if (left) {
    lines[0].length(offset, true);
    lines[1].startVertex = lines[0].endVertex;
    lines[2].length(-offset, false);
    lines[1].endVertex = lines[2].startVertex;
  } else {
    lines[0].length(-offset, false);
    lines[3].endVertex = lines[0].startVertex;
    lines[2].length(offset, true);
    lines[3].startVertex = lines[2].endVertex;
  }
  return Polygon3D.fromLines(lines);

}

function getBiPolygon(left) {
  return (rMdto, environment) => {
    const sectionProps = SectionPropertiesUtil.instance(rMdto, environment);
    const fullPoly = sectionProps.coverInfo().biPolygon;
    const parent = rMdto.parentAssembly();
    const front = shrinkPoly(parent.gap, fullPoly.front(), left);
    const back = shrinkPoly(parent.gap, fullPoly.back(), left);
    return new BiPolygon(front, back);
  }
}

module.exports = {
  Left: getBiPolygon(true),
  Right: getBiPolygon(false)
}
