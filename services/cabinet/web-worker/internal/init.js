require('../../../../public/js/utils/utils.js');
require('./services/documents/init.js')

const BiPolygon = require("../../app-src/three-d/objects/bi-polygon");
const ApplyJoints = require("./services/apply-joints");
const BuildModels = require("./services/build-models");
const BuildSimpleModels = require("./services/build-simple-models");
const UnionModels = require("./services/union");
const To2D = require("./services/to-2d");
const PartInfo = require("./services/part-information");
const dataTransferConfig = require('./math-data-transfer-config.json');
const DTO = require('../shared/data-transfer-object')(dataTransferConfig);


function handleTask(task, env) {
  const process = task.process;
  const payload = task.payload;
  const taskId = task.id;
  switch (process) {
    case 'simple': return  BuildSimpleModels(payload, taskId);
    case 'simpleto2d': return To2D.simple(payload);
    case 'model': return BuildModels(payload, env, taskId);
    case 'union': return UnionModels(payload, env, taskId, true);
    case 'join': return ApplyJoints(payload, env, taskId);
    case 'intersection': return ApplyJoints(payload, env, taskId, true);
    case 'assembliesto2d': return To2D.assemblies(payload, env, taskId);
    case 'panelsinformation': return PartInfo(payload, env, taskId);
    default: return new Error('UnkownTask');
  }
}

function runTask(task, env) {
  try {
    const result = handleTask(task, env);
    if (result) postMessage({id: task.id, result: DTO(result)});
    postMessage({id: task.id, finished: true});
    return result;
  } catch (e) {
    postMessage({id: task.id, result: e});
  }
}

function runTasks(task, env) {
  const payload = task.payload;
  env ||= payload.environment;
  if (!Array.isArray(payload.tasks)) return runTask(task, env);

  for (let index = 0; index < payload.tasks.length; index++) {
      const task = payload.tasks[index];
      runTasks(task, env);
  }
}

onmessage = (messageFromMain) => {
    const data = messageFromMain.data;
    try {
      runTasks(data);
    } catch (e) {
      postMessage({id: data.id, result: e});
    }
};
