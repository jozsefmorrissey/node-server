
const Utils = require('./utils/utils');
const Line3D = require('../../../../app-src/three-d/objects/line.js');
const BiPolygon = require('../../../../app-src/three-d/objects/bi-polygon.js');
const Polygon3D = require('../../../../app-src/three-d/objects/polygon.js');
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

function extendFBSetToPoly(poly, frontBackSet) {
  frontBackSet[0].extendTo(poly);
  frontBackSet[1].extendTo(poly);
}

const big = 1000;//Number.MAX_SAFE_INTEGER/1000000;
function cropPoly (poly, vector) {
  BiPolygon.fromPolygon(poly, 0, big, {x: big, y: big});
}

const cutterFurthestZPoly = (femalePolyInfo) => () => {
  const femalePolyObj = femalePolyInfo();
  if (femalePolyObj === null) return;
  return BiPolygon.fromPolygon(femalePolyObj.z[1], 0, big, {x: big, y: big}).model();
}

const cutterClosestZPoly = (femalePolyInfo) => () => {
  const femalePolyObj = femalePolyInfo();
  if (femalePolyObj === null) return;
  return BiPolygon.fromPolygon(femalePolyObj.z[0], 0, -big, {x: big, y: big}).model();
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

apply.Dado = (assem, joint, femalePolyInfo, frontBackSet) => {
  const femalePolyObj = femalePolyInfo();
  if (femalePolyObj === null) return;
  if (!sideIntersectsPoly(assem, femalePolyObj, frontBackSet)) {
    sideIntersectsPoly(assem, femalePolyObj, frontBackSet)
    return;
  }
  const femaleThickness = femalePolyObj.z[0].distance(femalePolyObj.z[1]);
  let cookie, jointCutters;
  if (femaleThickness < joint.eval.maleOffset * 2 - 2.54/4) {
    cookie = [cutterClosestZPoly(femalePolyInfo)];
    jointCutters = [cutterClosestZPoly(femalePolyInfo)];
  } else {
    extendFBSetToPoly(femalePolyObj.z[1], frontBackSet);
    cookie = [cutterFurthestZPoly(femalePolyInfo)];
    jointCutters = [offsetZpolyCutter(femalePolyInfo, 0, -100, -joint.eval.maleOffset)];
  }

  //console.log('//female\n' + femalePolyObj.z.map(p => p.toDrawString('red')).join('\n') + '\n\n//male\n' + frontBackSet.map(p => p.toDrawString()).join('\n') + '\n\n//Far side cutter\n' + cookie[0]().toDrawString('green') + '\n//Joint cutter\n' + jointCutters[0]().toDrawString('yellow'));
  return {joint: jointCutters, cookie};
}

apply.ShelveJoint = (assem, joint, femalePolyInfo, frontBackSet) => {
  const femalePolyObj = femalePolyInfo();
  if (femalePolyObj === null) return;
  if (!sideIntersectsPoly(assem, femalePolyObj, frontBackSet)) {
    sideIntersectsPoly(assem, femalePolyObj, frontBackSet)
    return;
  }

  extendFBSetToPoly(femalePolyObj.z[1], frontBackSet);
  const cookie = [cutterFurthestZPoly(femalePolyInfo)];
  const offset = joint.eval.maleOffset;
  const offAbs = Math.abs(offset);
  const width = femalePolyInfo().z[0].distance(femalePolyInfo().z[1]) * (offset > 0 ? 1 : -1);
  const jointCutters = [offsetPolyCutter(femalePolyInfo, 0, offset + width, -offset, offAbs, offAbs)];
  //console.log('//female\n' + femalePolyObj.z.map(p => p.toDrawString('red')).join('\n') + '\n\n//male\n' + frontBackSet.map(p => p.toDrawString()).join('\n') + '\n\n//Far side cutter\n' + cookie[0]().toDrawString('green') + '\n//Joint cutter\n' + jointCutters[0]().toDrawString('yellow'));
  return {joint: jointCutters, cookie};
}
module.exports = apply;
