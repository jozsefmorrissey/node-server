
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

OrientationArrows.forCSG = (parentSelector, viewerOgetter, modelOgetter) => {
  let lastViewId;
  const getViewer = viewerOgetter instanceof Function ? viewerOgetter : () => viewerOgetter;
  const getModel = modelOgetter instanceof Function ? modelOgetter : () => modelOgetter;
  function centerOnObj(x,y,z, viewId) {
    const model = getModel();
    const center = model ? model.center() : {x:0, y:0, z:0};
    const rotation = {x: x*90, y: y*90, z: z*90};

    lastViewId = viewId;
    return [center, rotation];
  }

  let viewer;
  const orientArrows = new OrientationArrows(parentSelector);
  orientArrows.on.center(() =>
    (viewer = getViewer()) && viewer.viewFrom(...(lastViewId === 'front' ?
                    centerOnObj(2,0,2, 'back') : centerOnObj(0,0, 0, 'front'))));
  orientArrows.on.up(() =>
    (viewer = getViewer()) && viewer.viewFrom(...centerOnObj(1, 0,0)));
  orientArrows.on.down(() =>
    (viewer = getViewer()) && viewer.viewFrom(...centerOnObj(-1,0,0)));
  orientArrows.on.left(() =>
    (viewer = getViewer()) && viewer.viewFrom(...centerOnObj(0,1,0)));
  orientArrows.on.right(() =>
    (viewer = getViewer()) && viewer.viewFrom(...centerOnObj(0,-1,0)));

  return orientArrows;
}

module.exports = OrientationArrows;
