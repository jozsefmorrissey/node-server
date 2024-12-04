
const ColorManagerInputTree = require('./color-manager-input-tree');
const du = require('../../../../../public/js/utils/dom-utils.js');
const $t = require('../../../../../public/js/utils/$t.js');
const Lookup = require('../../../../../public/js/utils/object/lookup.js');

class ColorManager extends Lookup {
  constructor(containerId, idAttribute) {
    super();
    idAttribute ||= 'id';
    let _objects = [];

    this.objects = (objects) => Array.isArray(objects) ? (_objects = objects) : _objects;
    this.map = (objects) => this.objects(objects).filterSplit(o => {
        let idStr = o.pathValue(idAttribute);
        idStr = idStr ? '.'+idStr : '';
        return `${String.color.hex(o.color())}.${o.constructor.name}${idStr}`;
    });
    this.colors = (objects) => Object.keys(this.map(objects));
    this.inputTrees = () =>
      this.colors().map(c => new ColorManagerInputTree(c, this));
    this.html = (objects) => ColorManager.template.render(this);

    this.update = (objects) => du.id(containerId).innerHTML = this.html();
  }
}

du.on.match('change', '#room-color-cnt input[type="color"]', (elem, event) => {
  const id = du.find.up.attribute('lookup-id', elem);
  const manager = ColorManager.get(id);
  const objects = manager.objects();
  const original = elem.getAttribute('original');
  objects.forEach(obj => String.color.hex(obj.color()) === original &&
                          obj.color(elem.value));

  console.log(du, elem);
});

ColorManager.template = new $t('room/color-manager')

module.exports = ColorManager;
