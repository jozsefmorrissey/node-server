const DisplayManager = require('../display-utils/displayManager.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const LoadingDisplay = require('../../../../public/js/utils/display/loading.js');
const Global = require('../services/global');
const ThreeDModel = require('../three-d/three-d-model.js');
const CustomEvent = require('../../../../public/js/utils/custom-event.js');
const Jobs = require('../../web-worker/external/jobs.js');
const BiPolygon = require('../three-d/objects/bi-polygon.js');
const Utils = require('../utils');

const switchEvent = new CustomEvent('switch');

const modelDisplayManager = new DisplayManager('model-display-cnt', 'display-menu');

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
  csg.center({x:0,y:0,z:0})
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

function render() {
  const threeDmodel = du.id('three-d-model');
  const view = views.find(view => view.id() === openTabId);
  if (view) {
    view.render();
    threeDmodel.hidden = !(view instanceof View3D)
  } else {
    throw new Error(`unkown display '${openTabId}'`);
  }
}


let openTabId = 'two-d-model';
const switchTo = (id) => {
  if (openTabId !== id) switchEvent.trigger(id);
  openTabId = id;
  render();
};


modelDisplayManager.on.switch(details => switchTo(details.to.id));


du.on.match('enter', '*', () => {
  render.lastCall('Render!');
});


class View {
  constructor(name, render, id, set) {
    this.name = () => name;
    this.render = render;
    this.set = set;
    this.id = () => id;
  }
}
class View3D extends View { constructor(...args) {super(...args);}}
class View2D extends View { constructor(...args) {super(...args);}}

Canvas = {
  render, views, extraCsgObjects, render3Dmodel,
  on: {switch: switchEvent.on}, register, View, View2D, View3D,
  views: (name) => views.find(v => v.name())
};
module.exports = Canvas;
Object.getSet(Canvas, 'explosionFactor');
Canvas.explosionFactor(1.1);
