

// const CSG = require('../../../../public/js/utils/3d-modeling/csg.js');

const Assembly = require('../objects/assembly/assembly');
const du = require('../../../../public/js/utils/dom-utils.js');
const $t = require('../../../../public/js/utils/$t.js');
const Jobs = require('../../web-worker/external/jobs.js');

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
    const cabinet = Global.target();
    let targetSelected = label.hasAttribute('target') || target.hasAttribute('target');

    if (groupingType === 'location') Canvas.views('Parts').set.locationPrefix(prefix);
    else Canvas.views('Parts').set.ufidPrefix(prefix);
  }
  Canvas.render();
});

function deselectPrefix() {
  document.querySelectorAll('.model-state')
    .forEach((elem) => du.class.remove(elem, 'active'));
  Canvas.views('Parts').set.locationPrefix(null);
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
  const cabinet = Global.target();
  const attr = target.getAttribute('part-code');
  Canvas.render();
});

function updateController() {
  if (!Canvas.view().id().startsWith('part-')) return;
  const target = Global.target();
  let html;
  const controller = du.id('model-controller');
  if (target instanceof Assembly) {
    const grouping = groupParts(target);
    const explosionFactor = Canvas.explosionFactor();
    const dispExplosionFactor = explosionFactor ? Math.floor((explosionFactor-1) * 10) : 0;
    html = modelContTemplate.render({groupingType, grouping, dispExplosionFactor});
  } else html = 'No Part Controls yet';
  controller.innerHTML = html;
}

Global.on.change.cabinet(updateController);
du.on.match('change', '.model-controller-cnt input[type="radio"]', (elem) => {
  groupingType = elem.value;
  updateController();
});

du.on.match('change', '.model-controller-cnt [name="explosionFactor"]', (elem) => {
  const factor = 1 + Number.parseInt(elem.value)/10;
  Canvas.explosionFactor(factor);
  Canvas.render.lastCall('explosionFactorUpdate');
})

Canvas.on.switch(updateController);
