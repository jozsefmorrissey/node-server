

const CSG = require('../../public/js/3d-modeling/csg');

const du = require('../../../../public/js/utils/dom-utils.js');
const $t = require('../../../../public/js/utils/$t.js');
const FunctionCache = require('../../../../public/js/utils/services/function-cache.js');

const Polygon3D = require('./objects/polygon');
const BiPolygon = require('./objects/bi-polygon');
const Polygon2d = require('../two-d/objects/polygon');
const Line2d = require('../two-d/objects/line');
const Vertex2d = require('../two-d/objects/vertex');
const Vertex3D = require('./objects/vertex');
const Vector3D = require('./objects/vector');
const Line3D = require('./objects/line');
const Plane = require('./objects/plane');
const CustomEvent = require('../../../../public/js/utils/custom-event.js');
const OrientationArrows = require('../displays/orientation-arrows.js');
const Viewer = require('../../public/js/3d-modeling/viewer.js').Viewer;
const addViewer = require('../../public/js/3d-modeling/viewer.js').addViewer;
const ToleranceMap = require('../../../../public/js/utils/tolerance-map.js');
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
  constructor(assembly) {
    const hiddenPartIds = {};
    const hiddenPartNames = {};
    const hiddenPrefixes = {};
    const instance = this;
    let hiddenPrefixReg;
    let extraObjects = [];
    let inclusiveTarget = {};
    let partMap;
    let renderId;
    let targetPartName;
    let lastRendered;
    let rootAssembly = assembly.getRoot();
    this.setTargetPartName = (id) => targetPartName = id;
    this.getLastRendered = () => lastRendered;

    this.assembly = (a) => {
      if (a !== undefined) {
        assembly = a;
        rootAssembly = a.getRoot();
      }
      return assembly;
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
      // xzFootprint = Polygon2d.lines(...twoDmap.xz);
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

    let cabinetModel;
    this.render = function () {
      ThreeDModel.lastActive = this;
      const cacheId = rootAssembly.id();
      FunctionCache.on('sme');

      const startTime = new Date().getTime();
      buildHiddenPrefixReg();
      function buildObject(assem) {
        let a = assem.toModel();
        if (a === undefined) {
          console.log('coooooommmmmmmmooooonnn')
          assem.toModel();
        }
        let normals = a.normals;
        // const c = assem.position().center();
        const e=1;
        // a.center({x: c.x * e, y: c.y * e, z: -c.z * e});
        a.setColor(...getColor());
        assem.getJoints().female.forEach((joint) => {
          const male = joint.getMale();
          const m = male.toModel();
          a = a.subtract(m);
        });
        // else a.setColor(1, 0, 0);
        a.normals = normals;
        return a;
      }
      const assemblies = this.assembly().getParts();
      const root = assemblies[0].getRoot();
      cabinetModel = new CabinetModel(root);
      let a;
      partMap = {};
      for (let index = 0; index < assemblies.length; index += 1) {
        const assem = assemblies[index];
        partMap[assem.id()] = {path: assem.path(), code: assem.partCode(), name: assem.partName()};
        if (!hidden(assem)) {
          const b = buildObject(assem);
          cabinetModel.add(assem, b);
          // const c = assem.position().center();
          // b.center({x: approximate(c.x * e), y: approximate(c.y * e), z: approximate(-c.z * e)});
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
      cabinetModel.complexModel(a);
      if (a && ThreeDModel.getViewer(a)) {
        let displayModel = cabinetModel.complexModel();//a.simple ? a.simple : a;
        console.log(`Precalculations - ${(startTime - new Date().getTime()) / 1000}`);
        // centerModel(displayModel);
        extraObjects.forEach(obj => displayModel = displayModel.union(obj));
        displayModel = displayModel.union(CSG.axis());
        viewer.mesh = displayModel.toMesh();
        viewer.gl.ondraw();
        lastRendered = cabinetModel;
        renderObjectUpdateEvent.trigger(undefined, lastRendered);
        console.log(`Rendering - ${(startTime - new Date().getTime()) / 1000}`);
      }
      // FunctionCache.off(cacheId);
      FunctionCache.off('sme');
    }

    this.update = () => {
      const rId = renderId = String.random();
      ThreeDModel.renderId = renderId;
      setTimeout(() => {
        if(renderId === rId) instance.render();
      }, 250);
    };
  }
}

function centerOnObj(x,y,z) {
  const model = ThreeDModel.lastActive.getLastRendered().complexModel();
  const center = model.center.copy();
  center.x += 200 * y;
  center.y += -200 * x;
  center.z += 100;
  const rotation = {x: x*90, y: y*90, z: z*90};

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
ThreeDModel.get = (assembly) => {
  if (assembly === undefined) return ThreeDModel.lastActive;
  if (ThreeDModel.models[assembly.id()] === undefined) {
    ThreeDModel.models[assembly.id()] = new ThreeDModel(assembly);
  }
  return ThreeDModel.models[assembly.id()];
}
ThreeDModel.render = (part) => {
  const renderId = String.random();
  ThreeDModel.renderId = renderId;
  setTimeout(() => {
    if(ThreeDModel.renderId === renderId) {
      const cacheId = part.getRoot().id();
      FunctionCache.on(cacheId);
      ThreeDModel.get(part).render();
      FunctionCache.off(cacheId);
    }
  }, 2500);
};

const lastModelUpdateEvent = new CustomEvent('lastModelUpdate');
ThreeDModel.onLastModelUpdate = (func) => lastModelUpdateEvent.on(func);

const renderObjectUpdateEvent = new CustomEvent('renderObjectUpdate');
ThreeDModel.onRenderObjectUpdate = (func) => renderObjectUpdateEvent.on(func);


module.exports = ThreeDModel
