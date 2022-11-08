

const CSG = require('../../public/js/3d-modeling/csg');

const FunctionCache = require('../../../../public/js/utils/services/function-cache.js');
const Polygon3D = require('./objects/polygon');
const Assembly = require('../objects/assembly/assembly');
const Handle = require('../objects/assembly/assemblies/hardware/pull.js');
const DrawerBox = require('../objects/assembly/assemblies/drawer/drawer-box.js');
const pull = require('./models/pull.js');
const drawerBox = require('./models/drawer-box.js');
const Viewer = require('../../public/js/3d-modeling/viewer.js').Viewer;
const addViewer = require('../../public/js/3d-modeling/viewer.js').addViewer;
const du = require('../../../../public/js/utils/dom-utils.js');
const $t = require('../../../../public/js/utils/$t.js');
const CustomEvent = require('../../../../public/js/utils/custom-event.js');

const colors = {
  indianred: [205, 92, 92],
  lightcoral: [240, 128, 128],
  salmon: [250, 128, 114],
  darksalmon: [233, 150, 122],
  lightsalmon: [255, 160, 122],
  white: [255, 255, 255],
  silver: [192, 192, 192],
  gray: [128, 128, 128],
  black: [0, 0, 0],
  red: [255, 0, 0],
  maroon: [128, 0, 0],
  yellow: [255, 255, 0],
  olive: [128, 128, 0],
  lime: [0, 255, 0],
  green: [0, 128, 0],
  aqua: [0, 255, 255],
  teal: [0, 128, 128],
  blue: [0, 0, 255],
  navy: [0, 0, 128],
  fuchsia: [255, 0, 255],
  purple: [128, 0, 128]
}

const colorChoices = Object.keys(colors);
function getColor(name) {
  if(colors[name]) return colors[name];
  return colors[colorChoices[Math.floor(Math.random() * colorChoices.length)]];
}

class ThreeDModel {
  constructor(assembly, viewer) {
    const lastModelUpdateEvent = new CustomEvent('lastModelUpdate');
    const hiddenPartIds = {};
    const hiddenPartNames = {};
    const hiddenPrefixes = {};
    const instance = this;
    let hiddenPrefixReg;
    let extraObjects = [];
    let inclusiveTarget = {};
    let partMap;
    let renderId;
    let targetPartCode;
    let rootAssembly = assembly.getRoot();
    this.setTargetPartCode = (id) => targetPartCode = id;

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
      center.z *= -1;
      const vertex = CSG.sphere({center, radius});
      vertex.setColor(getColor(color));
      extraObjects.push(vertex);
    }

    this.removeAllExtraObjects = () => extraObjects = [];

    function getModel(assem) {
      const pos = assem.position().current();
      if (pos.rotation.x % 45 !== 0 || pos.rotation.y % 45 !== 0 || pos.rotation.z % 45 !== 0) {
        console.log('position off')
      }
      let model;
      if (assem instanceof DrawerBox) {
        model = drawerBox(pos.demension.y, pos.demension.x, pos.demension.z);
      } else if (assem instanceof Handle) {
        model = pull(pos.demension.y, pos.demension.z);
      } else {
        const radius = [pos.demension.x / 2, pos.demension.y / 2, pos.demension.z / 2];
        model = CSG.cube({ radius });
      }
      model.rotate(pos.rotation);
      pos.center.z *= -1;
      model.center(pos.center);
      // serialize({}, model);
      return model;
    }

    let lm;
    this.lastModel = () => {
      if (lm === undefined) return undefined;
      const polys = [];
      const map = {xy: [], xz: [], zy: []};
      lm.polygons.forEach((p, index) => {
        const norm = p.vertices[0].normal;
        const verticies = p.vertices.map((v) => ({x: v.pos.x, y: v.pos.y, z: v.pos.z}));
        polys.push(new Polygon3D(verticies));
      });
      // Polygon3D.merge(polys);
      const twoDpolys = Polygon3D.toTwoD(polys);
      return twoDpolys;
    }

    this.onLastModelUpdate = (func) => lastModelUpdateEvent.on(func);

    this.render = function () {
      ThreeDModel.lastActive = this;
      const cacheId = rootAssembly.id();
      // FunctionCache.on(cacheId);
      FunctionCache.on('sme');

      const startTime = new Date().getTime();
      buildHiddenPrefixReg();
      function buildObject(assem) {
        let a = getModel(assem);
        const c = assem.position().center();
        const e=1;
        a.center({x: c.x * e, y: c.y * e, z: -c.z * e});
        a.setColor(...getColor());
        assem.getJoints().female.forEach((joint) => {
          const male = joint.getMale();
          const m = getModel(male, male.position().current());
          a = a.subtract(m);
        });
        // else a.setColor(1, 0, 0);
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
          if (assem.partCode() === targetPartCode) {
            lm = b.clone();
            const rotation = assem.position().rotation();
            rotation.x *=-1;
            rotation.y = (360 - rotation.y)  % 360;
            rotation.z *=-1;
            lm.center({x:0,y:0,z:0})
            lm.rotate(rotation);
            const lastModel = this.lastModel();
            lastModelUpdateEvent.trigger(undefined, lastModel);
          }
        }
      }
      for (let index = 0; index < extraObjects.length; index++) {
        a = a.union(extraObjects[index]);
      }
      if (a) {
        // a.polygons.forEach((p) => p.shared = getColor());
        console.log(`Precalculations - ${(startTime - new Date().getTime()) / 1000}`);
        viewer.mesh = a.toMesh();
        viewer.gl.ondraw();
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

ThreeDModel.models = {};
ThreeDModel.get = (assembly, viewer) => {
  if (assembly === undefined) return ThreeDModel.lastActive;
  if (ThreeDModel.models[assembly.id()] === undefined) {
    ThreeDModel.models[assembly.id()] = new ThreeDModel(assembly, viewer);
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

module.exports = ThreeDModel
