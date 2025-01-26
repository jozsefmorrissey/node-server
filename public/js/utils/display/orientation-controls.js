
const $t = require('../../../../public/js/utils/$t.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const CustomEvent = require('../../../../public/js/utils/custom-event.js');

class OrientationControls extends Lookup {
  constructor(parentSelector, settingsHtml) {
    super();
    const navId = `orientation-${this.id()}`;
    this.navId = () => navId;
    this.space = () => '&nbsp;&nbsp;';

    let _color;
    this.color = (color) => {
      if (color) _color = color
      const elem = du.id(navId);
      return elem ?  du.find.down('[type="color"]', elem).value = _color : _color;
    }
    this.settingsCnt = () => du.find(`[l-id='${this.id()}'] .settings`);
    CustomEvent.all(this, 'up', 'right', 'down', 'left', 'center', 'color', 'settings.(open,change,click)');

    const elem = du.find(parentSelector);
    if (elem === undefined) throw new Error(`No container found: '${parentSelector}'`);
    elem.innerHTML = OrientationControls.template.render(this);
    this.on.settings.open(() => {
      const elem = this.settingsCnt();
      if (!elem) return;
      elem.hidden = !elem.hidden;
      if (!elem.hidden){
        du.find('.body', elem).innerHTML =
            settingsHtml instanceof Function ? settingsHtml() : settingsHtml || '';
        du.style(elem, {opacity: 1}, 3000)
      } else elem.style.opacity = null;

    });
    du.on.match('input', `[l-id='${this.id()}'] .settings input`, this.trigger.settings.change);
    du.on.match('click', `[l-id='${this.id()}'] .settings .remove-btn`, () => this.settingsCnt().hidden = true);
  }
}

OrientationControls.template = new $t('orientation-controls');

du.on.match('click', '.orientation .arrows td[cmd]', function (target) {
  const tableElem = du.find.up('[l-id]', target);
  if (!tableElem) return;
  const id = tableElem.getAttribute('l-id');
  const instance = OrientationControls.get(id);

  const cmd = target.getAttribute('cmd');
  switch (cmd) {
    case 'u':
      instance.trigger.up(target, {cmd, instance});
      break;
    case 'r':
      instance.trigger.right(target, {cmd, instance});
      break;
    case 'd':
      instance.trigger.down(null, {cmd, instance});
      break;
    case 'l':
      instance.trigger.left(target, {cmd, instance});
      break;
    case 'c':
      instance.trigger.center(target, {cmd, instance});
      break;
    case 'settings':
      instance.trigger.settings.open(target, {cmd, instance});
      break;
  }
});

du.on.match('input', '.orientation .arrows input[type="color"]', function (target) {
  const tableElem = du.find.up('[l-id]', target);
  if (!tableElem) return;
  const id = tableElem.getAttribute('l-id');
  const instance = OrientationControls.get(id);
  instance.color(target.value);
  instance.trigger.color(target, {cmd: 'color', instance});
});

OrientationControls.forCSG = (parentSelector, viewerOgetter, modelOgetter) => {
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

  const settingsTemplate = new $t('controls/viewer');
  let viewer;
  const orientArrows = new OrientationControls(parentSelector, () => settingsTemplate.render(viewer = getViewer()));
  orientArrows.color(getViewer().CONTROLS.BACKGROUND_COLOR);
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

  orientArrows.on.settings.change((elem) => {
    const inputs = du.find.downAll('input', elem.parentElement);
    const change = false;
    inputs.forEach(i => {
      const key = i.name.toPascal().toUpperCase();
      const value = i.type === 'checkbox' ? i.checked : i.value;
      if (key === 'BACKGROUND_COLOR') orientArrows.color(value);
      if (viewer.CONTROLS[key] !== value) {
        viewer.CONTROLS[key] = value;
        changed = true;
      }
    });
    viewer.gl.ondraw();
  });
  orientArrows.on.color((elem) => {
    const input = du.find('input[type="color"]', orientArrows.settingsCnt());
    if (input) input.value = elem.value;
    (viewer = getViewer()).CONTROLS.BACKGROUND_COLOR = elem.value;
    viewer.gl.ondraw();
  });

  return orientArrows;
}

module.exports = OrientationControls;
