
const CabinetUtil = require('./cabinet');
const Utils = require('./utils');
const Line3D = require('../../../../../app-src/three-d/objects/line.js');
const BiPolygon = require('../../../../../app-src/three-d/objects/bi-polygon.js');
const Vertex3D = require('../../../../../app-src/three-d/objects/vertex.js');
const Polygon3D = require('../../../../../app-src/three-d/objects/polygon.js');

function getFrontAndBack(biPoly, axis) {
  const set = biPoly.setMostInLineWith(axis);
  return {front: set[1], back: set[0]};
}

function expandPoly(biPoly, offsetDirection, fromPoint, ingulf, offsetVector, front, back, thickness, target) {
  let poly = fromPoint.distance(front.center()) < fromPoint.distance(back.center()) ? front : back;
  if (offsetVector.magnitude() > .0001) {
    if (!offsetVector.sameDirection(offsetDirection)) offsetVector = offsetVector.inverse();
    poly = poly.translate(offsetVector);
  }
  const sameDir = offsetDirection.sameDirection(poly.normal());
  const multiplier = sameDir ? 1 : -1;
  const polyThickness = multiplier * thickness;
  const expandDems = ingulf ? {x: thickness, y: thickness} : undefined;
  const modelPoly = BiPolygon.fromPolygon(poly, 0, polyThickness, expandDems);
  // console.log('//' + target.locationCode + '\n' +
  // biPoly.toDrawString() + '\n\n\n\n' + modelPoly.toDrawString('red'));
  return modelPoly;
}

function getModel(target, axis, offsetRatio, fromPoint, ingulf, environment, to) {
  const normals = Utils.normals(target, environment);

  let biPolyArr = environment.modelInfo.biPolygonArray[target.id];
  let biPoly = biPolyArr ? new BiPolygon(biPolyArr[0], biPolyArr[1]) : to(target).biPolygon(target, environment);
  if (biPoly === null) return null;

  const {front, back} = getFrontAndBack(biPoly, normals.z);
  let length = 0;
  front.lines().forEach(l => length += l.length());
  const overKill = 10 * length;
  const thickness = front.distance(back);
  const expandThickness = (ingulf ? overKill : thickness);
  const distance = thickness * offsetRatio;
  let offsetVector = normals[axis].scale(distance);
  const offsetDirection = front.toPlane().connect.vertex(fromPoint).negitive().vector();
  const modelPoly = expandPoly(biPoly, offsetDirection, fromPoint, ingulf, offsetVector, front, back, expandThickness, target);
  return modelPoly.model();
}

function RegExpModel(rMdto, environment, to) {
  let regStr = rMdto.regexp;
  let modelReg = new RegExp(regStr.substring(1, regStr.length - 1));
  let offsetRatio = rMdto.offsetRatio;
  let ingulf = rMdto.ingulf;
  let axis = rMdto.axis || 'z';
  let objs = Object.values(environment.byId);
  let targets = objs.filter((obj) => obj.partCode && (obj.partCode.match(modelReg) || obj.locationCode.match(modelReg)));
  let fromPoint = rMdto.fromPoint;
  if (!fromPoint) fromPoint = CabinetUtil.instance(rMdto, environment).partCenter();
  let csg = new CSG();
  for (let index = 0; index < targets.length; index++) {
    const model = getModel(targets[index], axis, offsetRatio, fromPoint, ingulf, environment, to);
    if (model) csg = csg.union(model);
  }

  // console.log(csg.toString());
  return csg;
}

module.exports = {
  RegExpModel
}
