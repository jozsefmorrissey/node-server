const $t = require('../../../../../public/js/utils/$t.js');
const Global = require('../../services/global.js');
const Measurement = require('../../../../../public/js/utils/measurement.js');
const Vertex3D = require('../../three-d/objects/vertex.js');
const Vector3D = require('../../three-d/objects/vector.js');
const Line3D = require('../../three-d/objects/line.js');
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Polygon3D = require('../../three-d/objects/polygon.js');
const Joint = require('../../objects/joint/joint.js');
const template = new $t('documents/construction');
const partTemplate = new $t('documents/part');

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

const round = (val) => Math.round(val * 1000)/1000;
const zNormFilter = (p) => (norm = p.normal()) | norm.k() === -1 && !norm.i() && !norm.j();
const yNormFilter = (p) => (norm = p.normal()) | norm.j() && !norm.i() && !norm.k();
const xNormFilter = (p) => (norm = p.normal()) | norm.i() && !norm.j() && !norm.k();
let c = 0;
const checkNormal = (model, normalInfo, joint) => {
  applyNormalInfo(model, normalInfo);
  let polygons = Polygon3D.fromCSG(model.polygons);
  const face = polygons.filter(zNormFilter)[0];
  if (face === undefined) return null;
  return round(face.center().z) === 0 ? model : null;
}

function linesFromEndpoints(epts) {
  const pts = [new Vertex2d(epts['-x'], epts['-y']), new Vertex2d(epts['-x'], epts['y']),
              new Vertex2d(epts['x'], epts['y']), new Vertex2d(epts['x'], epts['-y'])]
  return [new Line2d(pts[0], pts[1]), new Line2d(pts[1], pts[2]),
                    new Line2d(pts[2], pts[3]), new Line2d(pts[3], pts[0])];
}

const normalize = (model, normInfoLeft, normInfoRight, joint) => {
  let side = 'Right';
  let normalizedRight = checkNormal(model.clone(), normInfoRight, joint);
  side = 'Left';
  let normalizedLeft = checkNormal(model.clone(), normInfoLeft);

  if (!normalizedRight && !normalizedLeft) return null;
  const both = normalizedRight && normalizedLeft;
  normInfoLeft = normalizedLeft ? normInfoLeft : undefined;
  normInfoRight = normalizedRight ? normInfoRight : undefined;
  let normInfo = {right: normInfoRight, left: normInfoLeft, type: both ? 'cut' : 'channel'};
  if (both) normInfo.normalized = normalizedRight;
  else normInfo.normalized = normalizedRight ? normalizedRight : normalizedLeft;
  return normInfo;
}

function cut(jointModel, cutList, normalizeInfo,  joint) {
  const normJMod = applyNormalInfo(jointModel.clone(), normalizeInfo);

  const modelLines = linesFromEndpoints(normalizeInfo.poly.endpoints());
  const jointLines = linesFromEndpoints(normJMod.endpoints());

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



function channel(jointModel, cutList, normalizeInfo, joint) {
  const normJMod = applyNormalInfo(jointModel.clone(), normalizeInfo);
  jointDems = normJMod.demensions();
  const polygons = Polygon3D.fromCSG(normJMod.polygons);
  const yPolys = polygons.filter(yNormFilter);
  const xPolys = polygons.filter(xNormFilter);
  let yPlanes = yPolys.map(p => p.toPlane());
  let xPlanes = xPolys.map(p => p.toPlane());
  const yVerts = [];
  yPolys.forEach((p, index) => p.vertices().forEach(v => yVerts.push({index, vert: v})));
  const xVerts = [];
  xPolys.forEach((p, index) => p.vertices().forEach(v => xVerts.push({index, vert: v})));
  const yLines = yVerts.map(i => ({index: i.index, line: Line3D.fromVector(yVector, i.vert)}));
  const xLines = xVerts.map(i => ({index: i.index, line: Line3D.fromVector(xVector, i.vert)}));

  const maxYDist = maxDist(yLines, yPlanes);
  const maxXDist = maxDist(xLines, xPlanes);
  const xWidth = maxXDist < maxYDist;
  const depth = jointDems.z;
  const width = xWidth ? maxXDist : maxYDist;
  if (xWidth) {
    line = longestLine(yPolys);
  } else {
    line = longestLine(xPolys);
  }
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
          cut1.line = combined;
          cut2.hide = true;
        }
      }
    }
  }
}

function modelToLines(model, normalizeInfo) {
  applyNormalInfo(model, normalizeInfo);
  return Polygon3D.lines2d(Polygon3D.fromCSG(model.polygons), 'x', 'y');
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
    const cutLine = cut.line.clone();
    if (cut.type === 'cut') {
      let isOn = false;
      const normalized = allJointModel.clone();
      const lines2d = modelToLines(allJointModel.clone(), cut.normalizeInfo);
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
        cutList.splice(index--, 1);
      }
    }
  }
}

function simplifyChannelCutts(cutList, noJointmodel) {
  const joints = cutList.filter(c => c.type === cut).map(c => c.joint).unique();
  const cutModel = applyJoints(noJointmodel, joints);
  console.log(Line2d.toDrawString(Polygon3D.lines2d(Polygon3D.fromCSG(cutModel.polygons))));
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
  return rightXDist > leftXDist ? normalizeInfo.right : normalizeInfo.left;
}

function determineChannelNormInfo(channelInfo, modelRight, modelLeft) {
  console.log(channelInfo);
  console.log(Line2d.toDrawString(Polygon3D.lines2d(Polygon3D.fromCSG(modelRight.polygons), 'x', 'y')));
  console.log(Line2d.toDrawString(Polygon3D.lines2d(Polygon3D.fromCSG(modelLeft.polygons), 'x', 'y')));
}

function buildCutList(joints, noJointmodel, normInfoRight, normInfoLeft) {
  const cutList = [];
  const channels = [];
  for (let index = 0; index < joints.length; index++) {
    const joint = joints[index];
    const maleModels = joint.maleModels();
    for (let mi = 0; mi < maleModels.length; mi++) {
      const maleModel = maleModels[mi];
      const jointModel = noJointmodel.intersect(maleModel);
      const normalizeInfo = normalize(jointModel, normInfoLeft, normInfoRight, joint);
      if (normalizeInfo) {
        let jointDems = normalizeInfo.normalized.demensions();
        if (jointDems.x > 0 || jointDems.y > 0 || jointDems.z > 0) {
          if (normalizeInfo.type === 'channel') {
            channels.push({jointModel, normalizeInfo, joint});
          } else if (normalizeInfo.type === 'cut') {
            const normInfo = determineCutNormInfo(jointModel, noJointmodel, normalizeInfo);
            cut(jointModel, cutList, normInfo, joint);
          }
        }
      } else {
        cutList.push(joint);
      }
    }
  }
  const cutModelLeft = applyJoints(noJointmodel, cutList.map(c => c.joint));
  applyNormalInfo(cutModelLeft, normInfoLeft);
  const cutModelRight = applyJoints(noJointmodel, cutList.map(c => c.joint));
  applyNormalInfo(cutModelRight, normInfoRight);
  for (let index = 0; index < channels.length; index++) {
    const chan = channels[index];
    const jointModel = chan.jointModel;
    const normalizeInfo = chan.normalizeInfo;
    const joint = chan.joint;
    determineChannelNormInfo(chan, cutModelRight, cutModelLeft);
    channel(jointModel, cutList, normalizeInfo.right ? normalizeInfo.right : normalizeInfo.left, joint);
  }
  cleanCutList(cutList, joints, noJointmodel);
  return cutList;
}

function addSideViews(info, noJointmodel, normInfoRight, normInfoLeft) {
  const cuts = info.cutList.filter(c => c.type === 'cut');
  const cutJoints = cuts.map(c => c.joint);
  let cutModelRight = applyJoints(noJointmodel, cutJoints);
  let cutModelLeft = cutModelRight.clone();

  const channels = info.cutList.filter(c => c.type === 'channel');
  const rightChannels = channels.filter(c => c.normalizeInfo.side === 'Right').map(c => c.joint);
  const leftChannels = channels.filter(c => c.normalizeInfo.side === 'Left').map(c => c.joint);
  cutModelRight = applyJoints(cutModelRight, rightChannels);
  cutModelLeft = applyJoints(cutModelLeft, leftChannels);


  applyNormalInfo(cutModelRight, normInfoRight);
  applyNormalInfo(cutModelLeft, normInfoLeft);
  console.log(Polygon3D.toDrawString2d(Polygon3D.fromCSG(cutModelRight)))
  console.log(Polygon3D.toDrawString2d(Polygon3D.fromCSG(cutModelLeft)))


}

function partInfo(part) {
  const joints = part.getJoints().female;
  const noJointmodel = part.toModel([]);

  const normRotz = part.position().normalizingRotations();
  const normInfoRight = noJointmodel.normalize(normRotz, false, true);
  const normInfoLeft = noJointmodel.normalize(normRotz, true, true);

  const model = part.toModel();
  const dems = model.demensions();
  dems.x = round(dems.x); dems.y = round(dems.y); dems.z = round(dems.z);
  const cutList = buildCutList(joints, noJointmodel, normInfoRight, normInfoLeft);
  const parts = [part];
  const info = {parts, model, dems, joints, cutList}
  if (cutList) {
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
      if (info.joints.length > 0) return;
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

function cutDisplay(cutInfo) {
  if (cutInfo.hide === true) return;
  if (cutInfo instanceof Joint)
    return disp.joint(cutInfo);
  else if (cutInfo.type === 'channel')
    return disp.channel(cutInfo);
  else if (cutInfo.type === 'cut')
    return disp.cut(cutInfo);
}

const html = {
  order: (order) => {
    order ||= Global.order();
    return template.render({order, sortParts, cutDisplay, disp});
  },
  part: (part) => {
    const info = partInfo(part);
    return partTemplate.render({info, cutDisplay, disp});
  }
};

module.exports = {
  html, display: disp
}
