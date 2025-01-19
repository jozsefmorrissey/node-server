
const SectionPropertiesUtil = require('./section-properties');
const {BiPolygon, Polygon3D, Vector3D} =
    require('../../../../../../../public/js/utils/canvas/three-d/lib');
const Utils = require('utils');

function doorBiPoly(assem, fullPoly, gap, left) {
  const normals = Utils.normals(assem, true);
  const dems = {x: 2000, y:2000, z:2000};
  const scaler = left ? -1000 + gap/2 : 1000 - gap/2;
  const center = fullPoly.center().translate(normals.x.unit().scale(scaler));
  const rotation = Vector3D.coDirectionalRotations([normals.x,normals.y,normals.z]);
  const cutter = BiPolygon.fromVectorObject(dems.x, dems.y, dems.z,center, normals).model();
  const csg = fullPoly.model().subtract(cutter);
  const parrelleSets = Polygon3D.parrelleSets(Polygon3D.fromCSG(csg));
  const polys = parrelleSets.filter(set => set[0].normal().parrelle(normals.z))[0];
  if (polys[0].normal().equals(normals.z)) polys.reverse();
  return new BiPolygon(polys[0], polys[1]);
}

function getDoorBiPoly(left) {
  return (rMdto, environment) => {
    const sectionProps = SectionPropertiesUtil.instance(rMdto, environment);
    const parent = rMdto.parentAssembly();
    const fullPoly = sectionProps.coverInfo().biPolygon;
    return doorBiPoly(rMdto, fullPoly, parent.gap, left);
  }
}


module.exports = {
  Left: getDoorBiPoly(true),
  Right: getDoorBiPoly(false)
}
