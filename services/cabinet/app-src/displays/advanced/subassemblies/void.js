
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
  constructor(cabinet) {
    super();
    const addEvent = new CustomEvent('add');
    this.cabinetId = () => cabinet.id();
    this.assemblyConfig = (vOid) => new AssemblyConfigInput(vOid);
    this.voids = () => voids(cabinet);
    this.on = {add: addEvent.on};
    this.trigger = {add: addEvent.trigger};

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
  const refPartCode = 'BACK';
  const config = VoidDisplay.configs(orientation, refPartCode, width, height);

  const cabinet = getCabinet(elem);
  const partName = `void-${refPartCode}-${width}x${height}`;
  const partCode = cabinet.subassemblies.undefinedKey('void');
  const vOid = new Void(partCode, partName, config.c, config.d, config.r);
  vOid.includedSides(config.includedSides);
  vOid.jointSet(config.jointSet);
  cabinet.addSubAssembly(vOid);
  const voidId = du.find.up('[void-id]', elem).getAttribute('void-id');
  const voidDisplay = VoidDisplay.get(voidId);
  voidDisplay.trigger.add(vOid);
})

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
  vOid.jointSet(elem.value);
});


VoidDisplay.template = new $t('advanced/subassemblies/void');

VoidDisplay.configs = (type, refPartCode, width, height) => {
  switch (type) {
    case 'vertical':
      return {
        c: [
          `${refPartCode}.c.x`,
          `${refPartCode}.c.y`,
          `${refPartCode}.c.z + d.z/2 + ${refPartCode}.d.z/2`,
        ].join(':'),
        d: [
          width,
          `${refPartCode}.d.y - 3*2.54*3/4`,
          height
        ].join(':'),
        r: [
          `${refPartCode}.r.x`,
          `${refPartCode}.r.y`,
          `${refPartCode}.r.z`
        ].join(':'),
        includedSides: [true, false, false, false, true, true],
        jointSet: 1
      };
    default:
      return {
        c: [
            `${refPartCode}.c.x`,
            `${refPartCode}.c.y - ${refPartCode}.d.y/2 + d.y/2 + 3*2.54/4`,
            `${refPartCode}.c.z + d.z/2 + 3*2.54/8`
          ].join(':'),
          d: [
            `${refPartCode}.d.x - 3*2.54/4`,
            width,
            height
          ].join(':'),
          r: [
            `${refPartCode}.r.x`,
            `${refPartCode}.r.y`,
            `${refPartCode}.r.z`
          ].join(':'),
          includedSides: [true, false, true],
          jointSet: 3
      };

  }
};

module.exports = VoidDisplay;
