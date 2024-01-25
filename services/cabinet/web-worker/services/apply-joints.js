
function determineMales(joinedModelMap, assem, env) {
  const joints = env.jointMap.female[assem.id] || [];
  const males = [];
  joints.forEach(jId =>
    males.concatInPlace(env.jointMap.male[jId]));
  return males;
}

function removeJonintMaterial(joinedModelMap, assem, env, model, snapShot) {
  const males = determineMales(joinedModelMap, assem, env);
  const joinedModels = {final: new CSG()};
  let malesModel = new CSG();
  males.forEach(mid => {
    const mm = joinedModelMap[mid];
    if (mm && mm.final) {
      if (!(mm.final instanceof CSG)) mm.final = CSG.fromPolygons(mm.final.polygons, true);
      if (snapShot) joinedModels[mid] = model.subtract(malesModel);
      malesModel = malesModel.union(mm.final);
    }
    // else console.warn(`I dont thin you should see this id: '${mid}' does not have a joinedModel`);
  });
  try {
    joinedModels.final = model.subtract(malesModel);
  } catch (e) {
    console.log(e);
    joinedModels.final = model;
  }
  joinedModelMap[assem.id] = joinedModels;
}

function Apply(assemblies, environment, snapShot) {
  let env = environment;
  const joinedModelMap = {};
  Object.keys(env.modelInfo).forEach(k => joinedModelMap[k] = env.modelInfo[k].joinedModel);
  for (let index = 0; index < assemblies.length; index++) {
    const mtdo = assemblies[index];
    const assem = mtdo.assembly || mtdo;
    if (env.modelInfo[assem.id] === undefined) {
      continue;
    }
    let model = env.modelInfo[assem.id].model;
    if (model && assem.part && assem.included) {
      model = CSG.fromPolygons(model.polygons, true);
      const joints = env.jointMap.female[assem.id] || [];
      const males = [];
      removeJonintMaterial(joinedModelMap, assem, env, model, snapShot);
    } else
      joinedModelMap[assem.id] = {final: model};
  }
  return joinedModelMap;
}

module.exports = Apply;
