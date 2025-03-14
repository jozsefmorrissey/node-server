
const ColorManagerInputTree = require('./color-manager-input-tree');
const du = require('../../../../../public/js/utils/dom-utils.js');
const $t = require('../../../../../public/js/utils/$t.js');
const CustomEvent = require('../../../../../public/js/utils/custom-event.js');
const Lookup = require('../../../../../public/js/utils/object/lookup.js');
const Utils = require('../../utils.js');


class ColorManager extends Lookup {
  constructor(containerId, idAttribute) {
    super();
    idAttribute ||= 'id';
    let _objects = [];
    CustomEvent.all(this, 'change');

    this.objects = (objects) => Array.isArray(objects) ? (_objects = objects) : _objects;
    this.map = (objects) => this.objects(objects).filterSplit(o => {
        let idStr = o.pathValue(idAttribute);
        idStr = idStr ? '.'+idStr : '';
        return `${Color.hex(o.color())}.${o.constructor.name}${idStr}`;
    });
    this.colors = (objects) => Object.keys(this.map(objects));
    this.inputTrees = () =>
      this.colors().map(c => new ColorManagerInputTree(c, this));
    this.html = (objects) => ColorManager.template.render(this);

    this.update = (objects) => du.id(containerId).innerHTML = this.html();
  }
}

du.on.match('input', '#room-color-cnt input[type="color"]', (elem, event) => {
  const id = du.find.up.attribute('lookup-id', elem);
  const manager = ColorManager.get(id);
  const objects = manager.objects();
  const original = elem.getAttribute('original');
  objects.forEach(obj => Color.hex(obj.color()) === original &&
                          obj.color(elem.value));
  elem.setAttribute('original', elem.value)
  manager.trigger.change();
});

function applyColors(assembly, csgOmodelInformation) {
  let csg;
  if (csgOmodelInformation instanceof CSG) {
    csg = csgOmodelInformation;
    csg.setColors(assembly.color());
  } else {
    csg = csgOmodelInformation.unioned();
    csg.setColors(assembly.color());
    const pullCsg = csgOmodelInformation.unioned('handles');
    const pullColor = assembly.resolve('pcolor', true);
    pullCsg.setColors(pullColor);
    csg.polygons.concatInPlace(pullCsg.polygons);
  }
  return csg;
}

ColorManager.positionAndColor = (modelIdMap) => {
  const ids = Object.keys(modelIdMap);
  const csgs = [];
  for (let index = 0; index < ids.length; index++) {
    const id = ids[index];
    const cabinet = Lookup.get(id);
    const csg = applyColors(cabinet, modelIdMap[id]);
    csgs.push(Utils.positionAssemblyCsg(csg, cabinet));
  }
  return CSG.concat(csgs);
}

ColorManager.template = new $t('room/color-manager')

module.exports = ColorManager;
