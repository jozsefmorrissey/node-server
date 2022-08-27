

const CSG = require('../../public/js/3d-modeling/csg');

const Assembly = require('../objects/assembly/assembly');
const Handle = require('../objects/assembly/assemblies/hardware/pull.js');
const DrawerBox = require('../objects/assembly/assemblies/drawer/drawer-box.js');
const pull = require('../three-d/models/pull.js');
const drawerBox = require('../three-d/models/drawer-box.js');
const Viewer = require('../../public/js/3d-modeling/viewer.js').Viewer;
const addViewer = require('../../public/js/3d-modeling/viewer.js').addViewer;
const du = require('../../../../public/js/utils/dom-utils.js');
const $t = require('../../../../public/js/utils/$t.js');
const ThreeDModel = require('../three-d/three-d-model.js');
const ThreeView = require('three-view');


const cube = new CSG.cube({radius: [3,5,1]});
const consts = require('../../globals/CONSTANTS');
let viewer, threeView;
function init() {
  const p = pull(5,2);
  // const db = drawerBox(10, 15, 22);
  const canvas2d = du.id('two-d-model');
  viewer = new Viewer(p, canvas2d.height, canvas2d.width, 50);
  addViewer(viewer, '#three-d-model');
  threeView = new ThreeView(viewer);

  const setZFunc = setGreaterZindex('order-cnt', 'model-cnt', `${threeView.id()}-cnt`);
  du.on.match('click', '#model-cnt', setZFunc);
  du.on.match('click', '#order-cnt', setZFunc);
  du.on.match('click', `#${threeView.id()}-cnt`, setZFunc);
}

// TODO: ????
function displayPart(part) {
  return true;
}

function groupParts(cabinet) {
  const grouping = {displayPart, group: {groups: {}, parts: {}, level: 0}};
  const parts = cabinet.getParts();
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const namePieces = part.partName().split('.');
    let currObj = grouping.group;
    let level = 0;
    let prefix = '';
    for (let nIndex = 0; nIndex < namePieces.length - 1; nIndex += 1) {
      const piece = namePieces[nIndex];
      prefix += piece;
      if (currObj.groups[piece] === undefined) currObj.groups[piece] = {groups: {}, parts: {}};
      currObj = currObj.groups[piece];
      currObj.level = ++level;
      currObj.prefix = prefix;
      prefix += '.'
    }
    if (currObj.parts[part.partName()] === undefined) currObj.parts[part.partName()] = [];
    currObj.parts[part.partName()].push(part);
  }
  return grouping;
}

const modelContTemplate = new $t('model-controller');

du.on.match('click', '.model-label', (target) => {
  if (event.target.tagName === 'INPUT') return;
  const has = target.matches('.active');
  deselectPrefix();
  !has ? du.class.add(target, 'active') : du.class.remove(target, 'active');
  let label = target.children[0]
  let type = label.getAttribute('type');
  let value = type !== 'prefix' ? label.innerText :
        label.nextElementSibling.getAttribute('prefix');
  const cabinet = lastRendered;
  const tdm = ThreeDModel.get(cabinet, viewer);
  tdm.inclusiveTarget(type, has ? undefined : value);
  if (!has) {
    const partCode = du.find.closest('[type="part-code"]', target).innerText;
    threeView.isolatePart(partCode, cabinet);
  }
  tdm.render();
});

function deselectPrefix() {
  document.querySelectorAll('.model-label')
    .forEach((elem) => du.class.remove(elem, 'active'));
  const cabinet = lastRendered;
  const tdm = ThreeDModel.get(cabinet, viewer);
  tdm.inclusiveTarget(undefined, undefined);
}

function setGreaterZindex(...ids) {
  return (target) => {
    const zMap = [];
    let zIndexes = [];
    for (let index = 0; index < ids.length; index += 1) {
      const id = ids[index];
      const elem = du.id(id);
      const zIndex = du.zIndex(elem);
      zIndexes.push(zIndex);
      zMap[zIndex] = elem;
    }
    zIndexes.sort().reverse();
    target.style.zIndex = zIndexes[0];
    for (let index = 0; index < zIndexes.length; index += 1) {
      const elem = zMap[zIndexes[index]];
      if (elem === target) {
        break;
      } else {
        elem.style.zIndex = zIndexes[index + 1];
      }
    }
  };
}

du.on.match('click', '.prefix-switch', (target, event) => {
  const eventTarg = event.target;
  const active = du.find.upAll('.model-selector', target);
  active.push(target.parentElement.parentElement);
  const all = document.querySelectorAll('.prefix-body');
  all.forEach((pb) => pb.hidden = true);
  active.forEach((ms) => ms.children[0].children[1].hidden = false);
});

du.on.match('change', '.prefix-checkbox', (target) => {
  const cabinet = lastRendered;
  const attr = target.getAttribute('prefix');
  deselectPrefix();
  ThreeDModel.get(cabinet, viewer).hidePrefix(attr, !target.checked);
});

du.on.match('change', '.part-name-checkbox', (target) => {
  const cabinet = lastRendered;
  const attr = target.getAttribute('part-name');
  deselectPrefix();
  const tdm = ThreeDModel.get(cabinet, viewer);
  tdm.hidePartName(attr, !target.checked);
  tdm.render();
});

du.on.match('change', '.part-code-checkbox', (target) => {
  const cabinet = lastRendered;
  const attr = target.getAttribute('part-code');
  deselectPrefix();
  const tdm = ThreeDModel.get(cabinet, viewer);
  tdm.hidePartCode(attr, !target.checked);
  tdm.render();
})

du.on.match('click', '#three-d-model', () => {
  const controller = du.id('model-controller');
  const cabinet = lastRendered;
  if (cabinet) {
    const grouping = groupParts(cabinet);
    grouping.tdm = ThreeDModel.get(cabinet, viewer);
    controller.innerHTML = modelContTemplate.render(grouping);
  }
  controller.hidden = false;
});


let lastRendered;
function update(part) {
  if (part) lastRendered = part.getAssembly('c');
  const threeDModel = ThreeDModel.get(lastRendered, viewer);
  threeDModel.render(lastRendered);
}

module.exports = {init, update}
