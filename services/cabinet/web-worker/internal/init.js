require('../../../../public/js/utils/utils.js');

const BiPolygon = require("../../app-src/three-d/objects/bi-polygon");
const ApplyJoints = require("../services/apply-joints");
const BuildModels = require("../services/build-models");
const UnionModels = require("../services/union");
const DTO = require('../shared/data-transfer-object')();


function handleTask(process, payload, env, taskId) {
  const assem = payload.assemblies;
  switch (process) {
    case 'model': return BuildModels(assem, env, taskId);
    case 'union': return UnionModels(assem, env, taskId, true);
    case 'join': return ApplyJoints(assem, env, taskId);
    case 'intersection': return ApplyJoints(assem, env, taskId, true);
    default: return new Error('UnkownTask');
  }
}

onmessage = (messageFromMain) => {
    const data = messageFromMain.data;
    const payload = data.payload;
    const tasks = payload.tasks ? payload.tasks : [data];
    const env = payload.environment;
    for (let index = 0; index < tasks.length; index++) {
      const task = tasks[index];
      const result = handleTask(task.process, task.payload, env, task.id);
      if (result) postMessage({id: task.id, result: DTO(result)});
    }
};
