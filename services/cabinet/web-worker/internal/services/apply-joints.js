
const DTO = require('../../shared/data-transfer-object')();
const Polygon3D = require('../../../app-src/three-d/objects/polygon.js');
const Vertex3D = require('../../../app-src/three-d/objects/vertex.js');
const Line3D = require('../../../app-src/three-d/objects/line.js');
const Vector3D = require('../../../app-src/three-d/objects/vector.js');
const BiPolygon = require('../../../app-src/three-d/objects/bi-polygon.js');
const Utils = require('./modeling/utils/utils');
const MaleJointApplicators = require('./modeling/male-joint-applicators');
const CabinetUtil = require('./modeling/utils/cabinet');
const MFC = require('./modeling/modeling-function-configuration.js');

const ensureCsg = (obj) => !(obj instanceof Object) || obj instanceof CSG ? obj : CSG.fromPolygons(obj.polygons, true);
function determineMales(assem, env) {
  const joints = env.jointMap.female[assem.id] || [];
  const males = [];
  joints.forEach(jId => {
    if (jId.startsWith('Auto')) return;
    const joint = env.byId[jId];
    males.concatInPlace(env.jointMap[jId].male);
  });
  return males;
}

function removeJointMaterial(map, assem, env, model, intersections) {
  const males = determineMales(assem, env);
  const id = assem.id;
  let malesModel = new CSG();
  if (intersections) map.intersection[id] ||= {};
  males.forEach(mid => {
    let mm = map.joined[mid];
    if (mm) {
      if (!(mm instanceof CSG)) mm = map.joined[mid] = CSG.fromPolygons(mm.polygons, true);
      if (intersections) {
        const intersection = model.intersect(mm);
        if (intersection.polygons.length) map.intersection[id][mid] = intersection;
      }
      malesModel = malesModel.union(mm);
    }
    // else console.warn(`I dont think you should see this id: '${mid}' does not have a joinedModel`);
  });
  try {
    if (map.joined[id] === undefined)
      map.joined[id] = model.subtract(malesModel);
  } catch (e) {
    console.warn(e);
  }
}

const femalePolyInformation = (femaleId, fbCenter, env) => () => {
  if (env.modelInfo.extended[femaleId] === undefined)
    return null;
  let femaleModel  = CSG.fromPolygons(env.modelInfo.extended[femaleId].polygons, true);
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
  let model = env.modelInfo.extended[id];
  for (let index = 0; index < cutters.length; index++) {
    const cutter = cutters[index] instanceof Function ? cutters[index]() : cutters[index];
    if (cutter) {
      const jointId = `AutoJoint_${String.random()}`;
      const cutterId = `${group}_${jointId}`;
      const jointObj = {
        descriptor: cutterId, id: jointId
      }
      env.byId[jointId] = jointObj;
      env.modelInfo.joined[cutterId] = cutter;
      env.jointMap[jointId] = {male: [cutterId], female: [assem.id]};
      env.jointMap.female[assem.id] ||= [];
      env.jointMap.female[assem.id].push(jointId);
      env.modelInfo.intersection[id] ||= {};
      try {
        env.modelInfo.intersection[id][cutterId] = model.intersect(cutter);
        model = model.subtract(cutter);
      } catch (e) {
        console.error('Need to find the root cause of this issue');
        console.error(e);
      }
    }
  }
  env.modelInfo.extended[id] = model;
}

// TODO: model extension is messing up for base corner diagonal
function buildExtendedModel(assem, joints, env) {
  const id = assem.id;
  let model = env.modelInfo.extended[id];
  if (model === undefined) return;
  const polys = Polygon3D.fromCSG(model.polygons);
  const normals = Utils.normals(assem, env);
  const frontBackSet = Polygon3D.parrelleSets(polys).filter(s => s[0].normal().parrelle(normals.z))[0];
  const front = frontBackSet[0];
  const back = frontBackSet[1];
  if (back === undefined) {
    console.warn(`z normal is not configured properly for object '${assem.locationCode}'`);
    return;
  }

  const big = Number.MAX_SAFE_INTEGER/10000000;
  try {
    const cropPoly = new BiPolygon(front.resize(big, big, true), back.resize(big, big, true));
    const cutters = {cookie: [], joint: []};
    const modelCenter = new Vertex3D(env.modelInfo.model[assem.id].center());
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
    applyCutters(assem, cutters.cookie, env, 'Cookie');
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


function applyMaleJointExtensions(payload, environment) {
  const jointCutters = {};
    const assemblyIds = payload.assemblies;
    let env = environment;
    let proccessedIndex = 0;
    for (let index = 0; index < assemblyIds.length; index++) {
      const id = assemblyIds[index];
      const assem = environment.byId[id];
      if (env.modelInfo.model[id] === undefined) continue;
      const joints = (env.jointMap.male[id] || [])
      .filter(jid => !jid.startsWith('Dependency_'))
      .map(jid => env.byId[jid]);
      if(joints.length > 0 && assem.part && assem.included) {
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
    Object.values(jointCutters).forEach(obj => applyCutters(obj.assem, obj.cutters, env, 'Joint'));
}

function exploadedTranslation(assemblyIds, env) {
  const explosionFactor = env.explosionFactor;
  if (!explosionFactor) return;
  for (let index = 0; index < assemblyIds.length; index++) {
    const id = assemblyIds[index];
    const assem = env.byId[id];
    const cabUtil = CabinetUtil.instance(assem, env);
    const buildCenter = cabUtil.partCenter();
    const joined = env.modelInfo.joined[assem.id];
    if (joined) {
      const joinedCenter = new Vertex3D(joined.center());
      const centerLine = new Line3D(buildCenter, joinedCenter);
      centerLine.length(centerLine.length() * explosionFactor, true);
      joined.center(centerLine[1]);
    }
  }
}

function Apply(payload, environment, taskId, intersections) {
  let env = environment;
  // TODO: hacky fix - an extended model should only be crated if model is extended.
  Object.keys(env.modelInfo.model)
    .forEach(id => env.modelInfo.model[id] && (env.modelInfo.extended[id] = env.modelInfo.model[id].clone()));
  applyMaleJointExtensions(payload, environment);
  const assemblyIds = payload.assemblies;
  let map = {intersection: env.modelInfo.intersection, joined: env.modelInfo.joined};
  let proccessedIndex = 0;
  for (let index = 0; index < assemblyIds.length; index++) {
    const id = assemblyIds[index];
    const assem = environment.byId[id];
    let model = env.modelInfo.extended[id];
    if (model && assem.part && assem.included) {
      model = CSG.fromPolygons(model.polygons, true);
      removeJointMaterial(map, assem, env, model, intersections);
    } else if (map.joined[id] === undefined) {
      map.joined[id] = model;
    }
    runMfcFunc('joined', assem, env);
  }
  exploadedTranslation(assemblyIds, env);
}

module.exports = Apply;
