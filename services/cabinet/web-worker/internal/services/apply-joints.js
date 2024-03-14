
const DTO = require('../../shared/data-transfer-object')();

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

function Apply(payload, environment, taskId, intersections) {
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
      const males = [];
      removeJonintMaterial(map, assem, env, model, intersections);
    } else if (map.joined[id] === undefined) {
      map.joined[id] = model;
    }
  }
}

module.exports = Apply;
