
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

    let _color = '#000000';
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

function centerOnModel(x,y,z, viewId, get) {
  const model = get.model();
  const center = model ? model.center() : {x:0, y:0, z:0};
  const rotation = {x: x*90, y: y*90, z: z*90};

  get.lastViewId = viewId;
  return [center, rotation];
}

const setCenterOnFunctions = (viewId,x,y,z, get, orientArrows) => orientArrows[viewId] = () => {
  const viewer = get.viewer();
  if (viewer) viewer.viewFrom(...centerOnModel(x,y,z, viewId, get))
}

const settingsTemplate = new $t('controls/viewer');
OrientationControls.forCSG = (parentSelector, viewerOgetter, modelOgetter) => {
  const get = {
    viewer: viewerOgetter instanceof Function ? viewerOgetter : () => viewerOgetter,
    model: modelOgetter instanceof Function ? modelOgetter : () => modelOgetter
  }

  let viewer;
  const orientArrows = new OrientationControls(parentSelector,
                            () => settingsTemplate.render(viewer = get.viewer()));
  orientArrows.color(get.viewer().CONTROLS.BACKGROUND_COLOR);


  [['front',0,0,0],['back', 2,0,2],['up',1,0,0],['down',-1,0,0],['left',0,1,0],['right',0,-1,0]]
                    .forEach(args => setCenterOnFunctions(args[0],args[1],args[2],args[3], get, orientArrows));
  orientArrows.center = () =>
                    get.lastViewId === 'front' ? orientArrows.back() : orientArrows.front();
  const addOnEventFunctions = (k) => orientArrows.on[k](orientArrows[k]);
  ['center', 'up', 'down', 'left',  'right'].forEach(addOnEventFunctions);

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
    (viewer = get.viewer()).CONTROLS.BACKGROUND_COLOR = elem.value;
    viewer.gl.ondraw();
  });

  return orientArrows;
}

du.on.match('click', '.orientation .arrows td[cmd]', function (target) {
  const tableElem = du.find.up('[l-id]', target);
  if (!tableElem) return;
  const id = tableElem.getAttribute('l-id');
  const instance = OrientationControls.get(id);

  const cmd = target.getAttribute('cmd');
  switch (cmd) {
    case 'u':
      instance.trigger.up(target, {cmd, instance});break;
    case 'r':
      instance.trigger.right(target, {cmd, instance});break;
    case 'd':
      instance.trigger.down(target, {cmd, instance});break;
    case 'l':
      instance.trigger.left(target, {cmd, instance});break;
    case 'c':
      instance.trigger.center(target, {cmd, instance});break;
    case 'settings':
      instance.trigger.settings.open(target, {cmd, instance});break;
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

module.exports = OrientationControls;
