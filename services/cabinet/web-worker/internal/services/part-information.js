
const PartInfo = require('./documents/part');
const dataTransferConfig = require('../math-data-transfer-config.json');
const Layer = require('../../../app-src/three-d/objects/layer.js');
const Polygon3D = require('../../../app-src/three-d/objects/polygon.js');
const Vertex3D = require('../../../app-src/three-d/objects/vertex.js');
const DTO = require('../../shared/data-transfer-object')(dataTransferConfig);
const Utils = require('./modeling/utils/utils.js');
const SectionPropertiesUtil = require('./modeling/utils/section-properties.js');

const finishCoverReg = /^(Door|DuelDoor)/;
const needsFinished = n => {
  const cover = n.payload().sectionProps().cover;
  return !cover || cover().id.match(finishCoverReg);
}

function basicPartInfo(part, env) {
  const category = part.category;
  const partIds = [part.id];
  const model = env.getModel(part, 'joined');
  const normals = Utils.normals(part, env);
  const demensions = model.demensions();
  return {category, partIds, model, normals, demensions};
}

function detailedPartInfo(part, info, env, spatialMap) {
  if (!part.outsourced) {
    partInfo = new PartInfo(part, env);
    info.demensions = partInfo.demensions();
    info.fenceEdges = {};
    info.model = partInfo.model(true);
    info.model.z = partInfo.layers(true);
    info.model['-z'] = partInfo.layers(false);
    info.cuts = partInfo.cuts.map(c=>c.toJson());
    info.fenceEdges['-z'] = partInfo.edges2D(false);
    info.fenceEdges.z = partInfo.edges2D(true);
    if (spatialMap && part.id.match(/^Panel/)) {
      const center = env.getModel(part, 'joined').center();
      const dems = info.demensions;
      const norms = info.normals;
      const poly = Polygon3D.fromVectorObject(dems.x, dems.y, center, norms);
      const nebrs = spatialMap.neighbors(poly, norms.z, norms.z.inverse());
      info.model.finishedInterior = {};
      const finished = [!!nebrs[0].find(needsFinished), !!nebrs[1].find(needsFinished)];
      const finishedSides = finished.count(b => b === true);
      info.model.finishedInterior.z = finished[0];
      info.model.finishedInterior['-z'] = finished[1];
      if (finishedSides > 0) info.category = `PreFinished${finishedSides}Side`;
    }
  }
}

function addCabinetInfo(payload, env, taskId) {
  const root = env.byId[payload.parts[0]].find.root();
  const result = basicPartInfo(root, env);
  result.layers = Layer.fromCSG(result.model).map(l => l.combined());
  postMessage({id: taskId, result: DTO(result)});
}

function addNoModelInfo(part, env, taskId) {
  if (env.modelInfo.model[part.id] === undefined) {
    const result = DTO({demensions: {x:0,y:0,z:0}, partId: part.id, partIds: [part.id], category: 'ignore'});
    postMessage({id: taskId, result});
  }
}

function buildPartInfo(payload, env, taskId) {
  addCabinetInfo(payload, env, taskId);
  const sectUtil = SectionPropertiesUtil.instance(env.byId[payload.parts[0]], env);
  const spatialMap = sectUtil && sectUtil.leafSpatialMap();
  for (let index = 0; index < payload.parts.length; index++) {
    const part = env.byId[payload.parts[index]];
    if (part.digital || addNoModelInfo(part, env, taskId)) continue;
    let info;
    try {
      info = basicPartInfo(part, env);
      detailedPartInfo(part, info, env, spatialMap);
    } catch (e) {
      console.error(e);
    }
    const result = DTO(info);
    postMessage({id: taskId, result});
  }
}

module.exports = buildPartInfo;

// c_S1_S1_dv_dv:full
