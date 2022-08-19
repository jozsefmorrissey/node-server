

const CSG = require('../../public/js/3d-modeling/csg');

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
const approximate = require('../../../../public/js/utils/approximate.js');

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

function getColor(name) {
  if(colors[name]) return colors[name];
  return [0,0,0];
}

class ThreeDModel {
  constructor(assembly, viewer) {
    const hiddenPartCodes = {};
    const hiddenPartNames = {};
    const hiddenPrefixes = {};
    const instance = this;
    let hiddenPrefixReg;
    let inclusiveTarget = {};
    let partMap;
    let renderId;
    let targetPartCode;
    this.setTargetPartCode = (pc) => targetPartCode = pc;

    this.assembly = (a) => {
      if (a !== undefined) {
        assembly = a;
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
        case 'part-code':
          return part.partCode() === inclusiveTarget.value;
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

    this.hidePartCode = manageHidden(hiddenPartCodes);
    this.hidePartName = manageHidden(hiddenPartNames);
    this.hidePrefix = manageHidden(hiddenPrefixes);

    function hasHidden(hiddenObj) {
      const keys = Object.keys(hiddenObj);
      for(let i = 0; i < hiddenObj.length; i += 1)
        if (hidden[keys[index]])return true;
      return false;
    }
    this.noneHidden = () => !hasHidden(hiddenPartCodes) &&
        !hasHidden(hiddenPartNames) && !hasHidden(hiddenPrefixes);

    this.depth = (label) => label.split('.').length - 1;

    function hidden(part, level) {
      const im = inclusiveMatch(part);
      if (im !== null) return !im;
      if (instance.hidePartCode(part.partCode())) return true;
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

    function getModel(assem) {
      const pos = assem.position().current();
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
        const norm = p.plane.normal;
        const verticies = p.vertices.map((v) => ({x: v.pos.x, y: v.pos.y, z: v.pos.z}));
        polys.push(new Polygon3D(norm, verticies));
      });
      // Polygon3D.merge(polys);
      const twoDpolys = Polygon3D.toTwoD(polys);
      return twoDpolys;
    }


    this.render = function () {
      const startTime = new Date().getTime();
      buildHiddenPrefixReg();
      function buildObject(assem) {
        let a = getModel(assem);
        a.setColor(...debugColoring(assem));
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
        partMap[assem.partCode()] = assem.path();
        if (assem.partCode() === 'pr') {
          console.log(assem.getAssembly('c').uniqueId());
        } else {
          console.log(assem.getAssembly('c').uniqueId());
        }
        if (!hidden(assem)) {
          const b = buildObject(assem);
          const e=1.1;
          const c = assem.position().center();
          b.center({x: approximate(c.x * e), y: approximate(c.y * e), z: approximate(-c.z * e)});
          if (a === undefined) a = b;
          else if (b && assem.length() && assem.width() && assem.thickness()) {
            a = a.union(b);
          }
          if (assem.partCode() === targetPartCode) {
            lm = b;
          }
        }
      }
      if (a) {
        console.log(`Precalculations - ${(startTime - new Date().getTime()) / 1000}`);
        viewer.mesh = a.toMesh();
        viewer.gl.ondraw();
        console.log(`Rendering - ${(startTime - new Date().getTime()) / 1000}`);
      }
    }

    this.update = (part) => {
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
  if (ThreeDModel.models[assembly.uniqueId()] === undefined) {
    ThreeDModel.models[assembly.uniqueId()] = new ThreeDModel(assembly, viewer);
  }
  return ThreeDModel.models[assembly.uniqueId()];
}
ThreeDModel.render = (part) => {
  const renderId = String.random();
  ThreeDModel.renderId = renderId;
  setTimeout(() => {
    if(ThreeDModel.renderId === renderId) ThreeDModel.get(part).render();
  }, 250);
};

module.exports = ThreeDModel
