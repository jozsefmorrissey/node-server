
const Polygon3D = require('../../../../app-src/three-d/objects/polygon.js');
const Plane = require('../../../../app-src/three-d/objects/plane.js');
const Line3D = require('../../../../app-src/three-d/objects/line.js');
const Layer = require('../../../../app-src/three-d/objects/layer.js');

const Tolerance = require('../../../../../../public/js/utils/tolerance.js');
const ToleranceMap = require('../../../../../../public/js/utils/tolerance-map.js');
const within = Tolerance.within(.0001);

const NORM_FUNCTIONS = [
  // Single Plane Layer
  (set, parrelleSets, zPolys, partNormals) => {
    if (set.length !== 1) return null;
    if (zPolys.length === 1)
      console.error('Single normals should not be based on a single layer inline with z norm ....');
    const normals = Polygon3D.normals(set[0]).swap('x', 'z');
    const zNorm = partNormals.z;
    let yMoreInlineWithZ = Math.abs(normals.z.dot(zNorm)) < Math.abs(normals.y.dot(zNorm));
    if (yMoreInlineWithZ)
    normals.swap('z', 'y')
    normals.x = normals.x.scale(0);
    return normals;
  }
];

function defaultNormalFunction(set, parrelleSets, zPolys) {
  if (set.length === 1 && zPolys.length === 0)
    return Polygon.normals(set[0]).swap('x', 'z');
  if (zPolys.length > 1 || zPolys.length === 0)
    throw new Error('Have not coded for this yet.(shouldnt have too)');
  const lines = zPolys[0].lines();
  if (lines.length > 4)
    lines[0].combineOrder(lines[4]);
  if (zPolys.length === 1) {
    return Polygon3D.normals(zPolys[0]);
  }
  throw new Error('Have not coded for this yet(shouldnt have too)');
}

function limitLine(axis, plane, failOnNoLen, adjustEndPoint) {
  if (axis[0].DIRECTIONAL === undefined) axis[0].DIRECTIONAL = axis[1].DIRECTIONAL = true;
  if (within(axis.length(), 0)) {
    if (failOnNoLen)
      throw new Error('This axis is supposed to have a valid Length');
  }
  const int = plane.intersection.line(axis);
  if (!int) return;
  if (int instanceof Line3D) return;
  let distanceFromStart = axis[0].distance(int);
  let distanceFromEnd = axis[1].distance(int);
  if (adjustEndPoint) {
    const index = distanceFromEnd < distanceFromStart ? 1 : 0;
    axis[index].positionAt(int);
    distanceFromStart = axis[0].distance(int);
    distanceFromEnd = axis[1].distance(int);
  }
  if (within(distanceFromStart, 0)) {
    axis[0].DIRECTIONAL = false;
  }
  if (within(distanceFromEnd, 0)) {
    axis[1].DIRECTIONAL = false;
    axis.invert();
  }
  if (axis[0].DIRECTIONAL === true)axis.invert();
}

function limitAxis(axis, planesOlayersOpolys) {
  planesOlayersOpolys.forEach(pOlOp => {
    const plane = pOlOp.toPlane ? pOlOp.toPlane() : pOlOp;
    limitLine(axis.x, plane);
    limitLine(axis.y, plane, true, true);
    limitLine(axis.z, plane);
  })
  return axis;
}

function alignZpolyNorms(zPolys, overlapingLayers, zPolyFilter) {
  if (zPolys.length < 1) return;
  let modelZpolys = overlapingLayers.filter(zPolyFilter);
  let zUnitDir;
  for (let mi = 0; !zUnitDir && mi < modelZpolys.length; mi++) {
    const mzp = modelZpolys[mi];
    let found = false;
    for (let index = 0; !found && index < zPolys.length; index++) {
      if (zPolys[index].hash() === mzp.hash()){
        found = true;
      }
    }
    if (!found) {
      const connector = mzp.toPlane().connect.vertex(zPolys[0].center());
      zUnitDir = connector.vector().unit();
    }
  }

  if (zUnitDir) {
    zPolys.forEach((poly, index) => zUnitDir.sameDirection(poly.normal()) ||
      (zPolys[index] = zPolys[index].reverse()));
  }
}

function buildAxis(inBoth, overlapLayers, zPolys, zFilter, normals) {
  const sets = Polygon3D.parrelleSets(inBoth);
  alignZpolyNorms(zPolys, overlapLayers, zFilter);

  const validObjects = [];
  let norms;
  for (let index = 0; !norms && index < NORM_FUNCTIONS.length; index++) {
    const normFunc = NORM_FUNCTIONS[index];
    norms = normFunc(inBoth, sets,  zPolys, normals);
  }
  norms ||= defaultNormalFunction(inBoth, sets,  zPolys);
  // console.log(inBoth.map(l => l.toDrawString('green')).concat(['',''])
                // .concat(targetLayers.map(l => l.toDrawString('red')).concat(['',''])
                // .concat(overlapLayers.map(l => l.toDrawString()))).join('\n'));
  let axis = Polygon3D.axis(inBoth, norms).max;
  limitAxis(axis, inBoth);
  return axis;
}

function existsInBothSets(set1, set2) {
  const tol = .001;
  const tolMap = new ToleranceMap({'normal().positiveUnit().i()': tol,
                        'normal().positiveUnit().j()': tol,
                        'normal().positiveUnit().k()': tol,
                        'toPlane().axisIntercepts().x': tol,
                        'toPlane().axisIntercepts().y': tol,
                        'toPlane().axisIntercepts().z': tol});
  tolMap.addAll(set2);
  const existsInBoth = [];
  for (let index = 0; index < set1.length; index++) {
    const poly = set1[index];
    const matches = tolMap.matches(poly);
    let found = false;
    for (let j = 0; !found && j < matches.length; j++) {
      if (poly.overlaps(matches[j], true)) {
        existsInBoth.push(poly);
        found = true;
      }
    }
  }
  return existsInBoth;
}

module.exports = (targetLayers, overlapingLayers, jointInfo) => {
  let existsInBoth = {};
  for (let i = 0; i < targetLayers.length; i++) {
    const tLayer = targetLayers[i];
    let found = false;
    for (let j = 0; !found && j < overlapingLayers.length; j++) {
      let oLayer = overlapingLayers[j];
      let hash = oLayer.hash();
      const equivNorms = oLayer.normal().positiveUnit().equals(tLayer.normal().positiveUnit());
      if (equivNorms) {
        if (existsInBoth[hash] === undefined && tLayer.overlaps(oLayer.combined(), true)) {
          tLayer.overlaps(oLayer, true);
          tLayer.overlaps(oLayer, true);
          existsInBoth[hash] = oLayer;
          found = true;
        }
      }
    }
  }
  existsInBoth = Object.values(existsInBoth);

  if (existsInBoth.length === 0) {
    return null;
  }
  // existsInBoth = existsInBothSets(overlapingLayers, modelPolys);

  const normals = jointInfo.partInfo().normals();
  const zNorm = normals.z;
  if (jointInfo.joint().descriptor === 'Butt(FrameOtherPanelJoint)') {
    console.log('her')
  }
  const layerDot = l => Math.abs(l.normal().dot(zNorm));
  const zPolyEqFilter = p => p.normal().positiveUnit()
                        .equals(zNorm.positiveUnit());
  let zPolys = existsInBoth.filter(zPolyEqFilter);
  if (zPolys.length === 0 && existsInBoth.length > 1) {
    const dots = existsInBoth.map((l,i) => ({dot: layerDot(l),i}));
    dots.sortByAttr('dot', true);
    for (let index = 0; !zPolys.length && index < dots.length; index++) {
      if (dots[index].dot < .2) continue;
      const maleNorms = jointInfo.male.normals();
      const layer = existsInBoth[dots[index].i];
      if (maleNorms.y.equivalent(layer.normal())) {
        const count = existsInBoth.count(l => layer.normal().equivalent(l.normal()));
        if (count === 1) zPolys = [layer];
        else console.warn.logarithmic('Did not plan for this yet...')
      }
    }
  }
  let zFilter = () => false;
  if (zPolys.length) zFilter = l => zPolys.indexOf(l) !== -1;

  if (jointInfo.joint().descriptor === 'Butt(FrameOtherPanelJoint)') {
    console.log('her')
  }
  if (zPolys.length === 0) return existsInBoth.map(p =>
    limitAxis(buildAxis([p], overlapingLayers, [], zFilter, normals), existsInBoth));
  else return [buildAxis(existsInBoth, overlapingLayers, zPolys, zFilter, normals)];
}
