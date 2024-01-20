
const MFC = require('./modeling/modeling-function-configuration.js');
const MTDO = require('./modeling/modeling-data-transfer-object');
const JU = require('./modeling/utils/joint');

class Modeler {
  constructor(modelItterator) {
    function buildModel(job) {
      let env = job.environment;
      let assembly = MTDO.reconnect(job.assembly, env.byId);
      let model, biPolygon, biPolygonArray;
      try {
        console.log(`Building Model: '${assembly.locationCode}'`)
        if (assembly.locationCode.match(/^c_S1_S1_S2_dv_dv:f$/)) {
          console.log('target');
        }
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
        case 'apply-joints': JU.Apply(job, modelItterator); break;
        default: throw new Error(`Unkown job: '${job.name}'`);
      }
    }
  }
}

module.exports = Modeler;
