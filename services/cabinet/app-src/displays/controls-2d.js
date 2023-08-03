
const $t = require('../../../../public/js/utils/$t.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const CustomEvent = require('../../../../public/js/utils/custom-event.js');

class Controls2d extends Lookup {
  constructor(parentSelector, getLayout, panZ) {
    super();
    const navId = `orientation-arrows-${this.id()}`;
    let moveCount = 0;
    const instance = this;
    let centerWithin = true;
    this.navId = () => navId;
    this.space = () => '&nbsp;&nbsp;';
    CustomEvent.all(this, 'up', 'right', 'down', 'left', 'center');


    function inView() {
      const width = panZ.innerWidth;
      const height = panZ.innerHeight;
      const center = panZ.center();
      const right = center.x + width/2;
      const left = center.x - width/2
      const top = center.y + height/2;
      const bottom = center.y - height/2;

      const verts = getLayout().vertices();
      for (let index = 0; index < verts.length; index++) {
        const vert = verts[index];
        const inView = vert.x() > left && vert.x() < right &&
                        vert.y() > bottom && vert.y() < top;
        if (inView) return true;
      }
      return false;
    }

    this.centerCode = () => {
      const panCenter = panZ.center();
      centerWithin = inView();
      return !centerWithin ? 8982 : 9633;
    }

    function updateHtml() {
      const elem = du.find(parentSelector);
      if (elem === undefined) throw new Error(`No container found: '${parentSelector}'`);
      elem.innerHTML = Controls2d.template.render(instance);
    }

    panZ.onTranslate((hmm) => {
      moveCount++;
      updateHtml();
    });

    updateHtml();

    this.on.up((elem, detail) => {
      getLayout().nextLevel();
      panZ.once();
    });
    this.on.down((elem, detail) => {
      getLayout().prevLevel();
      panZ.once();
    });

    this.on.right((elem, detail) => {
      panZ.displayTransform.rotate += Math.PI/-4;
      panZ.once();
    });
    this.on.left((elem, detail) => {
      panZ.displayTransform.rotate += Math.PI/4;
      panZ.once();
    });
    this.on.center((elem, detail) => {
      const layout = getLayout();
      if (centerWithin) {
        layout.straightenUp();
        panZ.once();
      } else {
        panZ.centerOn(layout.center().x(), layout.center().y());
        centerWithin = true;
      }
    });

  }
}

Controls2d.template = new $t('2d/controls');

du.on.match('click', '.controls-2d>tbody>tr>td[dir]', function (target) {
  const tableElem = du.find.up('[l-id]', target);
  if (!tableElem) return;
  const id = tableElem.getAttribute('l-id');
  const instance = Controls2d.get(id);
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

module.exports = Controls2d;
