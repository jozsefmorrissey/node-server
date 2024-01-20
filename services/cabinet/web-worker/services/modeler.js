
const MFC = require('./modeling/modeling-function-configuration.js');
const MTDO = require('./modeling/modeling-data-transfer-object');
class Modeler {
  constructor(modelItterator) {
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

    function applyJoints(job) {
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
            buildMaleModel(joinedModeMap, assem, env)
          }
          if (maleModel)
            joinedModeMap[assem.id] = model.subtract(maleModel);
          else joinedModeMap[assem.id] = model;
        } else joinedModeMap[assem.id] = model;
      }
      modelItterator.joinedModels(joinedModeMap);
    }

    function buildModel(job) {
      let env = job.environment;
      let assembly = MTDO.reconnect(job.assembly, env.byId);
      let model, biPolygon, biPolygonArray;
      try {
        // console.log(`Building Model: '${assembly.locationCode}'`)
        // if (assembly.locationCode.match(/^c_S1_S1_S3_d_df$/)) {
        //   console.log('target');
        // }
        const modelFuncs = MFC(assembly);
        if (!modelFuncs.biPolygon) model = modelFuncs.model(assembly, env);
        else {
          biPolygon = modelFuncs.biPolygon(assembly, env);
          biPolygonArray = biPolygon.toArray();
          model = biPolygon.model();
        }
      } catch (e) {
        console.warn(`Error constructing model for '${assembly.locationCode}'`);
      }
      modelItterator.modelInfo(assembly.id, {model, biPolygonArray});
    }

    let job;
    while(job = modelItterator.nextJob()) {
      switch (job.name) {
        case 'build-model': buildModel(job); break;
        case 'apply-joints': applyJoints(job); break;
        default: throw new Error(`Unkown job: '${job.name}'`);
      }
    }
  }
}

module.exports = Modeler;
