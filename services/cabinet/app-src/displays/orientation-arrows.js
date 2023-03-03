
const $t = require('../../../../public/js/utils/$t.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const CustomEvent = require('../../../../public/js/utils/custom-event.js');

class OrientationArrows extends Lookup {
  constructor(parentSelector) {
    super();
    const navId = `orientation-arrows-${this.id()}`;
    this.navId = () => navId;
    this.space = () => '&nbsp;&nbsp;';
    CustomEvent.all(this, 'up', 'right', 'down', 'left', 'center');

    const elem = du.find(parentSelector);
    if (elem === undefined) throw new Error(`No container found: '${parentSelector}'`);
    elem.innerHTML = OrientationArrows.template.render(this);

    this.on.up((elem, detail) => console.log('up', detail.direction));
    this.on.right((elem, detail) => console.log('right', detail.direction));
    this.on.down((elem, detail) => console.log('down', detail.direction));
    this.on.left((elem, detail) => console.log('left', detail.direction));
    this.on.center((elem, detail) => console.log('center', detail.direction));

  }
}

OrientationArrows.template = new $t('orientation-arrows');

du.on.match('click', '.orient-arrows>tbody>tr>td[dir]', function (target) {
  const tableElem = du.find.up('[l-id]', target);
  if (!tableElem) return;
  const id = tableElem.getAttribute('l-id');
  const instance = OrientationArrows.get(id);
  const direction = target.getAttribute('dir');
  switch (direction) {
    case 'u':
      instance.trigger.up(target, {direction, instance});
      break;
    case 'r':
      instance.trigger.right(target, {direction, instance});
      break;
    case 'd':
      instance.trigger.down(null, {direction, instance});
      break;
    case 'l':
      instance.trigger.left(target, {direction, instance});
      break;
    case 'c':
      instance.trigger.center(target, {direction, instance});
      break;
  }
});

module.exports = OrientationArrows;
