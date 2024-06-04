
const BiPolygon = require('../../../../app-src/three-d/objects/bi-polygon.js');
const Polygon3D = require('../../../../app-src/three-d/objects/polygon.js');
const Vertex3D = require('../../../../app-src/three-d/objects/vertex.js');
const Utils = require('./utils/utils');


// TODO: model extension is messing up for base corner diagonal
function getExtendedModel(assem, joints, env) {
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
    model = new BiPolygon(frontBackSet[0], frontBackSet[1]).model();
    cutters.cookie.forEach(cutter => model = model.subtract(cutter()));
    env.modelInfo.extended[id] = model;
    return cutters.joint.map(cf => () =>
      env.modelInfo.extended[id] = env.modelInfo.extended[id].subtract(cf()));
  } catch (e) {
    console.warn(e);
    if (goDownTheRabbitHole) getExtendedModel(assem, joints, env);
  }
}


function applyMaleJointExtensions(payload, environment) {
  const jointCutters = [];
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
          jointCutters.concatInPlace(getExtendedModel(assem, joints, environment));
        } catch (e) {
          console.warn(e);
        }
      }
    }
    jointCutters.forEach(cutter => cutter());
}

module.exports = applyMaleJointExtensions;
