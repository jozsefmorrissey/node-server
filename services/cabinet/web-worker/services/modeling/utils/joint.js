
function buildMaleModel(joinedModeMap, assem, env) {
  const joints = env.jointMap.female[assem.id] || [];
  const males = [];
  joints.forEach(jId =>
    males.concatInPlace(env.jointMap.male[jId]));
  let csg = new CSG();
  males.forEach(mid =>
    joinedModeMap[mid] && (csg = csg.union(joinedModeMap[mid])));
  return csg.polygons.length === 0 ? null : csg;
}

function Apply(job, modelItterator) {
  const joinedModeMap = {};
  let env = job.environment;
  for (let index = 0; index < job.assemblies.length; index++) {
    const mtdo = job.assemblies[index];
    const assem = mtdo.assembly;
    const model = env.modelInfo[assem.id].model;
    if (model && assem.part && assem.included) {
      const joints = env.jointMap.female[assem.id] || [];
      const males = [];
      const maleModel = buildMaleModel(joinedModeMap, assem, env);
      if (assem.locationCode.match(/^c_void-3:p5$/)) {
        let a = 1 + 2;
      }
      if (maleModel)
        joinedModeMap[assem.id] = model.subtract(maleModel);
      else joinedModeMap[assem.id] = model;
    } else joinedModeMap[assem.id] = model;
  }
  modelItterator.joinedModels(joinedModeMap);
}

module.exports = {Apply};
