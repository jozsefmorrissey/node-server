
const du = require('../../../public/js/utils/dom-utils');
const Viewer = require('../../../public/js/utils/3d-modeling/viewer.js').Viewer;
const addViewer = require('../../../public/js/utils/3d-modeling/viewer.js').addViewer;
const OrientationControls = require('../../../public/js/utils/display/orientation-controls.js');
const SlideShow = require('./slide-show');
const STL = require('../../../public/js/utils/3d-modeling/STL.js');

const {Line3D, Vertex3D, Polygon3D, Vector3D, Plane} = require('../../../public/js/utils/canvas/three-d/lib')

let STLs = {};

function updateStlList() {
  const cnt = du.id('stl-list-cnt');
  cnt.innerHTML = Object.values(STLs).map(stl =>
    `<div class='${stl instanceof Error ? 'error': ''}'>${stl.header()}<button class='rm-btn'>X</button></div>`).join('\n');
  display();
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
du.on.match('change', checkedLineDispSelector, (elem) =>
  CSG.Line.type(elem.value) &
  du.trigger('refresh', du.find('textarea')));
CSG.Line.type(CSG.Line.TYPES.LINE_ONLY);

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
let viewerSize = '80vh';
const viewerSelector = '#three-d-display>.canvas-cnt';
function getViewer () {
  if (viewer) return viewer;
  const canvas = du.find(viewerSelector);
  if (canvas) {
    const size = du.convertCssUnit(viewerSize);
    viewer = new Viewer(new CSG.cube(), size, size, 50);
    addViewer(viewer, viewerSelector);
    const orientSelector = `${viewerSelector} .orientation-controls`;
    const orientArrows = OrientationControls.forCSG(orientSelector, viewer, () => renderModel);
  }
  return viewer;
}

let axis = {include: true, length: 100,
    radius: (r) => r !== undefined ? (axis.radius.len = r) : axis.radius.len || (axis.length / 100)};
const points = [[0,1,0], [0,2,0],[1,3,0],[2,3,0],[3,2,0],[3,1,0],[2,0,0],[1,0,0]];
let model;

let scale;
const num = (str) => Number.parseFloat(str) * (scale || 1);
const inputSel = du.id('input-measurement-selector');
const inputUnit = () => du.find.down('input[type="radio"]:checked', inputSel).value;

function buildModel(lines) {
  const model = new CSG();
  for (let index = 0; index < lines.length; index++) {
    let found = false;
    try {
      for (let rdex = 0; !found && rdex < regExps.length; rdex++) {
        const line = lines[index];
        const reg = regExps[rdex];
        const match = line.match(reg);
        Polygon3D.regex.model;
        if (match) {
          found = true;
          let currModel = reg.model(line, inputUnit(), scale);
          if (currModel) {
            model.add(currModel);
          }
        }
      }
    } catch (e) {
      console.warn(`Trouble parsing line: '${lines[index]}'`)
    }
  }
  return model;
}



const regExps = [Plane.regex, Polygon3D.regex, Line3D.regex, Vertex3D.regex];
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


let renderModel;
const display = (m) => {
  m ||= model || new CSG();
  renderModel = m.clone();
  const stls = Object.values(STLs);
  const csgs = stls.map(stl=>CSG.fromSTL(stl).scale(scale));
  csgs.forEach(csg => csg.setColors('blue'));
  csgs.forEach(csg => renderModel.add(csg));
  // renderModel = renderModel.peel({x:0,y:1,z:0}, 4);
  const axisModel = axis.include ? CSG.Axis(axis.length, axis.radius()) : new CSG();
  getViewer(renderModel);
  axisModel.add(renderModel);
  viewer.mesh = axisModel.toMesh();
  viewer.mesh.line = axisModel.toLineMesh();
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
'//2Polygon\npurple[(5,5,0),(0,10,0),(5,15,0),green(15,15,0),(20,10,0),(15,5,0)]\n\n' +
'//4 Plane\nlime(blue(30,0,0),red(30,0,30),yellow(0,0,30))\n\n'
}
