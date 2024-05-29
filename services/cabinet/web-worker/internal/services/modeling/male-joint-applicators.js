
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

const offsetZpolyCutter = (femalePolyInfo, index, dist1, dist2) => () => {
  const femalePolyObj = femalePolyInfo();
  if (femalePolyObj === null) return;
  return BiPolygon.fromPolygon(femalePolyObj.z[index], dist1, dist2).model();
}

const sideIntersectsPoly = (assem, femalePolyObj, frontBackSet) => {
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
}

apply.Dado = (assem, joint, femalePolyInfo, frontBackSet) => {
  const femalePolyObj = femalePolyInfo();
  if (assem.partCode.startsWith('dv')) {
    console.log('her');
  }
  if (!sideIntersectsPoly(assem, femalePolyObj, frontBackSet)) {
    sideIntersectsPoly(assem, femalePolyObj, frontBackSet)
    return;
  }

  extendFBSetToPoly(femalePolyObj.z[1], frontBackSet);
  const cookie = [cutterFurthestZPoly(femalePolyInfo)];
  const jointCutters = [offsetZpolyCutter(femalePolyInfo, 0, -100, -joint.maleOffset)];
  return {joint: jointCutters, cookie};
}

module.exports = apply;
