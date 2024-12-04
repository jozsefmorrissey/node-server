
const du = require('../../../public/js/utils/dom-utils');
const Viewer = require('../../../public/js/utils/3d-modeling/viewer.js').Viewer;
const addViewer = require('../../../public/js/utils/3d-modeling/viewer.js').addViewer;
const OrientationArrows = require('../../../public/js/utils/display/orientation-arrows.js');
const SlideShow = require('./slide-show');
const STL = require('../../../public/js/utils/3d-modeling/STL.js');

let lineDisplayType;
let STLs = {};

function updateStlList() {
  const cnt = du.id('stl-list-cnt');
  cnt.innerHTML = Object.values(STLs).map(stl =>
    `<div class='${stl instanceof Error ? 'error': ''}'>${stl.header()}<button class='rm-btn'>X</button></div>`).join('\n');
  display();
}

let cutLetherman = (stls) => {
  const csg = CSG.fromSTL(stls[0])
  const cut = new CSG.cube({radius: [5,6,.5]});
  csg.center({x:0,y:0,z:0});
  cut.center({x:0,y:0,z:0});
  csg.setColor('blue', true);
  cut.setColor('green');
  cut.translate({x:0,y:0,z:-.6});
  cut.polygons.concatInPlace(csg.polygons)
  // stls[0] = cut.toSTL(stls[0].header());
  stls[0] = csg.subtract(cut).toSTL(stls[0].header());
  // stls[0] = cut.intersect(csg).toSTL(stls[0].header());
  // stls[0] = csg.intersect(cut).toSTL(stls[0].header());
}

du.on.match('change', '[name="stlFile"]', async (input) => {
  const stls = await STL.fromFiles(input.files);
  // cutLetherman(stls);
  stls.forEach(stl => !(stl instanceof Error) && (STLs[stl.header().hash()] = stl));
  updateStlList();
  input.value = '';
});

du.on.match('click', '#stl-list-cnt .rm-btn', (rmBtn) => {
  const header = rmBtn.parentElement.innerText.trim().slice(0,-1);
  delete STLs[header.hash()];
  updateStlList();
});

const checkedLineDispSelector = '#display-radios-3d>input:checked';
const setLineDisplayType = () => {
  const selected = du.find(checkedLineDispSelector);
  if (selected) {
    lineDisplayType = CSG.Line.DISPLAY_TYPES[selected.value];
    du.trigger('refresh', du.find('textarea'));
  }
}

setLineDisplayType();
du.on.match('change', checkedLineDispSelector, setLineDisplayType);

du.on.match('change:keyup', '#axis-controls-3d input', (elem) => {
  const radInput = du.find.closest('[name="radius"]', elem);
  const radLenCnt = du.find.closest('.rad-len-cnt', elem);
  if (elem.name === 'include') axis.include = elem.checked;
  else if (elem.name === 'length') axis.length = Number.parseInt(elem.value) || 1;
  else if (elem.name === 'radius') axis.radius(elem.value);
  if (!axis.radius.len) radInput.value = axis.radius();
  du.trigger('refresh', du.find('textarea'));
  radLenCnt.hidden = !axis.include;
});

let viewer;
let viewerSize = '60vh';
const viewerSelector = '#three-d-display';
function getViewer (model) {
  if (viewer) return viewer;
  const canvas = du.find(viewerSelector);
  if (canvas) {
    const size = du.convertCssUnit(viewerSize);
    if (model === undefined) return undefined;
    viewer = new Viewer(model, size, size, 50);
    addViewer(viewer, viewerSelector);
    const orientSelector = `${viewerSelector} .orientation-controls`;
    const orientArrows = OrientationArrows.forCSG(orientSelector, viewer, model);
  }
  return viewer;
}

let axis = {include: true, length: 100,
    radius: (r) => r !== undefined ? (axis.radius.len = r) : axis.radius.len || (axis.length / 100)};
const points = [[0,1,0], [0,2,0],[1,3,0],[2,3,0],[3,2,0],[3,1,0],[2,0,0],[1,0,0]];
let model;
viewer = getViewer(model);

const intRegStr = '\\s*([0-9]{1,})\\s*'
const numberRegStr = '\\s*((-|)[0-9]{1,}(|\\.[0-9]*)|(-|)(|\\.[0-9]*))\\s*';
const colorRegStr = `(^[a-z]*\\s*$)|(^${intRegStr},${intRegStr},${intRegStr}$)`;
const prefixRegStr = '([a-zA-Z]*\\s*|[ 0-9.,]{5,}\\s*|\\s*)';
const pointRegStr = `\\s*${prefixRegStr}\\(${numberRegStr},${numberRegStr},${numberRegStr}\\)\\s*`;
const lineRegStr = `${prefixRegStr}((\\[|\\()(${pointRegStr}),(${pointRegStr}))((\\]|\\)))`;
const polyRegStr = `${prefixRegStr}\\[((${pointRegStr},){2,}${pointRegStr})\\]`;
const planeRegStr = `${prefixRegStr}\\(((${pointRegStr},){2,}${pointRegStr})\\)`;

let colorReg = new RegExp(colorRegStr);
let pointReg = new RegExp(pointRegStr);
let pointsReg = new RegExp(pointRegStr, 'g');
let lineReg = new RegExp(lineRegStr);
let polyReg = new RegExp(polyRegStr);
let planeReg = new RegExp(planeRegStr);

const pf = Number.parseFloat;
const getColor = (str) => {
  if (!str) return undefined;
  const match = str.match(colorReg);
  if (match === null) return undefined;
  if (match[1]) return match[1];
  return [pf(match[3]), pf(match[4]), pf(match[5])];
}

pointReg.Array = (string) => {
  let match = string.match(pointReg);
  let arr = new CSG.Point([num(match[2]), num(match[7]), num(match[12])]);
  arr.color = getColor(match[1].trim());
  return arr;
}

pointReg.vector = (string) => {
  let match = string.match(pointReg);
  const vector = new CSG.Vector(num(match[2]), num(match[7]), num(match[12]));
  vector.color = getColor(match[1].trim());
  return vector;
}

let scale;
const num = (str) => Number.parseFloat(str) * (scale || 1);
pointReg.model = (match) => new CSG.Point({
    x: num(match[2]),
    y: num(match[7]),
    z: num(match[12])
  }, null, getColor(match[1].trim()));

lineReg.model = (match) => {
  return new CSG.Line({
    start: match[3] === '[' ? pointReg.Array(match[4]) : pointReg.vector(match[4]),
    end: match[38] === ']' ? pointReg.Array(match[21]) : pointReg.vector(match[21]),
    color: getColor(match[1].trim()),
    lineDisplayType,
  })
};

polyReg.model = (match) => {
  const color = getColor(match[1].trim());;
  const verts = match[2].match(pointsReg).map(str => pointReg.Array(str));
  return new CSG.Polygon.Enclosed(verts, null, color);
};

planeReg.model = (match) => {
  const color = getColor(match[1].trim());;
  const verts = match[2].match(pointsReg).map(str => pointReg.Array(str));
  const plane = new CSG.Plane.fromPoints(verts);
  plane.setColor(color);
  return plane;
};

function buildModel(lines) {
  const model = new CSG();
  for (let index = 0; index < lines.length; index++) {
    let found = false;
    try {
      for (let rdex = 0; !found && rdex < regExps.length; rdex++) {
        const line = lines[index];
        const reg = regExps[rdex];
        const match = line.match(reg);
        if (match) {
          found = true;
          let currModel = reg.model(match);
          if (currModel) {
            model.polygons.concatInPlace(currModel.polygons);
          }
        }
      }
    } catch (e) {
      console.warn(`Trouble parsing line: '${lines[index]}'`)
    }
  }
  return model;
}



const regExps = [planeReg, polyReg, lineReg, pointReg];

const is = (line, type) => console.log(`${line} is of type ${type}`);
let call = 0;
function parse(lines, sc) {
  scale = sc;
  callId = ++call;
  setTimeout(() => {
    if (callId === call) {
      model = buildModel(lines);
      display(model);
    }
  }, 800);
}

const display = (m) => {
  m ||= model || new CSG();
  let renderModel = m.clone();
  const stls = Object.values(STLs);
  renderModel.polygons.concatInPlace(stls.map(
                  stl=>CSG.fromSTL(stl).scale(scale).polygons).concatElements());
  // renderModel = renderModel.peel({x:0,y:1,z:0}, 4);
  const axisModel = axis.include ? CSG.Axis(axis.length, axis.radius()) : new CSG();
  getViewer(renderModel.union(axisModel));
  viewer.mesh = renderModel.toMesh();
  viewer.gl.ondraw();
}

let active = false;
module.exports = {
  oft: (on_off_toggle) => {
    if (on_off_toggle === true) active = true;
    if (on_off_toggle === false) active = false;
    if (on_off_toggle === null) active = !active;
    if (active) display();
    return active
  },
  slideShow: new SlideShow(buildModel, display),
  parse,
  initialValue: '// 1 Point\nred(5,4,3)\n\n' +
'// 3 Line\ngreen[(10,20,30),(60,70,80)]\nblue[(20,30,40),(80,70,60))\n((10,10,10),(40,40,40)]//Black\nyellow((60,10,20),(20,10,60))\n\n' +
'//2Polygon\npurple[(5,5,0),(0,10,0),(5,15,0),green(15,15,0),(20,10,0),(15,5,0)]\n\n'
}
