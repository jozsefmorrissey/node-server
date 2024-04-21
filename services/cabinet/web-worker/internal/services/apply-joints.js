
const DTO = require('../../shared/data-transfer-object')();
const Polygon3D = require('../../../app-src/three-d/objects/polygon.js');
const Vertex3D = require('../../../app-src/three-d/objects/vertex.js');
const Line3D = require('../../../app-src/three-d/objects/line.js');
const Vector3D = require('../../../app-src/three-d/objects/vector.js');
const BiPolygon = require('../../../app-src/three-d/objects/bi-polygon.js');
const Utils = require('./modeling/utils/utils');
const MaleJointApplicators = require('./modeling/male-joint-applicators');

const ensureCsg = (obj) => !(obj instanceof Object) || obj instanceof CSG ? obj : CSG.fromPolygons(obj.polygons, true);
function determineMales(assem, env) {
  const joints = env.jointMap.female[assem.id] || [];
  const males = [];
  joints.forEach(jId => {
    const joint = env.byId[jId];
    males.concatInPlace(env.jointMap[jId].male);
  });
  return males;
}

function removeJonintMaterial(map, assem, env, model, intersections) {
  const males = determineMales(assem, env);
  const id = assem.id;
  let malesModel = new CSG();
  if (intersections) map.intersection[id] = {};
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
    // else console.warn(`I dont thin you should see this id: '${mid}' does not have a joinedModel`);
  });
  if (map.joined[id] === undefined)
    map.joined[id] = model.subtract(malesModel);
}

const alreadyProcessed = (map, id, intersections) =>
  map.joined[id] !== undefined && (!intersections || map.intersection[id]);

const getFemalePolys = (joint, env, frontBackSet) => {
  const females = env.jointMap[joint.id].female;
  if (females.length > 1) {
    let one = 2;
  }
  console.log(females.map(id => env.byId[id].locationCode).join() + '\n\n');
  const femalePolys = [];
  const fbCenter = Vertex3D.center(frontBackSet.map(p => p.center()));
  for (let fi = 0; females && fi < females.length; fi++) {
    let femaleModel  = CSG.fromPolygons(env.modelInfo.model[females[fi]].polygons, true);
    const polys = Polygon3D.fromCSG(femaleModel);
    const assem = env.byId[females[fi]];
    const norms = Utils.normals(assem);
    const polyObj = polys.filterSplit(p => p.normal().acquiescent(norms.z).dot(norms.z) > .99 ? 'z' : 'sides');
    if (polyObj.z) {
      const frontClosest = polyObj.z[0].distance(fbCenter) < polyObj.z[1].distance(fbCenter);
      if (!frontClosest) polyObj.z.swap(0,1);
      femalePolys.push(polyObj);
    } else {
      console.warn(`Object normal is probably incorrect: '${assem.locationCode}'`);
    }
  }
  return femalePolys.length === 0 ? null : femalePolys;
}

function applyMaleJointApplicator(joint, frontBackSet, assem, env) {
  const maleJointApplicator = MaleJointApplicators(joint);
  if (maleJointApplicator === undefined) return;
  console.log(assem.locationCode + ' =>');
  const femalePolys = getFemalePolys(joint, env, frontBackSet);
  if (femalePolys === null) return;
  const cutters = {cookie: [], joint: []};
  for (let index = 0; index < femalePolys.length; index ++) {
    const cutObj = maleJointApplicator(assem, femalePolys[index], frontBackSet);
    if (cutObj) {
      cutters.cookie.concatInPlace(cutObj.cookie);
      cutters.joint.concatInPlace(cutObj.joint);
    }
  }
  return cutters;
}

function getExtendedModel(assem, joints, env) {
  let model = env.modelInfo.model[assem.id];
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
  const cropPoly = new BiPolygon(front.resize(big, big, true), back.resize(big, big, true));
  const cutters = {cookie: [], joint: []};
  for (let ji = 0; ji < joints.length; ji++) {
    const cutObj = applyMaleJointApplicator(joints[ji], frontBackSet, assem, env);
    if (cutObj) {
      cutters.cookie.concatInPlace(cutObj.cookie);
      cutters.joint.concatInPlace(cutObj.joint);
    }
  }
  model = new BiPolygon(frontBackSet[0], frontBackSet[1]).model();
  // cutters.cookie.forEach(cutter => model = model.subtract(cutter));
  // cutters.joint.forEach(cutter => model = model.subtract(cutter));
  console.log(model.toDrawString());
}


function applyMaleJointExtensions(payload, environment) {
  try {
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
      if(joints.length > 0) {
        if (assem.part && assem.included) {
          const model = getExtendedModel(assem, joints, environment);
          if (model) env.modelInfo.model[id] = model;
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
}

function Apply(payload, environment, taskId, intersections) {
  applyMaleJointExtensions(payload, environment);
  const assemblyIds = payload.assemblies;
  let env = environment;
  let map = {intersection: env.modelInfo.intersection, joined: env.modelInfo.joined};
  let proccessedIndex = 0;
  for (let index = 0; index < assemblyIds.length; index++) {
    const id = assemblyIds[index];
    const assem = environment.byId[id];
    if (env.modelInfo.model[id] === undefined ||
        alreadyProcessed(map, id, intersections)) {
      continue;
    }
    let model = env.modelInfo.model[id];
    if (model && assem.part && assem.included) {
      model = CSG.fromPolygons(model.polygons, true);
      const joints = env.jointMap.female[id] || [];
      removeJonintMaterial(map, assem, env, model, intersections);
    } else if (map.joined[id] === undefined) {
      map.joined[id] = model;
    }
  }
}

module.exports = Apply;
