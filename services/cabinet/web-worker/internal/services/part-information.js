
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
    const partInfo = new PartInfo(part, env);
    info.demensions = partInfo.demensions();
    info.fenceEdges = {};
    info.model = partInfo.model(true);
    info.primarySide = partInfo.primarySide(true);
    info.model.z = partInfo.layers(true);
    info.model['-z'] = partInfo.layers(false);
    info.cuts = partInfo.cuts.map(c=>c.toJson());
    info.fenceEdges['-z'] = partInfo.edges2D(false);
    info.fenceEdges.z = partInfo.edges2D(true);
    if (spatialMap && part.id.match(/^Panel/)) {
      if (part.locationCode.match(/:(f|b|tkb)$/)) {
        info.subCategory = [];
      } else {
        const center = env.getModel(part, 'joined').center();
        const dems = info.demensions;
        const norms = info.normals;
        const poly = Polygon3D.fromVectorObject(dems.x, dems.y, center, norms);
        const nebrs = spatialMap.neighbors(poly, norms.z, norms.z.inverse());
        info.model.finishedInterior = {};
        const finished = [!!nebrs[0].find(needsFinished), !!nebrs[1].find(needsFinished)];
        // if (!partInfo.primarySide(true)) finished.reverse();
        const finishedSides = finished.count(b => b === true);
        info.model.finishedInterior.z = finished[0];
        info.model.finishedInterior['-z'] = finished[1];
        if (finishedSides > 0) info.subCategory = ['Pre Finished', finishedSides === 1 ? '1 side' : '2 side'];
        else info.subCategory = []
      }
    }
  }
}

function addCabinetInfo(payload, env, taskId) {
  const root = env.byId[payload.parts[0]].find.root();
  const result = basicPartInfo(root, env);
  const rotation = root.position.current.rotation;
  result.normals.x = result.normals.x.rotate(rotation);
  result.normals.y = result.normals.y.rotate(rotation);
  result.normals.z = result.normals.z.rotate(rotation);
  result.layers = Layer.fromCSG(result.model).map(l => l.combined());
  result.boxOnly = new CSG();
  const boxParts = env.find(a => a.part && !a.digital &&
                                !a.locationCode.match(/c_(S|void-[0-9]*)($|_|:)/));
  boxParts.forEach(p=>result.boxOnly = result.boxOnly.union(env.getModel(p, 'cut')));
  postMessage({id: taskId, result: DTO(result)});
}

function addNoModelInfo(part, env, taskId) {
  if (env.modelInfo.model[part.id] === undefined) {
    const result = DTO({demensions: {x:0,y:0,z:0}, partId: part.id, partIds: [part.id], category: 'ignore'});
    postMessage({id: taskId, result});
  }
}

function addGeneratedInfo(part, info) {
  if (part.generated) {
    info.generated = true;
    info.locationCode = part.locationCode;
    info.partCode = part.partCode;
    info.parentId = part.parentAssembly().id;
  }
}

const generatedPartReg = /^(PanelSectionPanel)/;
function buildPartInfo(payload, env, taskId) {
  addCabinetInfo(payload, env, taskId);
  const sectUtil = SectionPropertiesUtil.instance(env.byId[payload.parts[0]], env);
  const spatialMap = sectUtil && sectUtil.leafSpatialMap();
  const parts = payload.parts;
  if (payload.includeGenerated) {
    const generatedParts = Object.values(env.byId).filter(i => i.id.match(generatedPartReg));
    parts.concatInPlace(generatedParts.map(p => [p.id]));
  }
  for (let index = 0; index < parts.length; index++) {
    const part = env.byId[parts[index]];
    if (part.digital || addNoModelInfo(part, env, taskId)) continue;
    let info;
    try {
      info = basicPartInfo(part, env);
      addGeneratedInfo(part, info);
      detailedPartInfo(part, info, env, spatialMap);
    } catch (e) {
      console.error(e);
    }
    const result = DTO(info);
    postMessage({id: taskId, result});
  }
}

module.exports = buildPartInfo;
