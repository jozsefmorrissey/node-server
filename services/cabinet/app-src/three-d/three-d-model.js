

const CSG = require('../../public/js/3d-modeling/csg');

const du = require('../../../../public/js/utils/dom-utils.js');
const $t = require('../../../../public/js/utils/$t.js');
const FunctionCache = require('../../../../public/js/utils/services/function-cache.js');

const Polygon3D = require('./objects/polygon');
const Polygon2d = require('../two-d/objects/polygon');
const Vertex3D = require('./objects/vertex');
const Vector3D = require('./objects/vector');
const Line3D = require('./objects/line');
const Plane = require('./objects/plane');
const CustomEvent = require('../../../../public/js/utils/custom-event.js');
const OrientationArrows = require('../displays/orientation-arrows.js');
const Viewer = require('../../public/js/3d-modeling/viewer.js').Viewer;
const addViewer = require('../../public/js/3d-modeling/viewer.js').addViewer;
const ToleranceMap = require('../../../../public/js/utils/tolerance-map.js');

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

    function distance(verts) {
      let dist = 0;
      for (let index = 1; index < verts.length; index++) {
        dist += verts[index -1].distance(verts[index]);
      }
      return dist;
    }

    function toTwoDpolys(model) {
      if (model === undefined) return undefined;
      if (model.threeView) return model;
      const polys = Polygon3D.fromCSG(model.polygons);
      polys.normals = model.normals;
      Polygon3D.merge(polys);
      const twoDpolys = Polygon3D.toTwoD(polys, polys.normals);
      model.threeView = twoDpolys;
      return model;
    }

    let lm;
    this.lastModel = () => toTwoDpolys(lm);

    const topVector = new Vector3D(0,-1,0);


    const polyToleranceMap = new ToleranceMap({'vector.i': .1,'vector.j': .1,'vector.k': .1, length: .0001});
    function create2DcabinetImage(model) {
      model.threeView = Polygon3D.toTwoD(Polygon3D.fromCSG(model.polygons));
      model.threeView.front = Polygon2d.outline(model.threeView.front).lines();
      model.threeView.right = Polygon2d.outline(model.threeView.right).lines();
      model.threeView.top = Polygon2d.outline(model.threeView.top).lines();
      return model;
    }

    function addModelAttrs(model) {
      const max = new Vertex3D(Number.MIN_SAFE_INTEGER,Number.MIN_SAFE_INTEGER,Number.MIN_SAFE_INTEGER);
      const min = new Vertex3D(Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER);
      for (let index = 0; index < model.polygons.length; index++) {
        const poly = model.polygons[index];

        const verts = poly.vertices;
        const vs = [];
        for (let vIndex = 0; vIndex < verts.length; vIndex++) {
          const v = verts[vIndex].pos;
          if (v.x > max.x) max.x = v.x;
          if (v.x < min.x) min.x = v.x;
          if (v.y > max.y) max.y = v.y;
          if (v.y < min.y) min.y = v.y;
          if (v.z > max.z) max.z = v.z;
          if (v.z < min.z) min.z = v.z;
          vs[vIndex] = v;
        }
        poly.center = Vertex3D.center(vs);
        poly.plane = new Plane(vs[0], vs[1], vs[2]);
      }
      model.center = Vertex3D.center(max, min);
      model.max = max;
      model.min = min;

      create2DcabinetImage(model);
    }

    this.render = function () {
      ThreeDModel.lastActive = this;
      const cacheId = rootAssembly.id();
      // FunctionCache.on(cacheId);
      FunctionCache.on('sme');

      const startTime = new Date().getTime();
      buildHiddenPrefixReg();
      function buildObject(assem) {
        let a = assem.toModel();
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
      let a;
      partMap = {};
      for (let index = 0; index < assemblies.length; index += 1) {
        const assem = assemblies[index];
        partMap[assem.id()] = {path: assem.path(), code: assem.partCode(), name: assem.partName()};
        if (!hidden(assem)) {
          const b = buildObject(assem);
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
      if (a && ThreeDModel.getViewer(a)) {
        // a.polygons.forEach((p) => p.shared = getColor());
        console.log(`Precalculations - ${(startTime - new Date().getTime()) / 1000}`);
        addModelAttrs(a);
        // createXZfootprint(a, assemblies[0].getAssembly('c'));
        // extraObjects = [];
        // xzFootprint.polygons.forEach(p => p.vertices.forEach(v => this.addVertex(v.pos)))
        // xzFootprint.polygons = [];
        // for (let index = 0; index < extraObjects.length; index++) {
        //   xzFootprint.polygons.concatInPlace(extraObjects[index].polygons);
        // }
        centerModel(a);
        viewer.mesh = a.toMesh();//a.toMesh();
        viewer.gl.ondraw();
        lastRendered = a;
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
  const model = ThreeDModel.lastActive.getLastRendered();
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

// function updateCanvasSize(canvas) {
//   canvas.style.width = viewerSize;
//   const dem = Math.floor(canvas.getBoundingClientRect().width);
//   canvas.width = dem;
//   canvas.height = dem;
//   canvas.style.width = `${dem}px`;
//   canvas.style.width = `${dem}px`;
// }

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


module.exports = ThreeDModel
