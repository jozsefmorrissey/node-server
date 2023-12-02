const $t = require('../../../../../public/js/utils/$t.js');
const Global = require('../../services/global.js');
const Measurement = require('../../../../../public/js/utils/measurement.js');
const Vertex3D = require('../../three-d/objects/vertex.js');
const Vector3D = require('../../three-d/objects/vector.js');
const Line3D = require('../../three-d/objects/line.js');
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Polygon2d = require('../../../../../public/js/utils/canvas/two-d/objects/polygon.js');
const Polygon3D = require('../../three-d/objects/polygon.js');
const Joint = require('../../objects/joint/joint.js');
const Draw2d = require('../../../../../public/js/utils/canvas/two-d/draw.js');
const du = require('../../../../../public/js/utils/dom-utils');
const Tolerance = require('../../../../../public/js/utils/tolerance.js');

const within = Tolerance.within(.0001);

const template = new $t('documents/construction');
const partTemplate = new $t('documents/part');

function modelToLines(model) {
  return Polygon3D.lines2d(Polygon3D.fromCSG(model.polygons), 'x', 'y');
}

const disp = (val) => new Measurement(Math.abs(val)).display();
disp.vertex3D = (vert) => `(${disp(vert.x)}, ${disp(vert.y)})`;//` X ${disp(vert.z)}`;
disp.vertex2d = (vert) => `(${disp(vert.x())}, ${disp(vert.y())})`;
disp.demensions = (dems) => `${disp(dems.x)} X ${disp(dems.y)} X ${disp(dems.z)}`;
disp.joint = (joint) => `See model for joint: ${joint.toString()}`;
disp.channel = (cutInfo) => `<b>${cutInfo.normalizeInfo.side}</b> side <b>${disp(cutInfo.depth)}</b> deep and <b>${disp(cutInfo.width)}</b> wide from <b>${disp.vertex2d(cutInfo.line.startVertex())}</b> to <b>${disp.vertex2d(cutInfo.line.endVertex())}</b>`;
disp.cut = (cutInfo) => `<b>${cutInfo.normalizeInfo.side}</b> side cut from <b>${disp.vertex2d(cutInfo.line.startVertex())}</b> to <b>${disp.vertex2d(cutInfo.line.endVertex())}</b>`;
disp.partCodes = (parts) => parts.map(p => p.partCode(true)).toString();

const typeFilter = (obj) => {
  const cn = obj.constructor.name;
  if (cn === 'DrawerBox') return 'DrawerBox';
  if (cn === 'Handle') return 'Handle';
  if (cn === 'PanelModel') return 'Panel';
  if (cn === 'DrawerFront') return 'DrawerFront';
  if (cn === 'Door') return 'Door';
  if (cn === 'Panel') return 'Panel';
  return 'unknown';
}

const maxDist = (lines, planes) => {
  let max = 0;
  if (planes.length === 0) {
    console.warn('I dont think this should happen');
  }
  for (let i = 0; i < lines.length; i++) {
    const lineInfo = lines[i];
    for (let j = 0; j < planes.length; j++) {
      const plane = planes[j];
      if (lineInfo.index !== j) {
        const intersection = plane.intersection.line(lineInfo.line);
        if (intersection) {
          const dist = lineInfo.line.startVertex.distance(intersection);
          if (max < dist) max = dist;
        } else {
          console.warn('I dont think this should happen');
        }
      }
    }
  }
  return max;
}

function applyNormalInfo(model, normalizeInfo) {
  model.rotate(normalizeInfo.rotations);
  model.translate(normalizeInfo.translationVector);
  return model;
}

const origin = new Vertex2d();
const lineFromOrigin = (line) => {
  const sv = line.startVertex();
  const ev = line.endVertex();
  return sv.distance(origin) < ev.distance(origin) ? line : line.negitive();
}

const longestLine = (polys) => {
  let longestLine = new Line2d(polys[0].center(), polys[1].center());
  for (let i = 1; i < polys.length; i++) {
    for (let j = i + 1; j < polys.length; j++) {
      let line = new Line2d(polys[i].center(), polys[j].center());
      if (line.length() > longestLine.length()) longestLine = line;
    }
  }

  return lineFromOrigin(longestLine);
}

function print(allJointCsg, fenceLine, cutLine) {
  str = '';
  str += Polygon3D.toDrawString2d(Polygon3D.fromCSG(allJointCsg), 'x', 'y');
  str += Line2d.toDrawString([fenceLine, cutLine], 'red', 'green', 'blue', 'purple');
  console.log(str);
}

const round = (val) => Math.round(val * 1000)/1000;
const zNormFilter = (p) => (norm = p.normal()) | norm.k() === -1 && !norm.i() && !norm.j();
const yNormFilter = (p) => (norm = p.normal()) | norm.j() && !norm.i() && !norm.k();
const xNormFilter = (p) => (norm = p.normal()) | norm.i() && !norm.j() && !norm.k();
let c = 0;
const checkNormal = (model, normalInfo, joint) => {
  model = applyNormalInfo(model.clone(), normalInfo);
  normalInfo.jointModel = model;
  let polygons = Polygon3D.fromCSG(model.polygons);
  const face = polygons.filter(zNormFilter)[0];
  if (face === undefined) return null;
  return within(face.center().z, 0) ? model : null;
}

function linesFromEndpoints(epts) {
  const pts = [new Vertex2d(epts['-x'], epts['-y']), new Vertex2d(epts['-x'], epts['y']),
              new Vertex2d(epts['x'], epts['y']), new Vertex2d(epts['x'], epts['-y'])]
  return [new Line2d(pts[0], pts[1]), new Line2d(pts[1], pts[2]),
                    new Line2d(pts[2], pts[3]), new Line2d(pts[3], pts[0])];
}

const normalize = (model, normInfoLeft, normInfoRight, joint) => {
  let normalizedRight = checkNormal(model.clone(), normInfoRight, joint);
  let normalizedLeft = checkNormal(model.clone(), normInfoLeft);

  if (!normalizedRight && !normalizedLeft) return null;
  const both = normalizedRight && normalizedLeft;
  let normInfo = {right: normInfoRight, left: normInfoLeft, type: both ? 'cut' : 'channel'};
  if (!both) normInfo.side = normalizedLeft ? 'Left' : 'Right';
  normInfo.normalized = normalizedRight ? normalizedRight : normalizedLeft;
  return normInfo;
}

function cut(cutInfo, cutList, channels) {
  const normalizeInfo = cutInfo.normalizeInfo;
  const jointModel = cutInfo.jointModel;
  const joint = cutInfo.joint;
  normalizeInfo.side = 'Left';
  const normInfoRight = normalizeInfo.right;
  const normJMod = applyNormalInfo(jointModel.clone(), normInfoRight);

  const modelLines = modelToLines(normInfoRight.poly);
  const jointLines = modelToLines(normJMod);

  const lines = [];
  for (let index = 0; index < jointLines.length; index++) {
    const jLine = lineFromOrigin(jointLines[index]);
    let onLine = false;
    for (let j = 0; !onLine && j < modelLines.length; j++) {
      const mLine = modelLines[j];
      if (mLine.isOn(jLine.startVertex()) && mLine.isOn(jLine.endVertex())) {
        onLine = true;
      }
    }
    if (!onLine) {
      cutList.push({normalizeInfo, line: jLine, type: 'cut', joint, jointModel});
    }
  }
}


let staticZfilter = (p) => {
  const verts = p.vertices();
  let total = 0;
  for (let index = 0; index < verts.length; index++) {
    const vert = verts[index];
    if (total === 0) total = vert.z;
    else {
      if (!within(vert.z, (total / (index)))) return false;
      total += vert.z;
    }
  }
  return true;
}

function allSidesParrelleToAnAxis(csg) {
  const sets = Polygon3D.parrelleSets(Polygon3D.fromCSG(csg))
  const abs = Math.abs;
  const sums = sets.map(s => (n = s[0].normal()) && abs(n.i()) + abs(n.j()) + abs(n.k()))
  return sums.filter(sum => sum != 1).length === 0;
}

function channel(jointModel, cutList, normalizeInfo, joint) {
  const side = normalizeInfo.side === 'Left' ? 'right' : 'left';
  const relivantNormInfo = normalizeInfo[side];
  const normJMod = applyNormalInfo(jointModel.clone(), relivantNormInfo);
  jointDems = normJMod.demensions();
  const polygons = Polygon3D.fromCSG(normJMod.polygons);

  const zPolys = polygons.filter(staticZfilter);
  if (zPolys.length !== 2) {
    throw new Error('This is not a channel need to detect this somehow');
  }
  const poly0 = zPolys[0];
  const poly1 = zPolys[1];
  const lineGroup = Line3D.parrelleSets(Line3D.combine(poly0.lines()));
  let longestParrelleInfo = {length: 0, index: null};
  for (let index = 0; index < lineGroup.length; index++) {
    const group = lineGroup[index];
    if (group.length === 2) {
      const line1 = group[0];
      const line2 = group[1];
      const length = line1.length() > line2.length() ? line1.length() : line2.length();
      if (length > longestParrelleInfo.length) {
        longestParrelleInfo = {length, index}
      }
    }
  }
  if (longestParrelleInfo.index === null) {
    throw new Error('This is not a channel need to detect this somehow');
  }
  const cutLines = lineGroup[longestParrelleInfo.index];
  let line = Line3D.averageLine(cutLines);
  line = new Line2d(line.startVertex, line.endVertex);
  const width = cutLines[0].distance(cutLines[1]);
  const depth = poly0.distance(poly1);

  cutList.push({normalizeInfo, width, depth, line, type: 'channel', joint, jointModel});
}

function combineLinearCuts(cutList) {
  for (let i = 0; i < cutList.length; i++) {
    for (let j = i + 1; j < cutList.length; j++) {
      const cut1 = cutList[i];
      const cut2 = cutList[j];
      if (cut1.type === 'cut' && cut2.type === 'cut') {
        const combined = cut1.line.combine(cut2.line);
        if (combined) {
          cut1.jointModel = cut1.jointModel.union(cut2.jointModel);
          cut1.normalizeInfo.left.jointModel = cut1.normalizeInfo.left.jointModel.union(cut2.normalizeInfo.left.jointModel);
          cut1.normalizeInfo.right.jointModel = cut1.normalizeInfo.right.jointModel.union(cut2.normalizeInfo.right.jointModel);
          cut1.line = combined;
          cut2.hide = true;
        }
      }
    }
  }
}

const applyJoints = (model, joints) => {
  for (let j = 0; j < joints.length; j++) {
    const joint = joints[j];
    model = model.subtract(joint.maleModel());
  }
  return model;
}

function removeUnneccisaryCuts(cutList, joints, noJointmodel) {
  let allJointModel = applyJoints(noJointmodel, joints);

  for (let index = 0; index < cutList.length; index++) {
    const cut = cutList[index];
    if (cut.type === 'cut') {
      const cutLine = cut.line.clone();
      let isOn = false;
      const normalized = applyNormalInfo(allJointModel.clone(), cut.normalizeInfo.right);
      const lines2d = modelToLines(normalized);
      const poly = Polygon2d.fromDemensions(normalized.demensions(), normalized.center());
      if (poly.passesThrough(cutLine)) {
        for (let lIndex = 0; !isOn && lIndex < lines2d.length; lIndex++) {
          const line = lines2d[lIndex].clone();
          const consoldated = Line2d.consolidate(cutLine, line);
          if (consoldated.length === 1) {
            if (line.length() + cutLine.length() > consoldated[0].length() + .00001) {
              isOn = true;
            }
          }
        }
        if (!isOn) {
          cut.hide = true;
        }
      } else {
        cut.hide = true;
      }
    }
  }
}

const jointsFromCutlist = (cl) => cl.map(c => c instanceof Joint ? c : c.joint).unique();

function simplifyChannelCutts(cutList, noJointmodel) {
  const joints = jointsFromCutlist(cutList);
  const cutModel = applyJoints(noJointmodel.clone(), joints);
}

function cleanCutList(cutList, joints, noJointmodel) {
  removeUnneccisaryCuts(cutList, joints, noJointmodel);
  combineLinearCuts(cutList);
}

function determineCutNormInfo(jointModel, noJointmodel, normalizeInfo) {
  const rightCenter = applyNormalInfo(jointModel.clone(), normalizeInfo.right).center()
  const leftCenter = applyNormalInfo(jointModel.clone(), normalizeInfo.left).center()
  const rightEpts = applyNormalInfo(noJointmodel.clone(), normalizeInfo.right).endpoints();
  const leftEpts = applyNormalInfo(noJointmodel.clone(), normalizeInfo.left).endpoints();
  const rightXDist = Math.abs(rightCenter.x + rightEpts.x)/2;
  const leftXDist = Math.abs(leftCenter.x + leftEpts.x)/2;
  normalizeInfo.side = rightXDist > leftXDist ? 'right' : 'left';
}

const printPolys = (csgs, colors) => {
  colors ||= [];
  let str = '';
  for (let index = 0; index < csgs.length; index++) {
    const polys = Polygon3D.fromCSG(csgs[index]);
    const color = colors[index%colors.length];
    for (let j = 0; j < polys.length; j++) {
      str += polys[j].toDrawString(color) + '\n';
    }
    str += '\n';
  }
  console.log(str);
}

function buildCutList(joints, noJointmodel, normInfoRight, normInfoLeft) {
  const cutList = [];
  const channels = [];
  const cuts = [];
  for (let index = 0; index < joints.length; index++) {
    const joint = joints[index];
    const maleModels = joint.maleModels();
    for (let mi = 0; mi < maleModels.length; mi++) {
      const maleModel = maleModels[mi];
      const jointModel = noJointmodel.clone().intersect(maleModel);
      const normalizeInfo = normalize(jointModel, normInfoLeft, normInfoRight, joint);
      if (normalizeInfo) {
        let jointDems = normalizeInfo.normalized.demensions();
        if (jointDems.x > 0 || jointDems.y > 0 || jointDems.z < 0) {
          if (normalizeInfo.type === 'channel') {
            channels.push({jointModel, normalizeInfo, joint});
          } else if (normalizeInfo.type === 'cut') {
            // const normInfo = determineCutNormInfo(jointModel, noJointmodel, normalizeInfo);
            cuts.push({jointModel, normalizeInfo, joint});
          }
        }
      } else if (jointModel.polygons.length > 0) {
        cutList.push(joint);
      }
    }
  }

  cuts.forEach(cutInfo => cut(cutInfo, cutList, channels));

  let cutModelLeft = applyJoints(noJointmodel.clone(), jointsFromCutlist(cutList));
  cutModelLeft = applyNormalInfo(cutModelLeft, normInfoLeft);
  let cutModelRight = applyJoints(noJointmodel.clone(), jointsFromCutlist(cutList));
  cutModelRight = applyNormalInfo(cutModelRight, normInfoRight);
  for (let index = 0; index < channels.length; index++) {
    const chan = channels[index];
    const jointModel = chan.jointModel;
    const normalizeInfo = chan.normalizeInfo;
    const joint = chan.joint;
    channel(jointModel, cutList, normalizeInfo, joint);
  }
  cleanCutList(cutList, joints, noJointmodel);
  return cutList;
}

const scaledMidpoint = (l, center, coeficient, transLine) => {
  const midpoint = l.clone().translate(transLine).midpoint();
  let CSGv = new CSG.Vertex({x:midpoint.x(),y: midpoint.y(),z: 0}, [1,0,0]);
  CSGv.scale(center,  coeficient);
  return {
    x: ((midpoint.x() - center.x)*coeficient) + center.x,
    y: ((midpoint.y() - center.y)*coeficient) + center.y
  }
}

const textProps = {size: '10px', radians: Math.PI};
function buildCanvas(model, info) {
  model = model.clone();
  const canvas = du.create.element('canvas', {class: 'upside-down'});
  const newCenter = {x: canvas.width / 2, y: canvas.height/2, z:0};
  const sideLabelCenter = {x: canvas.width - 5, y: canvas.height - 10, z:0};
  const dems = model.demensions();
  const coeficient = ((canvas.height*.6) / dems.y);
  model.scale(coeficient);
  model.center(newCenter);
  const draw = new Draw2d(canvas);
  const lines = Polygon3D.lines2d(Polygon3D.fromCSG(model), 'x', 'y');
  draw(lines, null, .3);
  draw.text(info.side, sideLabelCenter, textProps);
  const transLine = new Line2d(Vertex2d.center(Line2d.vertices(info.sides)), newCenter);
  info.sides.forEach(l => draw.text(l.label, scaledMidpoint(l, newCenter, coeficient, transLine), textProps));
  return canvas;
}

function addSideViews(info, noJointmodel, normInfoRight, normInfoLeft) {
  const cuts = info.cutList.filter(c => c.type === 'cut');
  const cutJoints = jointsFromCutlist(cuts);
  let cutModelRight = applyJoints(noJointmodel.clone(), cutJoints);
  let cutModelLeft = cutModelRight.clone();

  const channels = info.cutList.filter(c => c.type === 'channel');
  const rightChannels = jointsFromCutlist(channels.filter(c => c.normalizeInfo.side === 'Right'));
  const leftChannels = jointsFromCutlist(channels.filter(c => c.normalizeInfo.side === 'Left'));
  cutModelRight = applyJoints(cutModelRight, rightChannels);
  cutModelLeft = applyJoints(cutModelLeft, leftChannels);


  cutModelRight = applyNormalInfo(cutModelRight, normInfoRight);
  cutModelLeft = applyNormalInfo(cutModelLeft, normInfoLeft);
  info.views = {
    right: buildCanvas(cutModelRight, normInfoRight),
    left: buildCanvas(cutModelLeft, normInfoLeft)
  }
}

function addModels(info, noJointmodel, normInfoRight, normInfoLeft) {
  const cuts = info.cutList.filter(c => c.type === 'cut').map(c => c.joint);
  const others = info.cutList.filter(c => c.type !== 'cut').map(c => c.joint);

  let cutModelRight = applyJoints(noJointmodel.clone(), cuts);
  let cutModelLeft = cutModelRight.clone();

  let allJointModelRight = applyJoints(cutModelRight.clone(), others);
  let allJointModelLeft = allJointModelRight.clone();

  cutModelRight = applyNormalInfo(cutModelRight, normInfoRight);
  cutModelLeft = applyNormalInfo(cutModelLeft, normInfoLeft);
  allJointModelRight = applyNormalInfo(allJointModelRight, normInfoRight);
  allJointModelLeft = applyNormalInfo(allJointModelLeft, normInfoLeft);
  normInfoRight.models = {
    none: noJointmodel,
    all: allJointModelRight,
    cuts: cutModelRight
  }
  normInfoLeft.models = {
    none: noJointmodel,
    all: allJointModelLeft,
    cuts: cutModelLeft
  }
}

let fenceSides = (sides, reverse) => {
  let pairs = {};
  let fenceSs = [];
  for (let index = 0; index < sides.length; index++) {
    const side = sides[index];
    const rads = round((side.radians() + Math.PI * 2) % Math.PI);
    const targetGroup = Object.values(pairs).filter(p => Math.modTolerance(rads, p.number, Math.PI, .001));
    if (targetGroup.length === 0) {
      pairs[rads] = parrelleSides(sides, side);
      pairs[rads].number = rads;
    }
  }
  Object.values(pairs).forEach(sides => sides.forEach(side => fenceSs.push(side)));

  fenceSs.sort(Line2d.sorter(Line2d.center(fenceSs), -135));
  if (reverse) {
    fenceSs = fenceSs.slice(1,).concat(fenceSs[0]);
    fenceSs.reverse();
  }
  return fenceSs;
}

function addSideList(info, noJointmodel, normInfoRight, normInfoLeft) {
  normInfoRight.sides = Polygon3D.lines2d(Polygon3D.fromCSG(normInfoRight.models.cuts), 'x', 'y');
  normInfoLeft.sides = Polygon3D.lines2d(Polygon3D.fromCSG(normInfoLeft.models.cuts), 'x', 'y');

  const lines = normInfoRight.sides.concat(normInfoLeft.sides);
  let index = 'A'.charCodeAt(0);
  fenceSides(normInfoRight.sides).forEach(l => l.label = String.fromCharCode(index++));
  index = 'A'.charCodeAt(0);
  fenceSides(normInfoLeft.sides, true).forEach(l => l.label = String.fromCharCode(index++));
}

function partInfo(part) {
  const joints = part.getJoints().female;
  const noJointmodel = part.toModel([]);

  const normRotz = part.position().normalizingRotations();
  const normInfoRight = noJointmodel.clone().normalize(normRotz, true, true);
  const normInfoLeft = noJointmodel.clone().normalize(normRotz, false, true);

  const model = part.toModel();
  const dems = model.demensions();
  dems.x = round(dems.x); dems.y = round(dems.y); dems.z = round(dems.z);
  const cutList = buildCutList(joints, noJointmodel, normInfoRight, normInfoLeft);
  const parts = [part];
  const info = {parts, model, dems, joints, cutList}
  if (cutList) {
    addModels(info, noJointmodel, normInfoRight, normInfoLeft);
    addSideList(info, noJointmodel, normInfoRight, normInfoLeft);
    addSideViews(info, noJointmodel, normInfoRight, normInfoLeft);
  }
  return info;
}

const xVector = new Vector3D(1,0,0);
const yVector = new Vector3D(0,1,0);
function sortParts(parts) {
  const sorted = {};
  parts.forEach(part => {
    const pInfo = partInfo(part);
    const type = typeFilter(part);
    if (sorted[type] === undefined) sorted[type] = [];
    let found = false;
    sorted[type].forEach(info => {
      if (info.cutInfo().length > 0) return;
      if (Object.equals(pInfo.dems, info.dems)) {
        found = true;
        info.parts.push(part);
      }
    });
    if (!found) {
      sorted[type].push(pInfo);
    }
  });
  return sorted;
}

function notOnSideAndIntersectsBeforeCut(lines, cutLine, info) {
  const cut3d = new Line3D(cutLine.startVertex().point(), cutLine.endVertex().point());
  const cutStartY = Math.min(cutLine.startVertex().y(), cutLine.endVertex().y());
  info.noIntersections = true;
  return (poly) => {
    const intersection = poly.intersection.line(cut3d);
    if (!intersection) return false;
    let found = false;
    const polyLines = poly.to2D('x', 'y').lines();
    lines.forEach(l1 => {
      let liesOn = true;
      polyLines.forEach(l2 => liesOn &&= l1.isOn(l2.midpoint()));
      found ||= liesOn;
    });
    if (!found) {
      info.noIntersections = false;
    }
    if (intersection.y > cutStartY) return false;
    return !found;
  }
}

const sideFilter = (cl) => {
  const min = round(Math.min(cl.startVertex().y(), cl.endVertex().y()));
  return (s) => !s.isParrelle(cl) && min >= round(cl.findIntersection(s).y());
}

function cutStartsOnSideClosestToBlade(sides, cutLine, info) {
  cutLine = cutLine.startVertex().y() > cutLine.endVertex().y() ? cutLine : cutLine.negitive();
  let noIntersection = true;
  for (let index = 0; index < sides.length; index ++) {
    const side = sides[index];
    const intersection = cutLine.findDirectionalIntersection(side);
    info.isSide ||= side.equals(cutLine);
    if (intersection instanceof Vertex2d &&
      side.withinSegmentBounds(intersection) &&
      !side.isEndpoint(intersection))
      noIntersection = false;
  }
  return noIntersection;
}

const lineDistanceSorter = (cl) => (a,b) => a.distance(cl) - b.distance(cl);

function determineCutLength(cutLine, lines, info) {
  const intersectingSides = lines.filter(sideFilter(cutLine));
  intersectingSides.sort(lineDistanceSorter(cutLine));
  const startSide = intersectingSides[0];
  const startVertex = cutLine.findIntersection(startSide);
  info.cutLength = new Line2d(startVertex, cutLine.endVertex()).combine(cutLine).length();
}

function validateTableSawPosition(lines, cutLine, info, allJointCsg) {
    switch(info.type) {
      case 'channel':
        const filter = notOnSideAndIntersectsBeforeCut(lines, cutLine, info);
        const allJointPoly = Polygon3D.fromCSG(allJointCsg);
        let intersected = allJointPoly.filter(filter);
        determineCutLength(cutLine, lines, info);
        return intersected.length === 0;
      case 'cut':
        const valid = cutStartsOnSideClosestToBlade(lines, cutLine, info);
        determineCutLength(cutLine, lines, info);
        return valid;
    }
}

function checkFenceLine(cutLine, lines, fenceLine, allJointCsg, info, cutCopy) {
  const sidesCenter = Line2d.center(lines);
  const rads = -fenceLine.perpendicular.connect(sidesCenter).negitive().radians();
  const linesCenter = Line2d.center(lines);
  allJointCsg.rotateAroundPoint({z: Math.toDegrees(rads)}, {x: linesCenter.x(), y: linesCenter.y(), z: 0});
  cutLine.rotate(rads, linesCenter);
  lines.forEach(l => l.rotate(rads, linesCenter));
  cutCopy.rotateAroundPoint({z: Math.toDegrees(rads)}, {x: linesCenter.x(), y: linesCenter.y(), z: 0});

  const cut3d = new Line3D(cutLine.startVertex().point(), cutLine.endVertex().point())
  const validPosition = info.joint.fullLength() ||
                      validateTableSawPosition(lines, cutLine, info, allJointCsg);
  if (!validPosition) return null;

  printPolys([cutCopy, allJointCsg], ['blue', 'red']);
  const jointFenceDist = fenceLine.distance(new Vertex3D(cutCopy.center()).to2D('x','y'), false);
  fenceLine.outsideOfBlade = jointFenceDist < cutLine.distance(fenceLine, false);

  return fenceLine;
}

function parrelleSides(sides, cutLine) {
  const parrelle = {right: [], left: [], equal: []};
  for(let index = 0; index < sides.length; index++) {
    const side = sides[index];
    if (side.isParrelle(cutLine)) {
      const midpoint = side.midpoint();
      const dist = cutLine.distance(side);
      if (cutLine.isRight(midpoint)) parrelle.right.push({side, dist});
      else if (cutLine.isLeft(midpoint)) parrelle.left.push({side, dist});
      else if (cutLine.equals(side)) parrelle.equal.push({side, dist});
    }
  }
  parrelle.right.sortByAttr('dist', true);
  parrelle.left.sortByAttr('dist', true);
  if (parrelle.right.length === 0) parrelle.right = parrelle.equal;
  else if (parrelle.left.length === 0) parrelle.left = parrelle.equal;
  const list = [parrelle.right[0], parrelle.left[0]].filter(s => s);
  list.sortByAttr('dist', true);
  return list.map(details => details.side)
}

const copySide = (side) => {let c = side.clone(); c.label = side.label; return c;};

function channelLengthDisplay(fenceLine, cutLine, info) {
  if (fenceLine === null || info.noIntersections || info.joint.fullLength()) return '';
  return ` for <b>${disp(info.cutLength)}</b>`;
}

const endpointEquals = (l, v) => l.endVertex().equals(v) || l.startVertex().equals();
function tableSawcutDisplay(info) {
  let displayMsg;

  const upSide = info.normalizeInfo.side === 'Left' ? 'Right' : 'Left';
  const normInfoUp = info.normalizeInfo[upSide.toLowerCase()];
  const sides = normInfoUp.sides.map(copySide);
  let cutLine = info.line.clone();
  const parrelles = parrelleSides(sides, cutLine);
  const minDist = info.type === 'channel' ? info.width/2 + .01 : 0;
  if (parrelles[1].distance(cutLine) > minDist) parrelles.reverse();

  const allJointCopy = normInfoUp.models.all.clone();
  const cutCopy = applyNormalInfo(info.jointModel.clone(), normInfoUp);//normInfoUp.jointModel.clone();
  let targetLine = checkFenceLine(cutLine, sides, parrelles[0], allJointCopy, info, cutCopy) ||
              checkFenceLine(cutLine, sides, parrelles[1], allJointCopy, info, cutCopy);

  const width = info.width ? info.width/2 : 0;
  const fenceDistance = disp(cutLine.distance(targetLine) - width);
  const lenDisp = channelLengthDisplay(targetLine, cutLine, info);
  let prefix = `<b>${disp(info.depth)}</b> deep, <b>${disp(info.width)}</b> wide, `;
  let bladeOuter = false;
  if (targetLine !== null) {
    if (info.type === 'cut') {
      prefix = '';
      bladeOuter = targetLine.outsideOfBlade;
      if (info.isSide) {
        const measCutLine = info.line.clone();
        const dems = normInfoUp.poly.demensions();
        measCutLine.startVertex().translate(dems.x, 0);
        measCutLine.endVertex().translate(dems.x, 0);
        const side = info.normalizeInfo.side;
        displayMsg = `<b>${side}</b> From <b>${disp.vertex2d(measCutLine.startVertex())}</b> To <b>${disp.vertex2d(measCutLine.endVertex())}</b>`
      }
    }
    const bo = bladeOuter ? ' OB' : '';
    if (displayMsg === undefined) displayMsg = `${prefix}<b>${upSide}</b> face up, <b>${targetLine.label}</b> against fence, @<b>${fenceDistance + bo}</b>${lenDisp}`;
  }
  return displayMsg !== undefined ?  displayMsg : `See scematics for joint: ${info.joint.toString()}`;
}

function cutDisplay(cutInfo) {
  if (cutInfo.hide === true) return;
  if (cutInfo instanceof Joint)
    return disp.joint(cutInfo);
  else if (cutInfo.type === 'channel')
    return tableSawcutDisplay(cutInfo);
  else if (cutInfo.type === 'cut')
    return tableSawcutDisplay(cutInfo);
}

function viewContainer(view) {
  const id = `view-container-${String.random()}`;
  setTimeout(() => {
    if (view) {
      const cnt = du.id(id);
      cnt.append(view);
    }
  });
  return id;
}
const html = {
  order: (order) => {
    order ||= Global.order();
    return template.render({order, sortParts, cutDisplay, disp, viewContainer});
  },
  part: (part) => {
    const info = partInfo(part);
    return partTemplate.render({info, cutDisplay, disp, viewContainer});
  }
};

module.exports = {
  html, display: disp
}
