
const $t = require('../../../../../../public/js/utils/$t.js');
const du = require('../../../../../../public/js/utils/dom-utils.js');
const Void = require('../../../objects/assembly/assemblies/void.js');
const AssemblyConfigInput = require('../../../input/assembly-config.js');
const Measurement = require('../../../../../../public/js/utils/measurement.js');
const Cabinet = require('../../../objects/assembly/assemblies/cabinet.js');
const CustomEvent = require('../../../../../../public/js/utils/custom-event.js');
const Lookup = require('../../../../../../public/js/utils/object/lookup.js');

const voids = (cabinet) => Object.values(cabinet.subassemblies).filter(s => s instanceof Void);
const getCabinet = (elem) => Cabinet.get(du.find.up('[cabinet-id]', elem).getAttribute('cabinet-id'));

class VoidDisplay extends Lookup {
  constructor(cabinetGetter) {
    super();
    CustomEvent.all(this, 'add', 'remove', 'change');
    this.cabinetId = () => cabinetGetter().id();
    this.assemblyConfig = (vOid) => new AssemblyConfigInput(vOid);
    this.voids = () => voids(cabinetGetter());
    this.hash = () => this.voids().map(v => v.hash()).sum();
    this.on.add(this.trigger.change);
    this.on.remove(this.trigger.change);
    this.displayLength = (voId) => new Measurement(voId.length()).display();
    this.displayWidth = (voId) => new Measurement(voId.width()).display();
    this.cabinet = () => cabinetGetter();
    this.partCodes = () => Object.values(cabinetGetter().subassemblies).map(a => a.locationCode());
    this.html = () => VoidDisplay.template.render(this);
  }
}

du.on.match('click', `.void-display-cnt .add-void-btn`, (elem) => {
  const orientation = du.find.closest('[name="orientation"]:checked', elem).value;
  let width = du.find.closest('[name="width"]', elem).value;
  let height = du.find.closest('[name="height"]', elem).value;
  const measWidth = new Measurement(width, true);
  const measHeight = new Measurement(height, true);
  if (!Number.isNaN(measWidth.decimal())) width = measWidth.decimal();
  if (!Number.isNaN(measHeight.decimal())) height = measHeight.decimal();
  const refPartCode = du.find.closest('.void-part-code-select', elem).value;
  const config = Void.referenceConfig(orientation, refPartCode, width, height);

  const cabinet = getCabinet(elem);
  const partName = `void-${refPartCode}-${width}x${height}`;
  const vOid = new Void(null, partName, config);
  cabinet.addSubAssembly(vOid);
  const voidId = du.find.up('[void-id]', elem).getAttribute('void-id');
  const voidDisplay = VoidDisplay.get(voidId);
  voidDisplay.trigger.add(vOid);
})

const getTarget = (elem) => {
  const tarElem = du.find.up('[target-id]', elem);
  if (!tarElem) return undefined;
  return Lookup.get(tarElem.getAttribute('target-id'));
}

du.on.match('click', '.assembly.remove-btn', (elem) => {
  const cabinet = getCabinet(elem);
  const assemblies = cabinet.allAssemblies();
  const vOid = getTarget(elem);
  const parent = vOid.parentAssembly();
  delete parent.subassemblies[vOid.partCode()];
  const voidId = du.find.up('[void-id]', elem).getAttribute('void-id');
  const voidDisplay = VoidDisplay.get(voidId);
  voidDisplay.trigger.remove(vOid);
});

du.on.match('change', `.void-display-cnt .input-set input`, (elem) => {
  const index = du.find.up('[index]', elem).getAttribute('index');
  const cabinet = getCabinet(elem);
  const vOid = voids(cabinet)[index];
  let value = elem.type === 'checkbox' ? elem.checked : elem.value;
  vOid.pathValue(elem.name, value);
});

du.on.match('change', `.void-display-cnt .set-selector`, (elem) => {
  const index = du.find.up('[index]', elem).getAttribute('index');
  const cabinet = getCabinet(elem);
  const vOid = voids(cabinet)[index];
  vOid.jointSetIndex(elem.value);
});

du.on.match('change', '.void-dem', (elem) => {
  const vOid = getTarget(elem);
  vOid[elem.name](new Measurement(elem.value, true).decimal());
});


VoidDisplay.template = new $t('advanced/subassemblies/void');

module.exports = VoidDisplay;
