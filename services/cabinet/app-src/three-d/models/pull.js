

const CSG = require('../../../public/js/3d-modeling/csg');
const Polygon3D = require('../objects/polygon.js');
const BiPolygon = require('../objects/bi-polygon.js');

function pull(length, height) {
  var rspx = length - .75;
  var h = height-.125;
  var gerth = 2.54/4;
  // var rCyl = CSG.cylinder({start: [rspx, .125, .125-height], end: [rspx, .125, .125], radius: .25})
  // var lCyl = CSG.cylinder({start: [.75, .125, .125 - height], end: [.75, .125, .125], radius: .25})
  // var mainCyl = CSG.cylinder({start: [0, .125, .125], end: [length, .125, .125], radius: .25})
  var rCyl = CSG.cube({demensions: [gerth, gerth, h], center: [rspx/2, 0, h/-2]});
  var lCyl = CSG.cube({demensions: [gerth, gerth, h], center: [rspx/-2, 0, h/-2]});
  var mainCyl = CSG.cube({demensions: [length, gerth, gerth], center: [0, 0, 0]});

  return mainCyl.union(lCyl).union(rCyl);
}

function getVectorObj(line, normal) {
  const midNormOffset = line.midpoint().translate(normal);
  const lineNormPoly = new Polygon3D([line.startVertex.copy(), line.endVertex.copy(), midNormOffset]);
  return {
    z: normal,
    x: line.vector().unit(),
    y: lineNormPoly.normal(),
  };
}

function pull(baseCenter, line, normal, projection, cTOc) {
  var gerth = 2.54/4;
  let length = cTOc + gerth;
  const vecObj = getVectorObj(line, normal);

  let sideProjection = projection - gerth;
  const centerRL = baseCenter.translate(vecObj.z.scale(sideProjection/2), true);
  const centerLeft = centerRL.translate(vecObj.x.scale(cTOc/-2), true);
  const centerRight = centerRL.translate(vecObj.x.scale(cTOc/2), true);
  const centerMain = baseCenter.translate(vecObj.z.scale(projection - gerth/2));

  var lCyl = BiPolygon.fromVectorObject(gerth, gerth, sideProjection, centerLeft, vecObj);
  var rCyl = BiPolygon.fromVectorObject(gerth, gerth, sideProjection, centerRight, vecObj);
  var mainCyl = BiPolygon.fromVectorObject(length, gerth, gerth, centerMain, vecObj);

  return mainCyl.toModel().union(lCyl.toModel()).union(rCyl.toModel());
}

function simple(baseCenter, line, normal, projection, cTOc) {
  var gerth = 2.54/4;
  let length = cTOc + gerth;
  const vecObj = getVectorObj(line, normal);

  let sideProjection = projection - gerth;
  const center = baseCenter.translate(vecObj.depth.scale((sideProjection + gerth) /2), true);

  return BiPolygon.fromVectorObject(length, gerth, projection, center, vecObj).toModel();
}

pull.simple = simple;

module.exports = pull
