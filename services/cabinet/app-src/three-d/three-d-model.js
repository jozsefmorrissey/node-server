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

function Validation() {
  types = {};
  types.int = '^[0-9]{1,}$';
  types.float = `^((\\.[0-9]{1,})|([0-9]{1,}\\.[0-9]{1,}))$|(${types.int})`;
  types.fraction = '^[0-9]{1,}/[0-9]{1,}$';
  types.size = `(${types.float})|(${types.fraction})`;


  let obj = {};
  Object.keys(types).forEach((type) => {
    const regex = new RegExp(types[type]);
    obj[type] = (min, max) => {
      min = Number.isFinite(min) ? min : Number.MIN_SAFE_INTEGER;
      max = Number.isFinite(max) ? max : Number.MAX_SAFE_INTEGER;
      return (value) => {
        if ((typeof value) === 'string') {
          if (value.match(regex) === null) return false;
          value = Number.parseFloat(value);
        }
        return value > min && value < max;
      }
    }

  });
  return obj;
}
Validation = Validation();


class ThreeDModel {
  constructor(assembly) {
    const hiddenPartCodes = {};
    const hiddenPartNames = {};
    const hiddenPrefixes = {};
    const instance = this;
    let hiddenPrefixReg;
    let inclusiveTarget = {};

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
          return part.partName.match(inclusiveTarget.prefixReg) !== null;
          break;
        case 'part-name':
          return part.partName === inclusiveTarget.value;
        case 'part-code':
          return part.partCode === inclusiveTarget.value;
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

    function hidden(part) {
      const im = inclusiveMatch(part);
      if (im !== null) return !im;
      if (instance.hidePartCode(part.partCode)) return true;
      if (instance.hidePartName(part.partName)) return true;
      if (hiddenPrefixReg && part.partName.match(hiddenPrefixReg)) return true;
      return false;
    }

    function coloring(part) {
      if (part.partName && part.partName.match(/.*Frame.*/)) return getColor('blue');
      else if (part.partName && part.partName.match(/.*Drawer.Box.*/)) return getColor('green');
      else if (part.partName && part.partName.match(/.*Pull.*/)) return getColor('silver');
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
      } else if (assem instanceof Pull) {
        model = pull(pos.demension.y, pos.demension.z);
      } else {
        const radius = [pos.demension.x / 2, pos.demension.y / 2, pos.demension.z / 2];
        model = CSG.cube({ radius });
      }
      model.rotate(pos.rotation);
      pos.center.z *= -1;
      model.center(pos.center);
      return model;
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
      const assemblies = assembly.getParts();
      let a;
      for (let index = 0; index < assemblies.length; index += 1) {
        const assem = assemblies[index];
        if (!hidden(assem)) {
          const b = buildObject(assem);
          if (a === undefined) a = b;
          else if (b && assem.length() && assem.width() && assem.thickness()) {
            a = a.union(b);
          }
        }
      }
      console.log(`Precalculations - ${(startTime - new Date().getTime()) / 1000}`);
      ThreeDModel.viewer.mesh = a.toMesh();
      ThreeDModel.viewer.gl.ondraw();
      console.log(`Rendering - ${(startTime - new Date().getTime()) / 1000}`);
    }
  }
}
const cube = new CSG.cube({radius: [3,5,1]});
ThreeDModel.init = () => {
  const p = pull(5,2);
  const db = drawerBox(10, 15, 22);
  ThreeDModel.viewer = new Viewer(db, 300, 150, 50);
  addViewer(ThreeDModel.viewer, 'three-d-model');
}

ThreeDModel.models = {};
ThreeDModel.get = (assembly) => {
  if (ThreeDModel.models[assembly.uniqueId] === undefined) {
    ThreeDModel.models[assembly.uniqueId] = new ThreeDModel(assembly);
  }
  return ThreeDModel.models[assembly.uniqueId];
}
ThreeDModel.render = (part) => ThreeDModel.get(part).render();



function displayPart(part) {
  return true;
}

function groupParts(cabinet) {
  const grouping = {displayPart, group: {groups: {}, parts: {}}};
  const parts = cabinet.getParts();
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const namePieces = part.partName.split('.');
    let currObj = grouping.group;
    let prefix = '';
    for (let nIndex = 0; nIndex < namePieces.length - 1; nIndex += 1) {
      const piece = namePieces[nIndex];
      prefix += piece;
      if (currObj.groups[piece] === undefined) currObj.groups[piece] = {groups: {}, parts: []};
      currObj = currObj.groups[piece];
      currObj.prefix = prefix;
      prefix += '.'
    }
    if (currObj.parts[part.partName] === undefined) currObj.parts[part.partName] = [];
    currObj.parts[part.partName].push(part);
  }
  return grouping;
}

const modelContTemplate = new $t('model-controller')
const stateReg = /( |^)(small|large)( |$)/;
matchRun('click', '#max-min-btn', (target) => {
  const className = target.parentElement.className;
  const controller = document.getElementById('model-controller');
  const state = className.match(stateReg);
  const clean = className.replace(new RegExp(stateReg, 'g'), '').trim();
  if (state[2] === 'small') {
    target.parentElement.className = `${clean} large`;
    const cabinet = roomDisplay.cabinet();
    if (cabinet) {
      const grouping = groupParts(cabinet);
      grouping.tdm = ThreeDModel.get(cabinet);
      controller.innerHTML = modelContTemplate.render(grouping);
    }
    controller.hidden = false;
  } else {
    target.parentElement.className = `${clean} small`;
    controller.hidden = true;
  }
});


matchRun('click', '.model-label', (target) => {
  if (event.target.tagName === 'INPUT') return;
  const has = hasClass(target, 'active');
  document.querySelectorAll('.model-label')
    .forEach((elem) => removeClass(elem, 'active'))
  !has ? addClass(target, 'active') : removeClass(target, 'active');
  let label = target.children[0]
  let type = label.getAttribute('type');
  let value = type !== 'prefix' ? label.innerText :
        label.nextElementSibling.getAttribute('prefix');
  const cabinet = roomDisplay.cabinet();
  const tdm = ThreeDModel.get(cabinet);
  tdm.inclusiveTarget(type, has ? undefined : value);
  tdm.render();
});

matchRun('click', '.prefix-switch', (target, event) => {
  const eventTarg = event.target;
  const active = upAll('.model-selector', target);
  active.push(target.parentElement.parentElement);
  const all = document.querySelectorAll('.prefix-body');
  all.forEach((pb) => pb.hidden = true);
  active.forEach((ms) => ms.children[0].children[1].hidden = false);
});

matchRun('change', '.prefix-checkbox', (target) => {
  const cabinet = roomDisplay.cabinet();
  const attr = target.getAttribute('prefix');
  ThreeDModel.get(cabinet).hidePrefix(attr, !target.checked);
});

matchRun('change', '.part-name-checkbox', (target) => {
  const cabinet = roomDisplay.cabinet();
  const attr = target.getAttribute('part-name');
  ThreeDModel.get(cabinet).hidePartName(attr, !target.checked);
});

matchRun('change', '.part-code-checkbox', (target) => {
  const cabinet = roomDisplay.cabinet();
  const attr = target.getAttribute('part-code');
  ThreeDModel.get(cabinet).hidePartCode(attr, !target.checked);
})


function updateModel(part) {
  const cabinet = part.getAssembly('c');
  ThreeDModel.render(cabinet);
}
