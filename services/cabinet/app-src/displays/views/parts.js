const Canvas = require('../canvas');
const Jobs = require('../../../web-worker/external/jobs.js');
const Vertex3D = require('../../three-d/objects/vertex.js');
const Line3D = require('../../three-d/objects/line.js');

const set = {};
let locationPrefix, locationCode, _parts, ufidPrefix;
let openTabId;
const resetAll = () => locationCode = _parts = locationPrefix = ufidPrefix = undefined;
const lcPrefixFilter = p => p.locationCode().match(`^${locationPrefix}($|:)`);
const pcPrefixFilter = p => p.userFriendlyId().match(`^${ufidPrefix}`);
set.locationPrefix = (lp) =>
  resetAll() & (locationPrefix = lp);
set.ufidPrefix = (pc) =>
  resetAll() & (ufidPrefix = pc);
set.locationCode = (lc) =>
  resetAll() & (locationCode = lc);
set.parts = (parts) =>
  resetAll() & (_parts = parts);

function explode(model, center, color) {
  if (model) {
    model = model.clone();
    model.setColors(color || String.color.next());
    const explosionFactor = Canvas.explosionFactor();
    if (!explosionFactor) return;
    const modelCenter = new Vertex3D(model.center());
    const centerLine = new Line3D(center, modelCenter);
    centerLine.length(centerLine.length() * explosionFactor, true);
    model.center(centerLine[1]);
  }
  return model
}

function relatedModels(maleOfemale, id, jointMap, modelInfo) {
  const type = maleOfemale === false ? 'female' : 'male';
  const jointType = maleOfemale === true ? 'female' : 'male';
  return (jointMap[type][id] || [])
    .map(id => jointMap[id][jointType]).concatElements().unique()
    .map(id => modelInfo.joined(id));
}

function  render() {
  const cabinet = Global.cabinet() || Global.target();
  if (!cabinet) return;
  let parts;
  if (locationPrefix) parts = cabinet.getParts().filter(lcPrefixFilter);
  else if (ufidPrefix) parts = cabinet.getParts().filter(pcPrefixFilter);
  else if (locationCode) parts = [cabinet.getAssembly(locationCode)];
  else if (_parts) parts = _parts;
  if (!parts || parts.length === 0) {
    resetAll();
    parts = cabinet.modelingCollections();
  }
  parts = parts.filter(p => p.part() && p.included() && !p.composite() && !p.digital());
  new Jobs.CSG.Assembly.Construction(cabinet).then((modelInfo, job) => {
    Canvas.explosionFactor();
    const jointMap = modelInfo.modelingConfiguration().jointMap();
    const center = cabinet.buildCenter(true);
    const partModels = parts.map(p => explode(modelInfo.joined(p.id())));
    if (parts.length > 1) {
      Canvas.render3Dmodel(CSG.concat(partModels), parts);
    } else {
      const p = parts[0];
      const csg = explode(modelInfo.joined(p.id()), center, 'blue');
      const femaleModels = relatedModels(false, p.id(), jointMap, modelInfo);
      const maleModels = relatedModels(true, p.id(), jointMap, modelInfo);
      let femaleCsg = CSG.concat(femaleModels.map(m => explode(m, center, 'red')));
      let maleCsg = CSG.concat(maleModels.map(m => explode(m, center, 'green')));
      Canvas.render3Dmodel(CSG.concat([csg, femaleCsg, maleCsg]), parts);
    }
  }).queue();
}

exports.module = new Canvas.View3D('Parts', render, 'disp-canvas-p3d', set);
Canvas.register(exports.module)
