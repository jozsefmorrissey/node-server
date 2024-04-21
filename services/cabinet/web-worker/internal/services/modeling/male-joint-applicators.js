
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

const big = 1000;//Number.MAX_SAFE_INTEGER/100000;
function cropPoly (poly, vector) {
  BiPolygon.fromPolygon(poly, 0, big, {x: big, y: big});
}

apply.Dado = (assem, femalePolyObj, frontBackSet) => {
  extendFBSetToPoly(femalePolyObj.z[1], frontBackSet);
  const cookie = [BiPolygon.fromPolygon(femalePolyObj.z[1], 0, big, {x: big, y: big}).model()];
  // return [cropBiPoly];
  const joint = [BiPolygon.fromPolygon(femalePolyObj.z[1], 10, -0.635).model()];
  // return [dadoCropBiPoly];
  return {joint, cookie};
}

module.exports = apply;
