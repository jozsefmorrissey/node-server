require('../../../../public/js/utils/utils.js');

const BiPolygon = require("../../app-src/three-d/objects/bi-polygon");
const ApplyJoints = require("../services/apply-joints");
const BuildModels = require("../services/build-models");
const MTDO = require('../services/modeling/modeling-data-transfer-object');


function handleTask(type, payload) {
  switch (type) {
    case 'CsgBuildTask': return BuildModels(payload.assemblies, payload.environment);
    case 'CsgJoinTask': return ApplyJoints(payload.assemblies, payload.environment);
    case 'CsgSnapShotTask': return ApplyJoints(payload.assemblies, payload.environment, true);
    default: return new Error('UnkownTask');
  }
}

onmessage = (messageFromMain) => {
    const data = messageFromMain.data;
    const taskId = data.id;
    const type = data.type;
    const payload = data.payload;
    const result = MTDO.to(handleTask(type, payload));
    postMessage({id: taskId, result});
};
