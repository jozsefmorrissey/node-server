const Canvas = require('../../canvas');
const Jobs = require('../../../../web-worker/external/jobs.js');
const ColorManager = require('../../managers/color-manager');
const {Vertex3D, Line3D} = require('../../../../../../public/js/utils/canvas/three-d/lib.js');
const ThreeDModel = require('../../../three-d/three-d-model.js');
const Lookup = require('../../../../../../public/js/utils/object/lookup.js');
const $t = require('../../../../../../public/js/utils/$t.js');
const du = require('../../../../../../public/js/utils/dom-utils.js');
const Properties = require('../../../config/properties.js');
const EditDisplays = require('../../part/edit.js');

const runOn = {
  hover: (target) => {
    render(target);
  },
  click: (target) => {
    selected = target.payload;
    const parent = target.payload.parentAssembly();
    const assem = EditDisplays[parent.constructor.name] ? parent : target.payload;
    let html = EditDisplays[assem.constructor.name] ? EditDisplays[assem.constructor.name](assem) : 'Coming Soon????... Perhaps';
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
  const parts = hovering && hovering.payload ? [hovering.payload] : Global.assembly().modelingCollections();
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
  ThreeDModel.orientArrows().front();;
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
