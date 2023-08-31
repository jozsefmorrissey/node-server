

// const CSG = require('../../public/js/3d-modeling/csg');

const Assembly = require('../objects/assembly/assembly');
const Handle = require('../objects/assembly/assemblies/hardware/pull.js');
const DrawerBox = require('../objects/assembly/assemblies/drawer/drawer-box.js');
const pull = require('../three-d/models/pull.js');
const drawerBox = require('../three-d/models/drawer-box.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const $t = require('../../../../public/js/utils/$t.js');
const ThreeDModel = require('../three-d/three-d-model.js');
const Vector3D = require('../three-d/objects/vector.js');
const Line3D = require('../three-d/objects/line.js');
const Vertex3D = require('../three-d/objects/vertex.js');
const Canvas = require('./canvas');
const Global = require('../services/global.js');
// const cube = new CSG.cube({radius: [3,5,1]});
const consts = require('../../globals/CONSTANTS');

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

du.on.match('click', '.model-state', (target) => {
  if (event.target.tagName === 'INPUT') return;
  const has = target.matches('.active');
  deselectPrefix();
  !has ? du.class.add(target, 'active') : du.class.remove(target, 'active');
  if (!has) {
    let label = target.children[0]
    let type = label.getAttribute('type');
    let value = type !== 'prefix' ?
    (type !== 'part-name' ? label.innerText : label.getAttribute('part-name')) :
    label.nextElementSibling.getAttribute('prefix');
    const cabinet = Global.cabinet();
    const tdm = ThreeDModel.get(cabinet);
    let partName = target.getAttribute('part-name');
    let targetSelected = label.hasAttribute('target') || target.hasAttribute('target');
    if (targetSelected) {
      let partCode = target.getAttribute('part-code');
      tdm.setTargetPartCode(partCode);
    } else {
      tdm.inclusiveTarget(type, has ? undefined : value);
      tdm.setTargetPartCode(null);
    }
  }
  Canvas.render();
});

function deselectPrefix() {
  document.querySelectorAll('.model-state')
    .forEach((elem) => du.class.remove(elem, 'active'));
  const cabinet = Global.cabinet();
  const tdm = ThreeDModel.get(cabinet);
  tdm.inclusiveTarget(undefined, undefined);
  tdm.setTargetPartCode(null);
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

const toggleClassStr = '.model-label,.model-selector';
function focusControls(target) {
  const all = du.find.all(toggleClassStr);
  for (let index = 0; index < all.length; index++) {
    all[index].hidden = true;
  }
  const active = du.find.upAll(toggleClassStr, target);
  active.push(du.find.down(toggleClassStr, target));
  for (let index = 0; index < active.length; index++) {
    active[index].hidden = false;
    const siblings = active[index].parentElement.children;
    for (let s = 0; s < siblings.length; s++) {
      let sibTarget = du.find.down(toggleClassStr, siblings[s]);
      if (sibTarget) sibTarget.hidden = false;
    }
  }
}

du.on.match('click', '.prefix-switch', (target, event) => {
  focusControls(target);
});

du.on.match('change', '.prefix-checkbox', (target) => {
  const cabinet = Global.cabinet();
  const attr = target.getAttribute('prefix');
  deselectPrefix();
  ThreeDModel.get(cabinet).hidePrefix(attr, !target.checked);
  Canvas.render();
});

du.on.match('change', '.part-name-checkbox', (target) => {
  const cabinet = Global.cabinet();
  const attr = target.getAttribute('part-name');
  deselectPrefix();
  const tdm = ThreeDModel.get(cabinet);
  tdm.hidePartName(attr, !target.checked);
  Canvas.render();
});

du.on.match('change', '.part-id-checkbox', (target) => {
  const cabinet = Global.cabinet();
  const attr = target.getAttribute('part-id');
  deselectPrefix();
  const tdm = ThreeDModel.get(cabinet);
  tdm.hidePartId(attr, !target.checked);
  Canvas.render();
})

function updateController() {
  const cabinet = Global.cabinet();
  if (cabinet === undefined) return;
  const controller = du.id('model-controller');
  const grouping = groupParts(cabinet);
  grouping.tdm = ThreeDModel.get(cabinet);
  controller.innerHTML = modelContTemplate.render(grouping);
  controller.hidden = false;
}

Canvas.on.switch((id) => {
  updateController();
});


function update(part, force) {
  if (part) part = Global.cabinet();
  const threeDModel = ThreeDModel.get(part);
  if (threeDModel) {
    threeDModel.buildObject();
    Canvas.render(part, force);
    updateController();
  }
}

function init() {
  // const p = pull(5,2);
  // const p = CSG.sphere({center: {x:0, y:0, z: 0}, radius: 10});
  // p.setColor('black')
  // const db = drawerBox(10, 15, 22);

  const setZFunc = setGreaterZindex('order-cnt', 'model-cnt');
  du.on.match('click', '#model-cnt', setZFunc);
  du.on.match('click', '#order-cnt', setZFunc);
  ThreeDModel.onLastModelUpdate(updateController);
}

module.exports = {init, update}
