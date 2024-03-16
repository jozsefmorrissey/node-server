const $t = require('../../../../../public/js/utils/$t.js');
const Global = require('../../services/global.js');
const du = require('../../../../../public/js/utils/dom-utils');
const Measurement = require('../../../../../public/js/utils/measurement.js');

const Panel = require('../../objects/assembly/assemblies/panel.js');
const DrawerBox = require('../../objects/assembly/assemblies/drawer/drawer-box.js');
const DrawerFront = require('../../objects/assembly/assemblies/drawer/drawer-front.js');
const Door = require('../../objects/assembly/assemblies/door/door.js');
const Handle = require('../../objects/assembly/assemblies/hardware/pull.js');
const Cabinet = require('../../objects/assembly/assemblies/cabinet.js');

const template = new $t('documents/materials');
const partTemplate = new $t('documents/cabinet');

function partSpliter(p) {
  if (p instanceof Panel) {
    return 'Panel';
  }
  if (p instanceof DrawerBox) return 'DrawerBox';
  if (p instanceof DrawerFront) return 'DrawerFront';
  if (p instanceof Door) return 'Door';
  if (p instanceof Handle) return 'Handle';
  return 'unknown';
}

const setDemensions = (obj, attr, setArea) => {
  if (obj[attr] === undefined) obj[attr] = [];
  obj[attr].demensions = obj[attr].map(o => o.position().normalModel(true).demensions());
  if (setArea) obj[attr].area = Measurement.area(obj[attr].demensions);
}

function materialInfo(cabinets) {
  const parts = [];
  cabinets.forEach(c => parts.concatInPlace(c.getParts()))
  const partsSplit = parts.filterSplit(partSpliter);
  console.log(partsSplit);
  setDemensions(partsSplit, 'Panel', true);
  setDemensions(partsSplit, 'DrawerFront', true);
  setDemensions(partsSplit, 'Door', true);
  setDemensions(partsSplit, 'DrawerBox');
  partsSplit.display = Measurement.display;
  return partsSplit;
}

const html = {
  order: (order) => {
    order ||= Global.order();
    const cabinets = [];
    Object.values(order.rooms).forEach(
        r => r.groups.forEach(
            g => g.objects.forEach(o => o instanceof Cabinet && cabinets.push(o))));
    return template.render(materialInfo(cabinets));
  },
  cabinet: (cabinet) => {
    const info = partInfo(part);
    return partTemplate.render({info, viewContainer, disp: CutInfo.display});
  }
};

module.exports = {
  html
}
