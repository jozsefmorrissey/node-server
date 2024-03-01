

// const CSG = require('../../../../public/js/utils/3d-modeling/csg.js');

const Assembly = require('../objects/assembly/assembly');
const Handle = require('../objects/assembly/assemblies/hardware/pull.js');
const DrawerBox = require('../objects/assembly/assemblies/drawer/drawer-box.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const $t = require('../../../../public/js/utils/$t.js');
const Vector3D = require('../three-d/objects/vector.js');
const Line3D = require('../three-d/objects/line.js');
const Vertex3D = require('../three-d/objects/vertex.js');
const Canvas = require('./canvas');
const Jobs = require('../../web-worker/external/jobs.js');
const Global = require('../services/global.js');
// const cube = new CSG.cube({radius: [3,5,1]});
const consts = require('../../globals/CONSTANTS');

let groupingType = 'location';

function groupPartsByLocation(cabinet) {
  const grouping = {group: {groups: {}, parts: [], level: 0}};
  const parts = cabinet.getParts();
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const namePieces = part.locationCode().split(/_|:/);
    const connectors = part.locationCode().replace(/[^_^:]/g, '');
    let currObj = grouping.group;
    let level = 0;
    let prefix = namePieces.slice(0,1)+'_';
    for (let nIndex = 1; nIndex < namePieces.length; nIndex += 1) {
      const piece = namePieces[nIndex];
      prefix += piece;
      if (currObj.groups[piece] === undefined) currObj.groups[piece] = {groups: {}, parts: []};
      currObj = currObj.groups[piece];
      currObj.level = ++level;
      currObj.prefix = prefix;
      prefix += connectors[nIndex];
    }
  }
  return grouping;
}

function groupPartsByUFID(cabinet) {
  const groups = {};
  const parts = cabinet.getParts();
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const partCode = part.partCode().replace(/:.*$/, '');
    const ufid = part.userFriendlyId();
    if (groups[partCode] === undefined) groups[partCode] = {prefix: partCode, groups: {}, level: 1};
    groups[partCode].groups[ufid] = {groups: {}, prefix: ufid, level: 2}
  }
  return {group: {groups, parts: [], level: 0}};
}

function groupParts(cabinet) {
  return groupingType === 'location' ? groupPartsByLocation(cabinet) : groupPartsByUFID(cabinet);
}

const modelContTemplate = new $t('parts/model-controller');

du.on.match('click', '.model-state', (target, event) => {
  if (event.target.matches('[type="checkbox"]')) return;
  let prefix = du.find.up('[prefix]', target).getAttribute('prefix');
  const has = target.matches('.active');
  deselectPrefix();
  if (!has) {
    du.class.add(target, 'active');
    let label = target.children[0]
    let type = label.getAttribute('type');
    let value = label.getAttribute('part-code');
    const cabinet = Global.cabinet();
    let targetSelected = label.hasAttribute('target') || target.hasAttribute('target');

    if (groupingType === 'location') Canvas.set.locationPrefix(prefix);
    else Canvas.set.ufidPrefix(prefix);
  }
  Canvas.render();
});

function deselectPrefix() {
  document.querySelectorAll('.model-state')
    .forEach((elem) => du.class.remove(elem, 'active'));
  Canvas.set.locationPrefix(null);
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
  const down = du.find.down(toggleClassStr, target);
  if (down) active.push(down);
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

du.on.match('change', '.location-code-checkbox', (target) => {
  const cabinet = Global.cabinet();
  const attr = target.getAttribute('part-code');
  Canvas.render();
});

function updateController() {
  const cabinet = Global.cabinet();
  if (cabinet === undefined) return;
  const controller = du.id('model-controller');
  const grouping = groupParts(cabinet);
  controller.innerHTML = modelContTemplate.render({groupingType, grouping});
  controller.hidden = false;
}

du.on.match('change', '.model-controller-cnt input', (elem) => {
  groupingType = elem.value;
  updateController();
});

Canvas.on.switch((id) => {
  updateController();
});


function update(part, force) {
  if (part) part = Global.cabinet();
  if (part) {
    new Jobs.CSG.Assembly.Join(part).then(Canvas.render, console.error).queue();
    updateController();
  }
}

function init() {
  const setZFunc = setGreaterZindex('order-cnt', 'model-cnt');
  du.on.match('click', '#model-cnt', setZFunc);
  du.on.match('click', '#order-cnt', setZFunc);
}

module.exports = {init, update}
