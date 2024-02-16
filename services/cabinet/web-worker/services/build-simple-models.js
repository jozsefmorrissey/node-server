
const MFC = require('./modeling/modeling-function-configuration.js');
const RDTO = require('./modeling/reconnect-transfer-object');
const DTO = require('../shared/data-transfer-object')();

function BuildModels(payload, taskId) {
  const simpleObjs = payload.objects;
  let built = [];
  for (let index = 0; index < simpleObjs.length; index++) {
    let simpleObj = RDTO(simpleObjs[index]);
    try {
      const modelFuncs = MFC(simpleObj);
      model = modelFuncs.model(simpleObj);
      built.push(model);
    } catch (e) {
      return new Error(`Failed to Create Model For:\n\t${simpleObj.id}`)
    }
  }
  return built;
}


module.exports = BuildModels;
