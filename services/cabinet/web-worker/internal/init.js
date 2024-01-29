require('../../../../public/js/utils/utils.js');

const BiPolygon = require("../../app-src/three-d/objects/bi-polygon");
const ApplyJoints = require("../services/apply-joints");
const BuildModels = require("../services/build-models");
const UnionModels = require("../services/union");
const DTO = require('../shared/data-transfer-object')();


function handleTask(type, payload, taskId) {
  const assem = payload.assemblies;
  const env = payload.environment;
  switch (type) {
    case 'CsgModelTask': return BuildModels(assem, env, taskId);
    case 'CsgUnionTask': return UnionModels(assem, env, taskId, true);
    case 'CsgJoinTask': return ApplyJoints(assem, env, taskId);
    case 'CsgIntersectionTask': return ApplyJoints(assem, env, taskId, true);
    default: return new Error('UnkownTask');
  }
}

onmessage = (messageFromMain) => {
    const data = messageFromMain.data;
    const taskId = data.id;
    const type = data.type;
    const payload = data.payload;
    const result = handleTask(type, payload, taskId);
    if (result) postMessage({id: taskId, result: DTO(result)});
};
