require('../../../../public/js/utils/utils.js');

const BiPolygon = require("../../app-src/three-d/objects/bi-polygon");
const ApplyJoints = require("../services/apply-joints");
const BuildModels = require("../services/build-models");
const BuildSimpleModels = require("../services/build-simple-models");
const UnionModels = require("../services/union");
const To2D = require("../services/to-2d");
const dataTransferConfig = require('./math-data-transfer-config.json');
const DTO = require('../shared/data-transfer-object')(dataTransferConfig);


function handleTask(process, payload, env, taskId) {
  switch (process) {
    case 'simple': return  BuildSimpleModels(payload, taskId);
    case 'simpleto2d': return To2D.simple(payload);
    case 'model': return BuildModels(payload, env, taskId);
    case 'union': return UnionModels(payload, env, taskId, true);
    case 'join': return ApplyJoints(payload, env, taskId);
    case 'intersection': return ApplyJoints(payload, env, taskId, true);
    case 'assembliesto2d': return To2D.assemblies(payload, env, taskId);
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
        try {
        const result = handleTask(task.process, task.payload, env, task.id);
        if (result) postMessage({id: task.id, result: DTO(result)});
        postMessage({id: task.id, finished: true});
      } catch (e) {
        postMessage({id: task.id, result: e});
      }
    }

};
