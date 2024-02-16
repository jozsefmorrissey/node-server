
const DTO = require('../../shared/data-transfer-object')();

function determineMales(assem, env) {
  const joints = env.jointMap.female[assem.id] || [];
  const males = [];
  joints.forEach(jId =>
    males.concatInPlace(env.jointMap[jId].male));
  return males;
}

function removeJonintMaterial(map, newMap, assem, env, model, intersections) {
  const males = determineMales(assem, env);
  const id = assem.id;
  let malesModel = new CSG();
  if (intersections) map.intersection[id] = newMap.intersection[id] = {};
  males.forEach(mid => {
    let mm = map.joined[mid];
    if (mm) {
      if (!(mm instanceof CSG)) mm = map.joined[mid] = CSG.fromPolygons(mm.polygons, true);
      if (intersections) {
        const intersection = model.intersect(mm);
        if (intersection.polygons.length) map.intersection[id][mid] = newMap.intersection[id][mid] = intersection;
      }
      malesModel = malesModel.union(mm);
    }
    // else console.warn(`I dont thin you should see this id: '${mid}' does not have a joinedModel`);
  });
  try {
    if (map.joined[id] === undefined)
      map.joined[id] = newMap.joined[id] = model.subtract(malesModel);
  } catch (e) {
    console.log(e);
    map.joined[id] = newMap.joined[id] = model;
  }
}

function reportBack(newMap, taskId, intersections) {
  postMessage({id: taskId, result: {type: 'joined', map: DTO(newMap.joined)}});
  if (intersections)
    postMessage({id: taskId, result: {type: 'intersection', map: DTO(newMap.intersection)}});
}

const alreadyProcessed = (map, id, intersections) =>
  map.joined[id] !== undefined && (!intersections || map.intersection[id]);

const newMapObj = () => ({intersection: {}, joined: {}});
function Apply(payload, environment, taskId, intersections) {
  const assemblyIds = payload.assemblies;
  let env = environment;
  let newMap = newMapObj();
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
      removeJonintMaterial(map, newMap, assem, env, model, intersections);
    } else if (map.joined[id] === undefined) {
      map.joined[id] = newMap.joined[id] = model;
    }

    if (((++proccessedIndex + 1) % 10) === 0) {
      reportBack(newMap, taskId, intersections);
      newMap = newMapObj();
    }
  }
  reportBack(newMap, taskId, intersections);
}

module.exports = Apply;
