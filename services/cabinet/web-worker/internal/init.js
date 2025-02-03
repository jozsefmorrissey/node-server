require('../../../../public/js/utils/std-lib/init.js');
require('./services/documents/init.js')

const {BiPolygon} = require('../../../../public/js/utils/canvas/three-d/lib.js');
      require('../../../../public/js/utils/canvas/three-d/lib');
const ApplyJoints = require("./services/apply-joints");
const BuildModels = require("./services/build-models");
const BuildSimpleModels = require("./services/build-simple-models");
const ThreeView = require("./services/three-view");
const UnionModels = require("./services/union");
const To2D = require("./services/to-2d");
const PartInfo = require("./services/part-information");
const dataTransferConfig = require('./math-data-transfer-config.json');
const DTO = require('../shared/data-transfer-object')(dataTransferConfig);
const RDTO = require('../shared/reconnect-transfer-object');
const LayoutParts = require('./services/layout-parts');
goDownTheRabbitHole = false;


ProgressMessenger = function (taskId, ...args) {
  const progress = new Progress(...args);
  progress.msg = () => postMessage({id: taskId, progress: progress()});
  return progress;
};

const order = ['model', 'extended', 'cut', 'joined']
const getModel = (env) => (assemOid, type) => {
  const id = (typeof assemOid) === 'string' ? assemOid : assemOid.id;
  let index = order.indexOf(type);
  while (index > -1)  {
    const model = env.modelInfo[order[index]] && env.modelInfo[order[index]][id];
    if (model) return model;
    index--;
  }
  console.warn('No model found');
}
const getRoot = (env) => {
  const root = Object.values(env.byId).filter(o => o.locationCode)[0].find.root();
  return () => root;
}

const PATH = (path, key) => `proccessData.${path}.${key}`;
const data = (env) => (path) => ({
  get: (key) => env.pathValue(PATH(path,key)),
  set: (key, value) => env.pathValue(PATH(path,key), value),
  inc: (key, value) => env.pathValue(PATH(path,key), env.pathValue(PATH(path,key)) + (value || 1)),
  dec: (key, value) => env.pathValue(PATH(path,key), env.pathValue(PATH(path,key)) - (value || 1)),
  initialize: (key, value) => env.pathValue(PATH(path,key)) === undefined &&
                env.pathValue(PATH(path,key), value)
})

function handleTask(task, env) {
  if (env) {
    env.getModel = getModel(env);
    env.data = data(env);
    env.root = getRoot(env);
  }
  const process = task.process;
  const payload = task.payload;
  const taskId = task.id;
  switch (process) {
    case 'placeholder':
      return {finished: false};
    case 'simple':
      return  BuildSimpleModels(payload, taskId);
    case 'threeview':
      return  ThreeView(payload, taskId);
    case 'simpleto2d':
      return To2D.simple(payload);
    case 'model':
      return BuildModels(payload, env, taskId);
    case 'union':
      return UnionModels(payload, env, taskId, true);
    case 'join':
      return ApplyJoints(payload, env, taskId);
    case 'intersection':
      return ApplyJoints(payload, env, taskId, true);
    case 'assembliesto2d':
      return To2D.assemblies(payload, env, taskId);
    case 'partsinformation':
      return PartInfo(payload, env, taskId);
    case 'layoutParts':
      return LayoutParts(payload, taskId);
    default: return new Error('UnkownTask');
  }
}

function runTask(task, env) {
  try {
    const result = handleTask(task, env);
    postMessage({id: task.id, result: DTO(result), finished: true});
    return result;
  } catch (e) {
    postMessage({id: task.id, result: e});
  }
}

const findFunc = (idMap) => (selector, attribute) => {
    if (selector instanceof Function) return Object.values(idMap).filter(selector);
    attribute ||= 'id';
    if ((typeof selector) === 'string') return Object.values(idMap).filter(o => o[attribute] === selector);
    if (selector instanceof RegExp) return Object.values(idMap).filter(o => (o[attribute] + '').match(selector));
    throw new Error('Not sure what your trying to do here');
}

function runTasks(task, env) {
  let payload = task.payload;
  if (payload && payload.environment) {
    payload.environment.byId = RDTO(payload.environment.byId);
    env = payload.environment;
    if (env.proccessData === undefined) env.proccessData = {};
  }
  if (env && env.byId) env.find = findFunc(env.byId);
  if (!Array.isArray(payload.tasks)) return runTask(task, env);

  for (let index = 0; index < payload.tasks.length; index++) {
      const task = payload.tasks[index];
      runTasks(task, env);
  }
}

runCount = 1;
onmessage = (messageFromMain) => {
    const data = messageFromMain.data;
    runTasks(data);
};
