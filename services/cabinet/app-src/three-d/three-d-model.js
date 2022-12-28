

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

    const polyTol = .01;
    const polyToleranceMap = new ToleranceMap({'i': polyTol,'j': polyTol,'k': polyTol, length: .0001});
    function create2DcabinetImage(model) {
      // for (let index = 0; index < model.polygons.length; index++) {
      //   const poly = model.polygons[index];
      //   const vector = poly.center.minus(model.center).unit();
      //   vector.polygon = poly;
      //   polyToleranceMap.add(vector);
      // }
      // const maxList = polyToleranceMap.maxSet().map(v => Polygon3D.fromCSG(v.polygon));
      let polygons = model.cabinetOnly ? model.cabinetOnly.polygons : model.polygons;
      const polys = Polygon3D.fromCSG(polygons);
      model.threeView = Polygon3D.toTwoD(polys);
      model.threeView.front = Polygon2d.outline(model.threeView.front).lines();
      model.threeView.right = Polygon2d.outline(model.threeView.right).lines();
      const topPoly2d = Polygon2d.outline(model.threeView.top);
      model.threeView.top = topPoly2d.lines();

      const frontMinMax = Vertex2d.minMax(Line2d.vertices(model.threeView.front));
      const height = frontMinMax.diff.y();
      const width = frontMinMax.diff.x();
      const depth = Vertex2d.minMax(Line2d.vertices(model.threeView.right)).diff.x();
      const topPoly = Polygon3D.from2D(topPoly2d);
      topPoly.rotate({x:90,y:0,z:0});
      model.cabinetSolid = BiPolygon.fromPolygon(topPoly, 0, height);
      model.cabinetSolid.center(model.center);
      model.simple = model.cabinetSolid.toModel();
      const defualtCube = CSG.cube({demesions: [width, height, depth], center: [model.center.x, model.center.y, model.center.z]});
      if (model.frontsOnly) model.simple = model.simple.union(model.frontsOnly);
      return model;
    }

    function addModelAttrs(model) {
      const max = new Vertex3D(Number.MIN_SAFE_INTEGER,Number.MIN_SAFE_INTEGER,Number.MIN_SAFE_INTEGER);
      const min = new Vertex3D(Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER);
      for (let index = 0; index < model.polygons.length; index++) {
        const poly = model.polygons[index];
        const verts = poly.vertices;
        const targetAttrs = {'pos.x': 'x', 'pos.y': 'y', 'pos.z': 'z'};
        const midrangePoint = Math.midrange(poly.vertices, targetAttrs);
        poly.center = new Vertex3D(midrangePoint);
        poly.plane = new Plane(...verts.slice(0,3).map(v =>v.pos));
      }
      const targetAttrs = {'center.x': 'x', 'center.y': 'y', 'center.z': 'z'};
      model.center = new Vertex3D(Math.midrange(model.polygons, targetAttrs));
      model.max = max;
      model.min = min;
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
      const root = assemblies[0].getRoot();
      let a, cabinetOnly, frontsOnly;
      partMap = {};
      for (let index = 0; index < assemblies.length; index += 1) {
        const assem = assemblies[index];
        partMap[assem.id()] = {path: assem.path(), code: assem.partCode(), name: assem.partName()};
        if (!hidden(assem)) {
          const b = buildObject(assem);
          // const c = assem.position().center();
          // b.center({x: approximate(c.x * e), y: approximate(c.y * e), z: approximate(-c.z * e)});
          if (cabinetOnly === undefined && root.children().indexOf(assem) === -1) {
            cabinetOnly = a;
          }
          if (cabinetOnly && assem.inElivation) {
            if (frontsOnly === undefined) frontsOnly = b;
            else frontsOnly = frontsOnly.union(b);
          }
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
      a.cabinetOnly = cabinetOnly;
      a.frontsOnly = frontsOnly;
      if (a && ThreeDModel.getViewer(a)) {
        addModelAttrs(a);
        create2DcabinetImage(a);
        const displayModel = a;//a.simple ? a.simple : a;
        console.log(`Precalculations - ${(startTime - new Date().getTime()) / 1000}`);
        // centerModel(displayModel);
        viewer.mesh = displayModel.toMesh();
        viewer.gl.ondraw();
        lastRendered = a;
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

const renderObjectUpdateEvent = new CustomEvent('renderObjectUpdate');
ThreeDModel.onRenderObjectUpdate = (func) => renderObjectUpdateEvent.on(func);


module.exports = ThreeDModel
