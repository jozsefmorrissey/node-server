
const PartInfo = require('./documents/part');
const dataTransferConfig = require('../math-data-transfer-config.json');
const Layer = require('../../../app-src/three-d/objects/layer.js');
const Polygon3D = require('../../../app-src/three-d/objects/polygon.js');
const Vertex3D = require('../../../app-src/three-d/objects/vertex.js');
const DTO = require('../../shared/data-transfer-object')(dataTransferConfig);
const SectionPropertiesUtil = require('./modeling/utils/section-properties.js');

const finishCoverReg = /^(Door|DuelDoor)/;
const needsFinished = n => {
  const cover = n.payload().sectionProps().cover;
  return !cover || cover().id.match(finishCoverReg);
}

function buildPartInfo(payload, env, taskId) {
  const map = {};
  const sectUtil = SectionPropertiesUtil.instance(env.byId[payload.parts[0]], env);
  const spatialMap = sectUtil && sectUtil.leafSpatialMap();
  for (let index = 0; index < payload.parts.length; index++) {
    const part = env.byId[payload.parts[index]];
    if (part.digital) continue;
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
      normals = partInfo.normals();
      demensions = partInfo.demensions();
      fenceEdges = {};
      if (!part.outsourced) {
        model = partInfo.model(true);
        model.z = partInfo.layers(true);
        model['-z'] = partInfo.layers(false);
        cuts = partInfo.cuts.map(c=>c.toJson());
        fenceEdges['-z'] = partInfo.edges2D(false);
        fenceEdges.z = partInfo.edges2D(true);
        if (spatialMap && part.id.match(/^Panel/)) {
          const center = env.getModel(part, 'joined').center();
          const poly = Polygon3D.fromVectorObject(demensions.x, demensions.y, center, normals);
          const neighbors = spatialMap.neighbors(poly, normals.z, normals.z.inverse());
          model.finishedInterior = {};
          model.finishedInterior.z = !!neighbors[0].find(needsFinished);
          model.finishedInterior['-z'] = !!neighbors[1].find(needsFinished);
        }
      }
      // toolingInfo = partInfo.toolingInformation();
    } catch (e) {
      console.error(e);
      // partInfo.model(false)
    }
    const result = DTO({partId: part.id, partIds, demensions, model, fenceEdges,
      toolingInfo, category, cuts, normals});
    postMessage({id: taskId, result});
  }
}

module.exports = buildPartInfo;

// c_S1_S1_dv_dv:full
