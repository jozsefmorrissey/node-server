
const PartInfo = require('./documents/part');
const dataTransferConfig = require('../math-data-transfer-config.json');
const Layer = require('../../../app-src/three-d/objects/layer.js');
const Vertex3D = require('../../../app-src/three-d/objects/vertex.js');
const DTO = require('../../shared/data-transfer-object')(dataTransferConfig);

function buildPartInfo(payload, env, taskId) {
  const map = {};
  for (let index = 0; index < payload.parts.length; index++) {
    const part = env.byId[payload.parts[index]];
    if (env.modelInfo.model[part.id] === undefined) {
      const result = DTO({demensions: {x:0,y:0,z:0}, partId: part.id, partIds: [part.id], category: 'ignore'});
      postMessage({id: taskId, result});
      continue;
    }
    const category = part.category;
    let partInfo, toolingInfo, demensions, partIds, model, faceEdges, cuts, normals;
    try {
      partInfo = new PartInfo(part, env);
      partIds = partInfo.parts().map(p => p.id);
      cuts = partInfo.cuts.map(c=>c.toJson());
      model = partInfo.model(true);
      model['-z'] = partInfo.layers(true);
      model.z = partInfo.layers(false);
      normals = partInfo.normals();
      fenceEdges = {};
      fenceEdges['-z'] = partInfo.edges2D(true);
      fenceEdges.z = partInfo.edges2D(false);
      demensions = partInfo.demensions();
      // toolingInfo = partInfo.toolingInformation();
    } catch (e) {
      console.error(e);
      partInfo.model(false)
    }
    const result = DTO({partId: part.id, partIds, demensions, model, fenceEdges,
      toolingInfo, category, cuts, normals});
    postMessage({id: taskId, result});
  }
}

module.exports = buildPartInfo;

// c_S1_S1_dv_dv:full
