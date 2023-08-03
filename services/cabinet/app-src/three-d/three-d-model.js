

const CSG = require('../../public/js/3d-modeling/csg');

const du = require('../../../../public/js/utils/dom-utils.js');
const $t = require('../../../../public/js/utils/$t.js');
const FunctionCache = require('../../../../public/js/utils/services/function-cache.js');

const Polygon3D = require('./objects/polygon');
const Vertex3D = require('./objects/vertex');
const CustomEvent = require('../../../../public/js/utils/custom-event.js');
const OrientationArrows = require('../displays/orientation-arrows.js');
const Viewer = require('../../public/js/3d-modeling/viewer.js').Viewer;
const addViewer = require('../../public/js/3d-modeling/viewer.js').addViewer;
const CabinetModel = require('./cabinet-model');

const colors = {
  indianred: [205, 92, 92],
  gray: [128, 128, 128],
  fuchsia: [255, 0, 255],
  lime: [0, 255, 0],
  black: [0, 0, 0],
  lightsalmon: [255, 160, 122],
  red: [255, 0, 0],
  maroon: [128, 0, 0],
  yellow: [255, 255, 0],
  olive: [128, 128, 0],
  lightcoral: [240, 128, 128],
  green: [0, 128, 0],
  aqua: [0, 255, 255],
  white: [255, 255, 255],
  teal: [0, 128, 128],
  darksalmon: [233, 150, 122],
  blue: [0, 0, 255],
  navy: [0, 0, 128],
  salmon: [250, 128, 114],
  silver: [192, 192, 192],
  purple: [128, 0, 128]
}

const colorChoices = Object.keys(colors);
let colorIndex = 0;
function getColor(name) {
  if(colors[name]) return colors[name];
  return colors[colorChoices[colorIndex++ % colorChoices.length]];
  // return colors.white;
}

class ThreeDModel {
  constructor(object) {
    const hiddenPartIds = {};
    const hiddenPartNames = {};
    const hiddenPrefixes = {};
    const instance = this;
    let hiddenPrefixReg;
    let partModels = {};
    let extraObjects = [];
    let inclusiveTarget = {};
    let partMap;
    let renderId;
    let targetPartName;
    let lastRendered;
    this.setTargetPartName = (id) =>
      targetPartName = id;
    this.getLastRendered = () => lastRendered;

    this.object = (a) => {
      if (a !== undefined) {
        object = a;
      }
      return object;
    }

    this.partMap = () => partMap;
    this.isTarget = (type, value) => {
      return inclusiveTarget.type === type && inclusiveTarget.value === value;
    }
    this.inclusiveTarget = function(type, value) {
      let prefixReg;
      if (type === 'prefix') prefixReg = new RegExp(`^${value}`)
      inclusiveTarget = {type, value, prefixReg};
    }

    function inclusiveMatch(part) {
      if (!inclusiveTarget.type || !inclusiveTarget.value) return null;
      switch (inclusiveTarget.type) {
        case 'prefix':
          return part.partName().match(inclusiveTarget.prefixReg) !== null;
          break;
        case 'part-name':
          return part.partName() === inclusiveTarget.value;
        case 'part-id':
          return part.id() === inclusiveTarget.value;
        default:
          throw new Error('unknown inclusiveTarget type');
      }
    }

    function manageHidden(object) {
      return function (attr, value) {
        if (value === undefined) return object[attr] === true;
       object[attr] = value === true;
       instance.render();
      }
    }

    // Quick and dirty
    function centerModel(model) {
      const offset = model.distCenter();
      offset.z += 100;
      offset.y -= 50;
      offset.x -= 50;
      model.translate(offset);
    }

    function buildHiddenPrefixReg() {
      const list = [];
      const keys = Object.keys(hiddenPrefixes);
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        if (hiddenPrefixes[key] === true) {
          list.push(key);
        }
      }
      hiddenPrefixReg = list.length > 0 ? new RegExp(`^${list.join('|')}`) : null;
    }

    this.hidePartId = manageHidden(hiddenPartIds);
    this.hidePartName = manageHidden(hiddenPartNames);
    this.hidePrefix = manageHidden(hiddenPrefixes);

    function hasHidden(hiddenObj) {
      const keys = Object.keys(hiddenObj);
      for(let i = 0; i < hiddenObj.length; i += 1)
        if (hidden[keys[index]])return true;
      return false;
    }
    this.noneHidden = () => !hasHidden(hiddenPartIds) &&
        !hasHidden(hiddenPartNames) && !hasHidden(hiddenPrefixes);

    this.depth = (label) => label.split('.').length - 1;

    function hidden(part, level) {
      if (!part.included()) return true;
      const im = inclusiveMatch(part);
      if (im !== null) return !im;
      if (instance.hidePartId(part.id())) return true;
      if (instance.hidePartName(part.partName())) return true;
      if (hiddenPrefixReg && part.partName().match(hiddenPrefixReg)) return true;
      return false;
    }

    // Remove if colors start behaving correctly, can be use to debug.
    let xzFootprint;
    function createXZfootprint(model, cabinet) {
      const cube = CSG.cube({demensions: [cabinet.width(),1,cabinet.thickness()], center: model.center});
      xzFootprint = cube.intersect(model);
    }

    this.xzFootprint = () => xzFootprint;

    function coloring(part) {
      if (part.partName() && part.partName().match(/.*Frame.*/)) return getColor('blue');
      else if (part.partName() && part.partName().match(/.*Drawer.Box.*/)) return getColor('green');
      else if (part.partName() && part.partName().match(/.*Handle.*/)) return getColor('silver');
      return getColor('red');
    }

    const randInt = (start, range) => start + Math.floor(Math.random() * range);
    function debugColoring() {
      return [randInt(0, 255),randInt(0, 255),randInt(0, 255)];
    }

    this.addVertex = (center, radius, color) => {
      radius ||= .5;
      const vertex = CSG.sphere({center, radius});
      vertex.setColor(getColor(color));
      extraObjects.push(vertex);
    }

    this.removeAllExtraObjects = () => extraObjects = [];


    function toTwoDpolys(model) {
      if (model === undefined) return undefined;
      if (model.threeView) return model;
      const polys = Polygon3D.fromCSG(model.polygons);
      polys.normals = model.normals;
      Polygon3D.merge(polys);
      const threeView = Polygon3D.toThreeView(polys, polys.normals);
      model.threeView = threeView;
      return model;
    }

    let lm;
    this.lastModel = () => toTwoDpolys(lm);

    function buildModel(assem) {
      let a = assem.toModel();
      let normals = a.normals;
      a.setColor(...getColor());
      assem.getJoints().female.forEach((joint) => {
        if (joint.apply()) {
          const male = joint.getMale();
          const m = male.toModel();
          if (a.polygons.length > 0) {
            a = a.subtract(m);
          }
        }
      });
      // else a.setColor(1, 0, 0);
      a.normals = normals;
      partModels[assem.id()] = a;
      return a;
    }

    function cacheId() {
      return object.getRoot ? object.getRoot().id() : undefined;
    }

    let cabinetModel, lastHash;
    function buildObject(options) {
      if (lastHash === instance.object().hash()) {
        return CabinetModel.get(this.object());
      }
      options ||= {};
      const cId = cacheId();
      if (cId) {
        FunctionCache.on('sme');
        FunctionCache.on(cId);
      }

      buildHiddenPrefixReg();

      const assemblies = instance.object().getParts();
      const root = assemblies[0].getRoot();
      cabinetModel = new CabinetModel(root);
      let a;
      partMap = {};
      for (let index = 0; index < assemblies.length; index += 1) {
        const assem = assemblies[index];
        if ((typeof assem.partName) !== 'function') {
          console.log('here')
        }
        partMap[assem.id()] = {path: assem.path(), code: assem.partCode(), name: assem.partName()};
        if (assem.partName().indexOf('Bottom') !== -1) {
          console.log('here')
        }
        const b = buildModel(assem);
        cabinetModel.add(assem, b);
        if (!hidden(assem)) {
          const c = assem.position().center();
          if (a === undefined) a = b;
          else if (b && b.polygons.length !== 0) {
            a = a.union(b);
          }
          if (assem.partName() === targetPartName) {
            lm = b.clone();
            const lastModel = this.lastModel();
            lastModelUpdateEvent.trigger(undefined, lastModel);
          }
        }
      }
      a.center({x:0,y:0,z:0});
      cabinetModel.complexModel(a);
      if (cId) {
        FunctionCache.off(cId);
        FunctionCache.off('sme');
      }
      lastHash = instance.object().hash();
      return cabinetModel;
    }
    this.buildObject = buildObject;

    function renderParts() {
      let model = new CSG();
      instance.buildObject();
      const assems = instance.object().getParts();
      for (let index = 0; index < assems.length; index++) {
        const partModel = partModels[assems[index].id()];
        if (partModel === undefined) throw new Error('part model not created... object is not being updated properly');
        const c = partModel.center();
        let e = 1.5;
        partModel.center({x: c.x * e, y: c.y, z: e*c.z});
        model = model.union(partModel);
      }
      ThreeDModel.display(model);
    }
    this.renderParts = renderParts;

    this.render = function (options) {
      const startTime = new Date().getTime();
      instance.buildObject();
      if (cabinetModel.complexModel()) {
        let displayModel = cabinetModel.complexModel();//a.simple ? a.simple : a;
        console.log(`Precalculations - ${(startTime - new Date().getTime()) / 1000}`);
        extraObjects.forEach(obj => displayModel.polygons.concatInPlace(obj.polygons));
        ThreeDModel.display(displayModel);
        lastRendered = cabinetModel;
        renderObjectUpdateEvent.trigger(undefined, lastRendered);
        console.log(`Rendering - ${(startTime - new Date().getTime()) / 1000}`);
      }
    }

    this.update = (force) => {
      const rId = renderId = String.random();
      // ThreeDModel.renderId = renderId;
      setTimeout(() => {
        if(renderId === rId) instance.render();
      }, 250);
    };
  }
}

function centerOnObj(x,y,z) {
  const model = ThreeDModel.lastActive.lastModel();
  const center = new Vertex3D(model.center());
  center.x += 200 * y;
  center.y += -200 * x;
  center.z += 100;
  const rotation = {x: x*90, y: y*90, z: z*90};
  // const rotation = {x: 0, y: 0, z: 0};

  return [center, rotation];
}

let viewer;
let viewerSelector = '#three-d-model';
let viewerSize = '60vh';
ThreeDModel.setViewerSelector = (selector, size) => {
  viewerSelector = selector;
  viewerSize = size || viewerSize;
  viewer = undefined;
}

ThreeDModel.getViewer = (model) => {
  if (viewer) return viewer;
  const canvas = du.find(viewerSelector);
  if (canvas) {
    const size = du.convertCssUnit(viewerSize);
    if (model === undefined) return undefined;
    viewer = new Viewer(model, size, size, 50);
    addViewer(viewer, viewerSelector);
    const orientArrows = new OrientationArrows(`${viewerSelector} .orientation-controls`);
    orientArrows.on.center(() =>
      viewer.viewFrom(...centerOnObj(0,0, 0)));
    orientArrows.on.up(() =>
      viewer.viewFrom(...centerOnObj(1, 0,0)));
    orientArrows.on.down(() =>
      viewer.viewFrom(...centerOnObj(-1,0,0)));
    orientArrows.on.left(() =>
      viewer.viewFrom(...centerOnObj(0,-1,0)));
    orientArrows.on.right(() =>
      viewer.viewFrom(...centerOnObj(0,1,0)));
  }
  return viewer;
}

ThreeDModel.models = {};
ThreeDModel.get = (object) => {
  if (object === undefined) return ThreeDModel.lastActive;
  if (Array.isArray(object)) return new GroupThreeDModel(object);
  if (ThreeDModel.models[object.id()] === undefined) {
    ThreeDModel.models[object.id()] = new ThreeDModel(object);
  }
  return ThreeDModel.models[object.id()];
}

function render(partOs) {
  ThreeDModel.get(partOs).render();
}

ThreeDModel.render = (partOs, options) => {
  const renderId = String.random();
  ThreeDModel.renderId = renderId;
  setTimeout(() => {
    if(ThreeDModel.renderId === renderId) {
      render(partOs, options);
    }
  }, 2500);
};

ThreeDModel.display = (displayModel) => {
  ThreeDModel.getViewer(displayModel);
  viewer.mesh = displayModel.toMesh();
  viewer.gl.ondraw();
}

ThreeDModel.renderNow = async (parts, options) => {
  if (options && options.parts) {
    ThreeDModel.get(parts).renderParts(options);
  } else {
    ThreeDModel.get(parts).render(options);
  }
}

class GroupThreeDModel extends ThreeDModel{
  constructor(parts) {
    super(parts);
    let lastModel;
    this.lastModel = () => lastModel;
    this.buildObject = () => {
      let combined = new CSG();
      const origin = {x:0,y:0,z:0};
      for (let index = 0; index < parts.length; index++) {
        const part = parts[index];
        const model = ThreeDModel.get(part).buildObject();
        const complexModel = model.complexModel();
        complexModel.center(origin);
        const rotation = part.position().rotation();
        rotation.y *= -1;// I think this is because the Y axis is inverted...
        complexModel.rotate(rotation);
        complexModel.center(part.position().center());
        combined = combined.union(complexModel);
      }
      combined.center(origin);
      return combined;
    }
    this.render = () => {
      lastModel = this.buildObject();
      ThreeDModel.lastActive = this;
      if (lastModel.polygons && lastModel.polygons.length > 0) {
        ThreeDModel.display(lastModel);
      }
    }
  }
}

const lastModelUpdateEvent = new CustomEvent('lastModelUpdate');
ThreeDModel.onLastModelUpdate = (func) => lastModelUpdateEvent.on(func);

const renderObjectUpdateEvent = new CustomEvent('renderObjectUpdate');
ThreeDModel.onRenderObjectUpdate = (func) => renderObjectUpdateEvent.on(func);


module.exports = ThreeDModel
