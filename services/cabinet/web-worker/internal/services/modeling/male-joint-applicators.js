
const Utils = require('./utils/utils');

const {Line3D, Vertex3D, BiPolygon, Polygon3D} =
    require('../../../../../../public/js/utils/canvas/three-d/lib');
const tol = .0001;
const withinTol = new (require('../../../../../../public/js/utils/tolerance.js'))(tol).within;

const defalt = {biPolygon: Utils.toBiPolygon};
const getFunc = (cxtr, location) => apply[cxtr] !== undefined &&
        (apply[cxtr][location] || apply[cxtr]);

const idReg = /^(.*?)_(.*)$/;
const apply = (joint) => {
  const id = joint.id
  const cxtr = joint.id.replace(idReg, '$1');
  let location = joint.location;
  const func = getFunc(cxtr, location);
  if (func) return func;
}

function extendFBSetToPoly(poly, frontBackSet, jointSettings, center) {
  try {
    const p0 = frontBackSet[0].extendTo(poly, true, jointSettings.directions);
    const p1 = frontBackSet[1].extendTo(poly, true, jointSettings.directions);
    frontBackSet[0] = p0;
    frontBackSet[1] = p1;
  } catch (e) {
    console.error(e)
  }
}

const big = 1000;//Number.MAX_SAFE_INTEGER/1000000;
const jointXYoffset = (noneOoffsetObig) => {
  if (noneOoffsetObig === true) return;
  if (noneOoffsetObig instanceof Object) return noneOoffsetObig;
  return {x: big, y: big};
}

const cutterFurthestZPoly = (femalePolyInfo, vertex, dist, noneOoffsetObig) => () => {
  const femalePolyObj = femalePolyInfo();
  if (femalePolyObj === null) return;
  const index = vertex ? furthestIndex(femalePolyObj, vertex) :  0;
  const multiplier = vertex ? 1 : -1;
  const offset = jointXYoffset(noneOoffsetObig);
  return BiPolygon.fromPolygon(femalePolyObj.z[index], dist || 0, multiplier * big, offset).model();
}

const closestIndex = (femalePolyObj, vertex) =>
  femalePolyObj.z[0].distance(vertex) < femalePolyObj.z[1].distance(vertex) ? 0 : 1;
const furthestIndex = (femalePolyObj, vertex) =>
  femalePolyObj.z[0].distance(vertex) < femalePolyObj.z[1].distance(vertex) ? 1 : 0;

const cutterClosestZPoly = (femalePolyInfo, vertex, dist, noneOoffsetObig) => () => {
  const femalePolyObj = femalePolyInfo();
  if (femalePolyObj === null) return;
  const index = vertex ? closestIndex(femalePolyObj, vertex) :  0;
  const multiplier = vertex ? -1 : 1;
  const offset = jointXYoffset(noneOoffsetObig);
  return BiPolygon.fromPolygon(femalePolyObj.z[index], dist || 0, multiplier*big, offset).model();
}

const offsetZpolyCutter = (femalePolyInfo, index, dist1, dist2) => () => {
  const femalePolyObj = femalePolyInfo();
  if (femalePolyObj === null) return;
  return BiPolygon.fromPolygon(femalePolyObj.z[index], dist1, dist2).model();
}

const offsetPolyCutter = (femalePolyInfo, index, dist1, dist2, x, y) => () => {
  const femalePolyObj = femalePolyInfo();
  if (femalePolyObj === null) return;
  return BiPolygon.fromPolygon(femalePolyObj.z[index], dist1, dist2, {x, y}).model();
}

const sideIntersectsPoly = (assem, femalePolyObj, frontBackSet) => {
  try {
    const targetPoly = femalePolyObj.z[1];
    const targetPlane = targetPoly.toPlane();
    const allSides = frontBackSet[0].lines().concat(frontBackSet[1].lines());
    let doesIntersect;
    allSides.forEach(l => {
      if (doesIntersect) return;
      const planeIntersect = targetPlane.intersection.line(l);
      if (!planeIntersect) return;
      const connection = targetPoly.connect.vertex(planeIntersect);
      if (connection.isPoint()) doesIntersect = true;
      else doesIntersect = withinTol(0, connection.vector().unit().dot(frontBackSet[0].normal()));
    });
    return doesIntersect;
  } catch (e) {
    console.log(e);
  }
}

const intersection = (poly, center) => (vector) => {
  const line = Line3D.startAndVector(center, vector.scale(big));
  const int = poly.intersection.line(line);
  return int && line.within(int);
}
const eqOnull = (val, bool) => val === bool || val === null;
function validExpansionDirection(assem, poly, frontBackSet, env) {
  const settingNorms = assem.jointSettings.normals;
  if (settingNorms.any) return true;
  const assemNorms = Utils.normals(assem, env);
  const center = frontBackSet[0].center();
  const int = intersection(poly, center);
  if (eqOnull(settingNorms.x,true) && int(assemNorms.x)) return true;
  if (eqOnull(settingNorms.y,true) && int(assemNorms.y)) return true;
  if (eqOnull(settingNorms.z,true) && int(assemNorms.z)) return true;
  if (eqOnull(settingNorms.x,false) && int(assemNorms.x.inverse())) return true;
  if (eqOnull(settingNorms.y,false) && int(assemNorms.y.inverse())) return true;
  if (eqOnull(settingNorms.z,false) && int(assemNorms.z.inverse())) return true;
  return false;
}

apply.Dado = (assem, joint, femalePolyInfo, frontBackSet, env) => {
  const femalePolyObj = femalePolyInfo();
  if (femalePolyObj === null) return null;
  const center = new Vertex3D(env.modelInfo.model[assem.id].mean());
  const furthIndex = furthestIndex(femalePolyObj, center);
  const valExpDir = validExpansionDirection(assem, femalePolyObj.z[furthIndex], frontBackSet, env);
  if (valExpDir === null) return;

  const femaleThickness = femalePolyObj.z[0].distance(femalePolyObj.z[1]);
  let cookie, jointCutters;
  assem.jointSettings.directions.center = center;
  // console.warn.logarithmic('Need to remove true if objects are configured correctly should work... also add to other joint functions');
  if (true || valExpDir)
    extendFBSetToPoly(femalePolyObj.z[furthIndex], frontBackSet, assem.jointSettings);
  if (femaleThickness - joint.eval.maleOffset - 2.54/4 < -.01) {
    cookie = [cutterClosestZPoly(femalePolyInfo, center)];
    jointCutters = [];
  } else {
    cookie = [cutterFurthestZPoly(femalePolyInfo, center)];
    jointCutters = [cutterClosestZPoly(femalePolyInfo, center, -joint.eval.maleOffset, !joint.full.male)];
  }

  // console.log('//female\n' + femalePolyObj.z.map(p => p.toDrawString('red')).join('\n') +
  //             '\n\n//male\n' + frontBackSet.map(p => p.toDrawString()).join('\n'))
  return {joint: jointCutters, cookie};
}

apply.Butt = (assem, joint, femalePolyInfo, frontBackSet, env) => {
  const femalePolyObj = femalePolyInfo();
  if (femalePolyObj === null) return null;
  const center = new Vertex3D(env.modelInfo.model[assem.id].mean());

  const furthIndex = furthestIndex(femalePolyObj, center);
  let valExpDir = validExpansionDirection(assem, femalePolyObj.z[furthIndex], frontBackSet, env);
  if (valExpDir === null) return;

  assem.jointSettings.directions.center = center;
  if (valExpDir)
    extendFBSetToPoly(femalePolyObj.z[furthIndex], frontBackSet, assem.jointSettings);
  if (femalePolyObj === null) return;
  if (!sideIntersectsPoly(assem, femalePolyObj, frontBackSet)) {
    return;
  }

  const allSides = femalePolyObj.sides.concat(femalePolyObj.z);
  const distList = allSides.map(p => ({p, dist: Math.roundTo(p.distance(frontBackSet[0]) + p.distance(frontBackSet[1]), .0001),
                                      centerDist: Math.roundTo(p.center().distance(center), .0001)}))
                              .sortByAttr('centerDist');
  const possibleTargets = distList.slice(0,2).sortByAttr('dist');

  const mateWith = possibleTargets[0].p;

  valExpDir = validExpansionDirection(assem, mateWith, frontBackSet, env);
  assem.jointSettings.directions.center = center;
  if (valExpDir) extendFBSetToPoly(mateWith, frontBackSet, assem.jointSettings);
  cookie = [cutterFurthestZPoly(femalePolyInfo, center, 0)];
  jointCutters = [cutterClosestZPoly(femalePolyInfo, center, 0)];

  // console.log('//target\n' + mateWith.toDrawString('green', true) +
  //             '\n\n//male\n' + frontBackSet.map(p => p.toDrawString()).join('\n') +
  //             '\n\n//female\n' + femalePolyObj.z.map(p => p.toDrawString('red')).join('\n') +
  //             '\n\n//sides\n' + femalePolyObj.sides.map(p => p.toDrawString('red')).join('\n') +
  //             '\n\n//Cookie\n' + cookie[0]().toDrawString('green'));

  return {joint: jointCutters, cookie};
}

function closestAndPartner(polys, line) {
  const distList = polys.map(p => ({p, dist: p.distance(line)}))
                        .sortByAttr('dist');
  const closest = distList[0].p;
  const furthest = distList.find((o,i)  => i !== 0 &&
                            o.p.normal().parrelle(closest.normal())).p;
  return {closest, furthest};
}

apply.Miter = (assem, joint, femalePolyInfo, frontBackSet, env) => {
  const femalePolyObj = femalePolyInfo();
  if (femalePolyObj === null) return;
  if (!sideIntersectsPoly(assem, femalePolyObj, frontBackSet)) {
    return;
  }
  const maleModel = env.modelInfo.model[assem.id];
  const femaleModel = env.modelInfo.model[femalePolyObj.assem.id];
  const femalePolys = femalePolyObj.sides.concat(femalePolyObj.z);
  const malePolys = Polygon3D.fromCSG(maleModel);
  const mCenter = new Vertex3D(maleModel.center());
  const fCenter = new Vertex3D(femaleModel.center());
  const mcTOfc = new Line3D(mCenter, fCenter);
  mcTOfc.adjustLength(-2);
  const mcfcUnit = mcTOfc.vector().unit()
  const f = closestAndPartner(femalePolys, mcTOfc);
  const m = closestAndPartner(malePolys, mcTOfc);
  const innerIntersection = m.closest.toPlane().intersection(f.closest.toPlane());
  const outerIntersection = m.furthest.toPlane().intersection(f.furthest.toPlane()).acquiescent(innerIntersection).negitive();
  const cutterPoly = new Polygon3D(Line3D.vertices([innerIntersection, outerIntersection]).map(v => v.clone()));
  const cpCenter = cutterPoly.center();
  const cpTransCenter = cpCenter.translate(cutterPoly.normal(), true);
  const dist = cpCenter.distance(mCenter) < cpTransCenter.distance(mCenter) ? big : -big;
  const biPoly = BiPolygon.fromPolygon(cutterPoly, 0, dist, {x: big, y: big});

  assem.jointSettings.directions.center = center;
  extendFBSetToPoly(f.furthest, frontBackSet, assem.jointSettings);


  jointCutter = () => biPoly.model()
  cookie = [];
  jointCutters = [jointCutter];

  // console.log([mcTOfc.toDrawString(), mcTOfc.midpoint().toString(),
  //             f.closest.toDrawString('red'), f.furthest.toDrawString('blue'),
  //             m.closest.toDrawString('salmon'), m.furthest.toDrawString('babyblue'),
  //             innerIntersection.toDrawString('red'), outerIntersection.toDrawString('blue'),
  //             biPoly.toDrawString('green')].join('\n'));
  return {joint: jointCutters, cookie};
}

apply.ShelveJoint = (assem, joint, femalePolyInfo, frontBackSet, env) => {
  const femalePolyObj = femalePolyInfo();
  if (femalePolyObj === null) return;
  if (!sideIntersectsPoly(assem, femalePolyObj, frontBackSet)) {
    return;
  }

  const center = new Vertex3D(env.modelInfo.model[assem.id].mean());
  assem.jointSettings.directions.center = center;
  extendFBSetToPoly(femalePolyObj.z[1], frontBackSet, assem.jointSettings);
  const cookie = [cutterFurthestZPoly(femalePolyInfo, center)];
  const offset = joint.eval.maleOffset;
  const offAbs = Math.abs(offset);
  const width = femalePolyInfo().z[0].distance(femalePolyInfo().z[1]) * (offset > 0 ? 1 : -1);
  const polyIndex = closestIndex(femalePolyObj, center);
  const jointCutters = [offsetPolyCutter(femalePolyInfo, polyIndex, offset + width, -offset, offAbs, offAbs)];
  // console.log('//female\n' + femalePolyObj.z.map(p => p.toDrawString('red')).join('\n') +
  //             '\n\n//male\n' + frontBackSet.map(p => p.toDrawString()).join('\n') +
  //             '\n\n//Far side cutter\n' + cookie[0]().toDrawString('green') +
  //             '\n//Joint cutter\n' + jointCutters[0]().toDrawString('yellow'));
  return {joint: jointCutters, cookie};
}

apply.PlayJoint = (assem, joint, femalePolyInfo, frontBackSet, env) => {
  const femalePolyObj = femalePolyInfo();
  if (femalePolyObj === null) return;
  if (!sideIntersectsPoly(assem, femalePolyObj, frontBackSet)) {
    return;
  }
  jointCutter = () => {
    const csg = env.getModel(femalePolyObj.assem, 'cut').clone();
    csg.scale(-joint.maleOffset, -joint.maleOffset, -joint.maleOffset, true);
    return csg;
  }
  // console.log('//female\n' + femalePolyObj.z.map(p => p.toDrawString('red')).join('\n') +
  //             '\n\n//male\n' + frontBackSet.map(p => p.toDrawString()).join('\n') +
  //             '\n\n//Far side cutter\n' + cookie[0]().toDrawString('green') +
  //             '\n//Joint cutter\n' + jointCutters[0]().toDrawString('yellow'));
  return {joint: [jointCutter], cookie: []};
}
module.exports = apply;
