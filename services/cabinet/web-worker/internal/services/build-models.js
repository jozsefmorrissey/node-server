
const MFC = require('./modeling/modeling-function-configuration.js');
const DTO = require('../../shared/data-transfer-object')();


const PART_CODES_THAT_CANNOT_BE_BUILT = ["AUTOTK", "OpenTK", "COC"]
const reportMod = 20;
function BuildModels(payload, environment, taskId) {
  const assemblies = payload.assemblies;
  let byId = environment ? environment.byId : {};
  for (let index = 0; index < assemblies.length; index++) {
    let assembly = byId[assemblies[index]];
    if (PART_CODES_THAT_CANNOT_BE_BUILT.indexOf(assembly.partCode) !== -1) {
      environment.modelInfo.model[assembly.id] = null;
      continue;
    }
    let model, biPolygon, biPolygonArray, modelFuncs;
    try {
      // console.log(`Building Model: '${assembly.locationCode}'`)
      // if (assembly.partCode.match(/R|L/)) {
        //   console.log('target');
        // }
        modelFuncs = MFC(assembly);
        if (!modelFuncs.biPolygon) {
          biPolygonArray = null;
          model = modelFuncs.model(assembly, environment);
        } else {
          biPolygon = modelFuncs.biPolygon(assembly, environment);
          if (biPolygon !== null) {
            biPolygonArray = biPolygon.toArray();
            model = biPolygon.model();
          }
        }
        environment.modelInfo.model[assembly.id] = model;
        environment.modelInfo.biPolygonArray[assembly.id] = biPolygonArray
      } catch (e) {
        modelFuncs.biPolygon(assembly, environment);
        return new Error(`Failed to Create Model For:\n\t${assembly.locationCode}`)
      }
  }
}


module.exports = BuildModels;
