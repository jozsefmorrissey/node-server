
const MFC = require('./modeling/modeling-function-configuration.js');
const MTDO = require('./modeling/modeling-data-transfer-object');
class Modeler {
  constructor(modelItterator) {
    function buildMaleModel(joinedModeMap, assem, env) {
      const joints = env.jointMap.female[assem.id] || [];
      const males = [];
      joints.forEach(jId => males.concatInPlace(env.jointMap.male[jId]));
      let csg = new CSG();
      males.forEach(mid => joinedModeMap[mid] && (csg = csg.union(joinedModeMap[mid])));
      return csg.polygons.length === 0 ? null : csg;
    }

    function applyJoints(job) {
      const joinedModeMap = {};
      let env = job.environment;
      for (let index = 0; index < job.assemblies.length; index++) {
        const mtdo = job.assemblies[index];
        const assem = mtdo.assembly;
        const model = env.modelInfo[assem.id].model;
        if (model) {
          const joints = env.jointMap.female[assem.id] || [];
          const males = [];
          const maleModel = buildMaleModel(joinedModeMap, assem, env);
          if (maleModel)
            joinedModeMap[assem.id] = model.subtract(maleModel);
          else joinedModeMap[assem.id] = model;
          console.log(joinedModeMap[assem.id].toString());
        }
      }
      modelItterator.joinedModels(joinedModeMap);
    }

    function buildModel(job) {
      let env = job.environment;
      let assembly = MTDO.reconnect(job.assembly, env.byId);
      console.log('Modeling: ', assembly.locationCode);
      let model, biPolygon, biPolygonArray;
      try {
        const modelFuncs = MFC(assembly);
        if (assembly.locationCode === 'c_BACK') {
          console.log('target');
        }
        if (!modelFuncs.biPolygon) model = modelFuncs.model(assembly, env);
        else {
          biPolygon = modelFuncs.biPolygon(assembly, env);
          biPolygonArray = biPolygon.toArray();
          model = biPolygon.model();
        }
      } catch (e) {
        console.warn(e);
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
