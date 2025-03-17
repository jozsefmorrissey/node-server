const DisplayManager = require('../display-utils/displayManager.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const $t = require('../../../../public/js/utils/$t.js');
const LoadingDisplay = require('../../../../public/js/utils/display/loading.js');
const Global = require('../services/global');
const ThreeDModel = require('../three-d/three-d-model.js');
const CustomEvent = require('../../../../public/js/utils/custom-event.js');
const Jobs = require('../../web-worker/external/jobs.js');
const {BiPolygon} = require('../../../../public/js/utils/canvas/three-d/lib');
const Utils = require('../utils');
const TaskLoading = require('../services/task-loading.js');

let modelDisplayManager;

let extraCsgObjsObj = [];
function extraCsgObjects(objects, shouldApply) {
  let obj = {objects, shouldApply,
    remove: () => extraCsgObjsObj.remove(obj)
  };
  extraCsgObjsObj.push(obj);
  return obj;
}

const applyExtraObjAndDisplay = (csg, info) => {
  csg ||= new CSG();
  for (let index = 0; index < extraCsgObjsObj.length; index++) {
    let ecoObj = extraCsgObjsObj[index];
    if (ecoObj.shouldApply(info)) {
      const objs = ecoObj.objects instanceof Function ? ecoObj.objects() : ecoObj.objects;
      for (let oi = 0; oi < objs.length; oi++) {
        if (objs[oi] instanceof CSG) csg.polygons.concatInPlace(objs[oi].polygons);
      }
    }
  }
  // csg.center({x:0,y:0,z:0})
  return csg;
}

function render3Dmodel(csg, information) {
  csg = applyExtraObjAndDisplay(csg, information);
  ThreeDModel.display(csg);
}

const views = [];
function register(view) {
  views.push(view);
}

function renderEdit(template) {
  const target = Global.target();
  views.forEach(v => v.hidden(true));
  editCnt.innerHTML = template.render(target);
  editCnt.hidden = false;
  // lastState = {view: null, target: null};
}

function renderView(view) {
  editCnt.hidden = true;
  const target = Global.target();
  views.forEach(v => v.hidden(true));
  view.hidden(false);
  du.id('three-d-model').hidden = !(view instanceof View3D)
  if (view !== lastState.view || target !== lastState.target) {
    const newState = {view, target};
    Canvas.trigger.switch.before({lastState, newState})
    lastState = newState;
    htmlContentCnt.innerHTML = '';
    htmlContentCnt.innerHTML = view.render() || view.id();
    Canvas.trigger.switch({lastState, newState});
    if (view instanceof View3D)ThreeDModel.orientArrows().front();
    return true;
  }
  return false;
}

const getView = (id) => views.find(view => view.id() === (id || openTabId));

let htmlContentCnt;
let editCnt;
const groupEditTemplate = new $t('group/edit');
const roomEditTemplate = new $t('room/edit');
let lastState = {view: null, target: null};
function render() {
  du.id('three-d-model').hidden = true;
  const view = getView();
  if (Global.target.is.group()) renderEdit(groupEditTemplate);
  else if (Global.target.is.room()) renderEdit(roomEditTemplate);
  else if (view) renderView(view);
  else views.forEach(v => v.hidden(true));
}


let openTabId;
const switchTo = (id) => {
  if ((typeof id) === 'string') openTabId = id;
  render();
};


const FileTabDisplay = require('../../../../public/js/utils/lists/file-tab.js');

const init = () =>{
  const typeTabs = new FileTabDisplay();
  typeTabs.register('Room');
  typeTabs.register('Object');
  typeTabs.register('Part');
  typeTabs.selected('Room');
  du.id('display-type-tabs').innerHTML = typeTabs.html();

  const demTabs = new FileTabDisplay();
  demTabs.register('layout');
  demTabs.register('2D');
  demTabs.register('3D');
  demTabs.selected('layout');

  const onTabChange = (elem) => {
    switchTo(`${typeTabs.selected()}-${demTabs.selected()}`.toLowerCase());
  }
  demTabs.on.change(onTabChange);
  typeTabs.on.change(onTabChange);
  du.id('display-demension-tabs').innerHTML = demTabs.html();

  htmlContentCnt = du.id('view-html-cnt');
  editCnt = du.id('edit-display');
  ThreeDModel.display(new CSG());
  switchTo('room-layout');
}

ThreeDModel.on.viewer.set((viewer) => {
  viewer.hoverList.events.LIST.forEach(eName => {
    viewer.hoverList.on.pathInfo(eName).value((...args) => {
      const view = getView();
      const info = view.runOn.pathInfo(eName);
      if(info && info.value) info.value(...args);
    });
  })
  console.log(viewer);
})


du.on.match('enter', '*', switchTo);

du.on.match('click', '.object.selector', (elem) => {
  const object = Lookup.get(elem.id);
  du.class.remove(du.find.all('.object.selector'), 'active');
  du.class.add(elem, 'active');
  Global.target(object);
  switchTo();
});


class View {
  constructor(id, render, runOn) {
    this.render = render;
    this.runOn = runOn || {};
    this.id = () => id;
    this.hidden = (oft) => {
      const elem = du.id(id);
      if (!elem) return null;
      if (oft === undefined) return elem.hidden;
      return elem.hidden = Boolean.is(oft) ? oft : !elem.hidden;
    }
  }
}
class View3D extends View { constructor(...args) {super(...args);}}
class View2D extends View { constructor(...args) {super(...args);}}

const updateView = () => {
  Canvas.view().render()
}

Canvas = {
  render, views, extraCsgObjects, render3Dmodel, init,
  register, View, View2D, View3D, updateView,
  view: getView
};

CustomEvent.all(Canvas, 'switch', 'explosionFactor', 'switch.before');

module.exports = Canvas;
Object.getSet(Canvas, 'explosionFactor');
Canvas.explosionFactor(2);

du.on.match('change', '[name="explosionFactor"]', (elem) => {
  const factor = 1 + Number.parseInt(elem.value)/10;
  Canvas.explosionFactor(factor);
  Canvas.render.lastCall('explosionFactorUpdate');
})
