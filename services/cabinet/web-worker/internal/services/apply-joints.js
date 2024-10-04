
const DTO = require('../../shared/data-transfer-object')();
const Layer = require('../../../app-src/three-d/objects/layer.js');
const Polygon3D = require('../../../app-src/three-d/objects/polygon.js');
const Vertex3D = require('../../../app-src/three-d/objects/vertex.js');
const Line3D = require('../../../app-src/three-d/objects/line.js');
const Vector3D = require('../../../app-src/three-d/objects/vector.js');
const BiPolygon = require('../../../app-src/three-d/objects/bi-polygon.js');
const Utils = require('./modeling/utils/utils');
const MaleJointApplicators = require('./modeling/male-joint-applicators');
const CabinetUtil = require('./modeling/utils/cabinet');
const MFC = require('./modeling/modeling-function-configuration.js');

// 5596.814139637636 miles...
const big = Number.MAX_SAFE_INTEGER/10000000;

const ensureCsg = (obj) => !(obj instanceof Object) || obj instanceof CSG ? obj : CSG.fromPolygons(obj.polygons, true);
function determineMales(assem, env) {
  const joints = env.jointMap.female[assem.id] || [];
  const maleIdObjs = [];
  joints.forEach(jId => {
    if (jId.startsWith('Auto')) return;
    const joint = env.byId[jId];
    const maleIdObj = env.jointMap[jId].male.map(id => ({id, joint}));
    maleIdObjs.concatInPlace(maleIdObj);
  });
  return maleIdObjs;
}

const fullLengthModel = (intersection) => {
  if (intersection.polygons.length === 0) return intersection;
  const axis = Layer.axis(Polygon3D.fromCSG(intersection)).y.vector();
  const center1 = new Vertex3D(intersection.center()).translate(axis);
  const center2 = new Vertex3D(intersection.center()).translate(axis.inverse());
  const intersection1 = intersection.clone();
  intersection1.center(center1);
  const intersection2 = intersection.clone();
  intersection2.center(center2);
  return intersection1.union(intersection).union(intersection2);
}

const demCheck = (m1,m2) => {
  const dems1 = m1.demensions();
  const dems2 = m2.demensions();
  const demSum1 = Math.roundTo(dems1.x+dems1.y+dems1.z);
  const demSum2 = Math.roundTo(dems2.x+dems2.y+dems2.z);
  return demSum1 === demSum2 ? true : `${demSum1} - ${demSum2} = ${demSum1 - demSum2}`;
}

function removeJointMaterial(map, assem, env, model, intersections) {
  const maleIdObjs = determineMales(assem, env);
  const id = assem.id;
  let malesModel = new CSG();
  if (intersections) env.modelInfo.intersection[id] ||= {};
  maleIdObjs.forEach(midObj => {
    const mid = midObj.id;
    if (!env.byId[mid].jointSettings.male) return;
    let mm = env.getModel(mid, 'joined');
    if (!mm)
      return console.warn(`I dont think you should see this id: '${env.byId[mid].locationCode}' does not have a joinedModel`);
    if (mm.polygons.length > 0) {
      let intersection;
      if (!(mm instanceof CSG)) mm = CSG.fromPolygons(mm.polygons, true);
      if (intersections) {
        const intersection = model.intersect(mm);
        if (intersection.polygons.length) env.modelInfo.intersection[id][mid] = intersection;
      }
      if (midObj.joint && midObj.joint.full.female)
      mm = fullLengthModel(intersection || model.intersect(mm));
      malesModel = malesModel.union(mm);
    }
  });
  try {
    if (model.polygons.length > 0) {
      const reduced = model.subtract(malesModel);
      if (demCheck(model, reduced) !== true) {
        console.warn(`error?: ${demCheck(model,reduced)}`);
      }
      env.modelInfo.joined[id] = reduced;
    }
  } catch (e) {
    console.warn(e);
  }
}

const femalePolyInformation = (femaleId, fbCenter, env) => () => {
  let femaleModel  = CSG.fromPolygons(env.getModel(femaleId, 'extended').polygons, true);
  const polys = Polygon3D.fromCSG(femaleModel);
  const assem = env.byId[femaleId];
  const norms = Utils.normals(assem, env);
  const polyObj = polys.filterSplit(p => p.normal().acquiescent(norms.z).dot(norms.z) > .99 ? 'z' : 'sides');
  polyObj.assem = env.byId[femaleId];
  if (polyObj.z) {
    const frontClosest = polyObj.z[0].distance(fbCenter) < polyObj.z[1].distance(fbCenter);
    if (!frontClosest) polyObj.z.swap(0,1);
    return polyObj;
  }
  console.warn(`Object normal is probably incorrect: '${assem.locationCode}'`);
  return null;
}

const getFemalePolyInfo = (joint, env, frontBackSet, modelCenter) => {
  const females = env.jointMap[joint.id].female;
  if (females.length > 1) {
    let one = 2;
  }
  const femalePolyInfo = [];
  const fbCenter = modelCenter;
  for (let fi = 0; females && fi < females.length; fi++) {
      femalePolyInfo.push(femalePolyInformation(females[fi], fbCenter, env));
  }
  return femalePolyInfo.length === 0 ? null : femalePolyInfo;
}

function applyMaleJointApplicator(joint, frontBackSet, assem, env, modelCenter) {
  const maleJointApplicator = MaleJointApplicators(joint);
  if (maleJointApplicator === undefined) return;
  const femalePolyInfos = getFemalePolyInfo(joint, env, frontBackSet, modelCenter);
  if (femalePolyInfos === null) return;
  const cutters = {cookie: [], joint: []};
  for (let index = 0; index < femalePolyInfos.length; index ++) {
    const cutObj = maleJointApplicator(assem, joint, femalePolyInfos[index], frontBackSet, env);
    if (cutObj) {
      cutters.cookie.concatInPlace(cutObj.cookie);
      cutters.joint.concatInPlace(cutObj.joint);
    }
  }
  return cutters;
}

function applyCutters(assem, cutters, env, group) {
  const id = assem.id;
  let model = env.getModel(id, 'cut');
  for (let index = 0; index < cutters.length; index++) {
    const cutter = cutters[index] instanceof Function ? cutters[index]() : cutters[index];
    if (cutter) {
      const jointId = `AutoJoint_${String.random()}`;
      const cutterId = `${group}_${jointId}`;
      const jointObj = {
        descriptor: cutterId, id: jointId
      }
      env.byId[jointId] = jointObj;
      env.modelInfo.cut[cutterId] = cutter;
      env.jointMap[jointId] = {male: [cutterId], female: [assem.id]};
      env.jointMap.female[assem.id] ||= [];
      env.jointMap.female[assem.id].push(jointId);
      env.modelInfo.intersection[id] ||= {};
      try {
        if (model.polygons.length > 0) {
          env.modelInfo.intersection[id] ||= {};
          env.modelInfo.intersection[id][cutterId] = model.intersect(cutter);
          model = model.subtract(cutter);
        }
      } catch (e) {
        console.error('Need to find the root cause of this issue');
        console.error(e);
      }
    }
  }
  return model;
}

const sel = /B:full/;
function buildExtendedModel(assem, joints, env) {
  const id = assem.id;
  let model = env.getModel(id, 'extended');
  if (model === undefined) return;
  const biPoly = BiPolygon.fromCSG(model, Utils.normals(assem, env));
  const frontBackSet = [biPoly.front(), biPoly.back()];
  const front = frontBackSet[0];
  const back = frontBackSet[1];
  if (back === undefined) {
    console.warn(`z normal is not configured properly for object '${assem.locationCode}'`);
    return;
  }

  try {
    const cutters = {cookie: [], joint: []};
    const modelCenter = new Vertex3D(env.getModel(id, 'model').center());
    for (let ji = 0; ji < joints.length; ji++) {
      try {
        const cutObj = applyMaleJointApplicator(joints[ji], frontBackSet, assem, env, modelCenter);
        if (cutObj) {
          cutters.cookie.concatInPlace(cutObj.cookie);
          cutters.joint.concatInPlace(cutObj.joint);
        }
      } catch (e) {
        console.error(e);
      }
    }
    env.modelInfo.extended[id] = new BiPolygon(frontBackSet[0], frontBackSet[1]).model();
    env.modelInfo.extended[id] = applyCutters(assem, cutters.cookie, env, 'Cookie');
    return cutters.joint;
  } catch (e) {
    console.warn(e);
    if (goDownTheRabbitHole) buildExtendedModel(assem, joints, env);
  }
}

function runMfcFunc(stage, assem, env) {
  const mfc = MFC(assem);
  if (mfc[stage])
    env.modelInfo[stage][assem.id] = mfc[stage](assem, env);
}

function applyCuts(assem, env) {
  const femaleJoints = env.jointMap.female[assem.id];
  if (!femaleJoints) return;
  const cutIds = femaleJoints.filter(id => id.match(/^Cut_/));
  let cutModel = env.getModel(assem, 'joined');
  const cuts = cutIds.map(id => env.byId[id]);
  for (let index = 0; cutModel && index < cuts.length; index++) {
    const cut = cuts[index];
    const mids = env.jointMap[cut.id].male;
    mids.forEach(mid => {
      const mm = env.getModel(mid, 'joined');
      if (mm) {
        const intersection = cutModel.intersect(mm);
        if (intersection.polygons.length) {
          env.modelInfo.intersection[assem.id] ||= {};
          env.modelInfo.intersection[assem.id][mid] = intersection;
          cutModel = cutModel.subtract(intersection);
        }
      }
    });
  }
  env.modelInfo.cut[assem.id] = cutModel;
}

const notExtendedJointReg = /^(Dependency|Cut)_/;
function applyMaleJointExtensions(payload, environment) {
  const jointCutters = {};
    const assemblyIds = payload.assemblies.concat(environment.generated);
    let env = environment;
    let proccessedIndex = 0;
    for (let index = 0; index < assemblyIds.length; index++) {
      const id = assemblyIds[index];
      const assem = environment.byId[id];
      if (env.modelInfo.model[id] === undefined || !assem.jointSettings.extend) continue;
      const joints = (env.jointMap.male[id] || [])
      .filter(jid => !jid.match(notExtendedJointReg))
      .map(jid => env.byId[jid]);
      if(joints.length > 0 && assem.included) {
        try {
          jointCutters[id] ||= {assem, cutters: []};
          const cutter = buildExtendedModel(assem, joints, environment);
          jointCutters[id].cutters.concatInPlace(cutter);
        } catch (e) {
          console.warn(e);
        }
      }
      runMfcFunc('extended', assem, env);
    }
    //TODO: I need to clean and organize a step by step process
    Object.values(jointCutters).forEach(obj => {
      if (obj.assem.jointSettings.male) {
        applyCuts(obj.assem, env);
        sliceAtOpening(assemblyIds, env, 'extended');
        runMfcFunc('cut', obj.assem, env);
      }
    });
    Object.values(jointCutters).forEach(obj => {
      if (obj.assem.jointSettings.male) {
        env.modelInfo.cut[obj.assem.id] = applyCutters(obj.assem, obj.cutters, env, 'Joint');
      }
    });
}

function exploadedTranslation(assemblyIds, env) {
  const explosionFactor = env.explosionFactor;
  if (!explosionFactor) return;
  for (let index = 0; index < assemblyIds.length; index++) {
    const id = assemblyIds[index];
    const assem = env.byId[id];
    const cabUtil = CabinetUtil.instance(assem, env);
    const buildCenter = cabUtil.partCenter();
    const joined = env.getModel(assem, 'joined');
    if (joined) {
      const joinedCenter = new Vertex3D(joined.center());
      const centerLine = new Line3D(buildCenter, joinedCenter);
      centerLine.length(centerLine.length() * explosionFactor, true);
      joined.center(centerLine[1]);
    }
  }
}

function sliceAtOpening (ids, env, modelType) {
  const aoc = Object.values(env.byId).find(j => j.partCode === 'aoc');
  for (let index = 0; index < ids.length; index++) {
    const assem = env.byId[ids[index]];
    if (aoc && assem.jointSettings.sliceAtOpening) {
      const model = env.getModel(assem.id, modelType);
      if (model && model.polygons.length)
        try {
            env.modelInfo[modelType][assem.id] = model.subtract(env.modelInfo.model[aoc.id]);
        } catch (e) {
          console.log(e);
        }
    }
  }
}

function Apply(payload, environment, taskId, intersections) {
  let env = environment;
  let start = new Date().getTime();
  const assemblyIds = payload.assemblies.concat(environment.generated);
  sliceAtOpening(assemblyIds, env, 'model');
  applyMaleJointExtensions(payload, environment);
  let map = {intersection: env.modelInfo.intersection, joined: env.modelInfo.joined};
  let proccessedIndex = 0;
  for (let index = 0; index < assemblyIds.length; index++) {
    const id = assemblyIds[index];
    const assem = environment.byId[id];
    if (assem.included && assem.jointSettings.female) {
      let model = env.getModel(id, 'joined');
      if (model) {
        model = CSG.fromPolygons(model.polygons, true);
        removeJointMaterial(map, assem, env, model, intersections);
      }
    }
  }
  for (let index = 0; index < assemblyIds.length; index++) {
    const assem = env.byId[assemblyIds[index]];
    runMfcFunc('joined', assem, env);
  }
  exploadedTranslation(assemblyIds, env);
}

module.exports = Apply;
