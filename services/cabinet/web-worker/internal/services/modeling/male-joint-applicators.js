
const Utils = require('./utils/utils');
const Line3D = require('../../../../app-src/three-d/objects/line.js');
const BiPolygon = require('../../../../app-src/three-d/objects/bi-polygon.js');
const Polygon3D = require('../../../../app-src/three-d/objects/polygon.js');

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


apply.Dado = (assem, femalePolyInfo, frontBackSet) => {
  const femalePolyObj = femalePolyInfo();
  extendFBSetToPoly(femalePolyObj.z[1], frontBackSet);
  const cookie = [cutterFurthestZPoly(femalePolyInfo)];
  const joint = [offsetZpolyCutter(femalePolyInfo, 1, 10, -.9525)];
  return {joint, cookie};
}

module.exports = apply;
