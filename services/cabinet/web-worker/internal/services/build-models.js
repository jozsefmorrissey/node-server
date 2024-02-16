
const MFC = require('./modeling/modeling-function-configuration.js');
const RDTO = require('./modeling/reconnect-transfer-object');
const DTO = require('../../shared/data-transfer-object')();


function reportBack(modelMap, polyMap, taskId) {
  postMessage({id: taskId, result: {type: 'biPolygon', map: DTO(polyMap)}});
  postMessage({id: taskId, result: {type: 'model', map: DTO(modelMap)}});
}

const PART_CODES_THAT_CANNOT_BE_BUILT = ["AUTOTK", "OpenTK", "COC"]
const reportMod = 20;
function BuildModels(payload, environment, taskId) {
  const assemblies = payload.assemblies;
  let newModels = {};
  let newPolys = {};
  let byId = environment ? environment.byId : {};
  for (let index = 0; index < assemblies.length; index++) {
    let assembly = RDTO(assemblies[index], byId);
    if (PART_CODES_THAT_CANNOT_BE_BUILT.indexOf(assembly.partCode) !== -1) {
      environment.modelInfo.model[assembly.id] = null;
      newModels[assembly.id] = null;
      continue;
    }
    let model, biPolygon, biPolygonArray;
    try {
      // console.log(`Building Model: '${assembly.locationCode}'`)
      // if (assembly.partCode.match(/^db$/)) {
      //   console.log('target');
      // }
      const modelFuncs = MFC(assembly);
      if (!modelFuncs.biPolygon) {
        biPolygonArray = null;
        model = modelFuncs.model(assembly, environment);
      } else {
        biPolygon = modelFuncs.biPolygon(assembly, environment);
        biPolygonArray = biPolygon.toArray();
        model = biPolygon.model();
      }
      environment.modelInfo.model[assembly.id] = model;
      environment.modelInfo.biPolygonArray[assembly.id] = biPolygonArray
      newModels[assembly.id] = model;
      newPolys[assembly.id] = biPolygonArray;
    } catch (e) {
      return new Error(`Failed to Create Model For:\n\t${assembly.locationCode}`)
    }
    if ((index + 1) % 20 === 0) {
      reportBack(newModels, newPolys, taskId);
      newModels = {}; newPolys = {};
    }
  }
  reportBack(newModels, newPolys, taskId);
}


module.exports = BuildModels;
