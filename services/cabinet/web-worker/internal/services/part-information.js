
const PartInfo = require('./documents/part');
const dataTransferConfig = require('../math-data-transfer-config.json');
const DTO = require('../../shared/data-transfer-object')(dataTransferConfig);


module.exports = function (payload, env, taskId) {
  const map = {};
  for (let index = 0; index < payload.parts.length; index++) {
    const part = env.byId[payload.parts[index]];
    let partInfo, toolingInfo, demensions, partIds, model, faceEdges;
    try {
      partInfo = new PartInfo(part, env);
      partIds = partInfo.parts().map(p => p.id);
      model = {};
      model.right = partInfo.model(true);
      model.left = partInfo.model(false);
      fenceEdges = {};
      fenceEdges.right = partInfo.fenceEdges(true);
      fenceEdges.left = partInfo.fenceEdges(false);
      demensions = partInfo.demensions();
      toolingInfo = partInfo.toolingInformation();
    } catch (e) {
      console.error(e);
      partInfo.model(false)
    }
    map[part.id] = {partId: part.id, partIds, demensions, model, fenceEdges, toolingInfo};
    postMessage({id: taskId, result: DTO(map[part.id])});
  }
}

// c_S1_S1_dv_dv:full
