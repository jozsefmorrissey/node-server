
const MFC = require('./modeling/modeling-function-configuration.js');
const MTDO = require('./modeling/modeling-data-transfer-object');


function BuildModels(assemblies, environment) {
  for (let index = 0; index < assemblies.length; index++) {
    let assembly = MTDO.reconnect(assemblies[index], environment.byId);
    let model, biPolygon, biPolygonArray;
    try {
      // console.log(`Building Model: '${assembly.locationCode}'`)
      // if (assembly.partCode.match(/^db$/)) {
      //     console.log('target');
      //   }
        const modelFuncs = MFC(assembly);
        if (!modelFuncs.biPolygon) model = modelFuncs.model(assembly, environment);
        else {
          biPolygon = modelFuncs.biPolygon(assembly, environment);
          biPolygonArray = biPolygon.toArray();
          model = biPolygon.model();
        }
        environment.modelInfo[assembly.id] = {model, biPolygonArray};
      } catch (e) {
        e.msg = 'There are failing models that i have not decided on a way to handle';
        environment.modelInfo[assembly.id] = {model: null, biPolygonArray: null, msg: e.msg};
      }
  }

  return environment.modelInfo;
}


module.exports = BuildModels;
