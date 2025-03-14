const Canvas = require('../../canvas');
const Jobs = require('../../../../web-worker/external/jobs.js');
const ColorManager = require('../../managers/color-manager');
const {Vertex3D, Line3D} = require('../../../../../../public/js/utils/canvas/three-d/lib.js');
const ThreeDModel = require('../../../three-d/three-d-model.js');
const Lookup = require('../../../../../../public/js/utils/object/lookup.js');
const $t = require('../../../../../../public/js/utils/$t.js');
const du = require('../../../../../../public/js/utils/dom-utils.js');
const Properties = require('../../../config/properties.js');

const typeTemplateMap = {};

['divider', 'door', 'drawer-box', 'opening-toe-kick', 'panel']
  .forEach(type => typeTemplateMap[type.toCamelCap()] = new $t(`views/parts/type/${type}`));

const set = {};
let locationPrefix, locationCode, _parts, ufidPrefix;
let openTabId;
let hoverList, selected;
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

const runOn = {
  hover: (target) => {
    console.log(target.payload.locationCode());
    render(target);
  },
  click: (target) => {
    selected = target.payload;
    console.log(selected)
    const parent = target.payload.parentAssembly();
    const assem = typeTemplateMap[parent.constructor.name] ? parent : target.payload;
    const template = typeTemplateMap[assem.constructor.name];
    let html = template ? template.render(target.payload) : '?????';
    const partCnt = du.id('parts-3D-selected-cnt');
    partCnt.innerHTML = html;
    partCnt.setAttribute('lookup-id', assem.id());
  }
}
runOn.hover.out = render;

function explode(model, center, color) {
  if (model) {
    model = model.clone();
    model.setColors(color || Color.next());
    const explosionFactor = Canvas.explosionFactor();
    if (!explosionFactor) return;
    const modelCenter = new Vertex3D(model.center());
    const centerLine = new Line3D(center, modelCenter);
    centerLine.length(centerLine.length() * explosionFactor, true);
    model.center(centerLine[1]);
  }
  return model
}

function relatedParts(maleOfemale, id, jointMap) {
  const type = maleOfemale === false ? 'female' : 'male';
  const jointType = maleOfemale === true ? 'female' : 'male';
  return (jointMap[type][id] || [])
    .map(id => jointMap[id][jointType]).concatElements().unique()
    .map(id => Lookup.get(id));
}

let jointMap, partModelMap;

function isolateParts() {
  let parts;
  const cabinet = Global.target();
  if (locationPrefix) parts = cabinet.getParts().filter(lcPrefixFilter);
  else if (ufidPrefix) parts = cabinet.getParts().filter(pcPrefixFilter);
  else if (locationCode) parts = [cabinet.getAssembly(locationCode)];
  else if (_parts) parts = _parts;
  if (!parts || parts.length === 0) {
    resetAll();
    parts = cabinet.modelingCollections();
  }
  return parts.filter(p => p.part() && p.included() && !p.composite() && !p.digital());
}

const hoverColor = 'yellow';
function concatModels(parts, hovering, color) {
  const center = Global.target().buildCenter(true);
  const csg = new CSG();
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];
    const partColor = hovering && part === hovering.payload ? hoverColor : color;
    const model = explode(partModelMap[part.id()], center, partColor);
    if (model) {
      if (partColor) model.setColors(partColor);
      csg.add(model);
    }
  }
  return csg;
}

function updateHoverList() {
  const hoverList = ThreeDModel.getViewer().hoverList;
  hoverList.clear();
  partModelMap = {};
  const assembly = Global.assembly();
  const center = assembly.buildCenter(true);
  assembly.modelingCollections().forEach((p,i) => {
    const model = _modelInfo.joined(p.id());
    if (!model) return;
    partModelMap[p.id()] = model;
    const epts = Vertex3D.fromLimits(explode(model, center).endpoints());
    hoverList.add(epts, p);
  });
  render();
}
Canvas.on.explosionFactor(updateHoverList);

function render(hovering) {
  const parts = hovering && hovering.payload ? [hovering.payload] : isolateParts();
  if (parts.length > 1) {
    Canvas.render3Dmodel(concatModels(parts, hovering));
  } else {
    const p = parts[0];
    const csg = concatModels([p], hovering, 'blue');
    const femaleParts = relatedParts(false, p.id(), jointMap, );
    const maleParts = relatedParts(true, p.id(), jointMap);
    const femaleCsg = concatModels(femaleParts, hovering, 'red');
    const maleCsg = concatModels(maleParts, hovering, 'green');
    const spokenFor = femaleParts.concat(maleParts).concat(p).idMap(p => p.id());
    const allParts = Global.assembly().modelingCollections();
    const notSpokenFor = allParts.filter(p => spokenFor[p.id()] === undefined);
    const unrelated = concatModels(notSpokenFor, null, 'black');
    Canvas.render3Dmodel(CSG.concat([csg, femaleCsg, maleCsg, unrelated]), parts);
  }
}

const partTemplate = new $t('views/parts/3D');
function  build() {
  const assembly = Global.assembly();
  if (assembly) {
    new Jobs.CSG.Assembly.Construction(assembly).then((modelInfo, job) => {
      _modelInfo = modelInfo;
      jointMap = modelInfo.modelingConfiguration().jointMap();
      console.log(ThreeDModel);
      updateHoverList();
    }).queue();
  } else {
    const target = Global.target();
    console.error('Have not implemented non assembly methods');
  }
  const explosionFactor = Canvas.explosionFactor();
  return partTemplate.render({explosionFactor, assembly});
}
exports.module = new Canvas.View3D('part-3d', build, runOn);
Canvas.register(exports.module)
