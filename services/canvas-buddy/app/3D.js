
const du = require('../../../public/js/utils/dom-utils');
const Viewer = require('../../../public/js/utils/3d-modeling/viewer.js').Viewer;
const addViewer = require('../../../public/js/utils/3d-modeling/viewer.js').addViewer;
const OrientationArrows = require('../../../public/js/utils/display/orientation-arrows.js')

let lastViewId;
function centerOnObj(x,y,z, viewId) {
  const center = model.center();
  center.x += 200 * y;
  center.y += -200 * x;
  center.z += 100;
  const rotation = {x: x*90, y: y*90, z: z*90};
  // const rotation = {x: 0, y: 0, z: 0};

  lastViewId = viewId;
  return [center, rotation];
}

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
    const orientArrows = new OrientationArrows(`${viewerSelector} .orientation-controls`);
    orientArrows.on.center(() =>
      viewer.viewFrom(...(lastViewId === 'front' ? centerOnObj(2,0,2, 'back') : centerOnObj(0,0, 0, 'front'))));
    orientArrows.on.up(() =>
      viewer.viewFrom(...centerOnObj(1, 0,0)));
    orientArrows.on.down(() =>
      viewer.viewFrom(...centerOnObj(-1,0,0)));
    orientArrows.on.left(() =>
      viewer.viewFrom(...centerOnObj(0,1,0)));
    orientArrows.on.right(() =>
      viewer.viewFrom(...centerOnObj(0,-1,0)));
  }
  return viewer;
}

const points = [[0,1,0], [0,2,0],[1,3,0],[2,3,0],[3,2,0],[3,1,0],[2,0,0],[1,0,0]];
// const model = CSG.sphere({r:6});
let model = CSG.axis();
// model = model.union(new CSG.cone({start: [100,100,0], end: [110,110,0]}));
// model = model.union(new CSG.Line({start: [10,10,0], end: [50,50,0]}));
// model = model.union(new CSG.Line({start: new CSG.Vector([0,10,10]), end: [0,50,50]}));
// model = model.union(CSG.Polygon.Enclosed(points));
viewer = getViewer(model);

const colorRegStr = '([a-z]*\\s*)';
const numberRegStr = '\\s*((-|)[0-9]{1,}(|\\.[0-9]*)|(-|)(|\\.[0-9]*))\\s*';
const pointRegStr = `\\s*${colorRegStr}\\(${numberRegStr},${numberRegStr},${numberRegStr}\\)\\s*`;
const lineRegStr = `${colorRegStr}((\\[|\\()(${pointRegStr}),(${pointRegStr}))((\\]|\\)))`;
const polyRegStr = `${colorRegStr}\\[((${pointRegStr},){2,}${pointRegStr})\\]`;
const planeRegStr = `${colorRegStr}\\(${pointRegStr}\\s*,\\s*${pointRegStr},\\s*${pointRegStr}\\)`;

let pointReg = new RegExp(pointRegStr);
let pointsReg = new RegExp(pointRegStr, 'g');
let lineReg = new RegExp(lineRegStr);
let polyReg = new RegExp(polyRegStr);
let planeReg = new RegExp(planeRegStr);

pointReg.Array = (string) => {
  let match = string.match(pointReg);
  let arr = [num(match[2]), num(match[7]), num(match[12])];
  arr.color = (match[1].trim());
  return arr;
}

pointReg.vector = (string) => {
  let match = string.match(pointReg);
  const vector = new CSG.Vector(num(match[2]), num(match[7]), num(match[12]));
  vector.color = match[1].trim();
  return vector;
}

const num = Number.parseFloat;
pointReg.model = (match) => new CSG.Point({
    x: num(match[2]),
    y: num(match[7]),
    z: num(match[12])
  }, null, match[1].trim());

lineReg.model = (match) => {
  return new CSG.Line({
    start: match[3] === '[' ? pointReg.Array(match[4]) : pointReg.vector(match[4]),
    end: match[38] === ']' ? pointReg.Array(match[21]) : pointReg.vector(match[21]),
    color: match[1].trim(),
  })
};

polyReg.model = (match) => {
  const color = match[1].trim();
  const verts = match[2].match(pointsReg).map(str => pointReg.Array(str));
  return new CSG.Polygon.Enclosed(verts, null, color);0
};

planeReg.model = (match) => {
  console.log('toBeImplemented');
};


const regExps = [planeReg, polyReg, lineReg, pointReg];

const is = (line, type) => console.log(`${line} is of type ${type}`);
let call = 0;
function parse(lines) {
  callId = ++call;
  setTimeout(() => {
    if (callId === call) {
      let model = new CSG();
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

      viewer.mesh = model.toMesh();
      viewer.gl.ondraw();
    }
  }, 800);
}

const display = () => {
  getViewer(model);
  viewer.mesh = model.toMesh();
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
  parse,
  initialValue: '// Point\nred(5,4,3)\n\n' +
'// Line\ngreen[(10,20,30),(60,70,80)]\nblue[(20,30,40),(80,70,60))\n((10,10,10),(40,40,40)]//Black\nyellow((60,10,20),(20,10,60))\n\n' +
'//Polygon\npurple[(5,5,0),(0,10,0),(5,15,0),green(15,15,0),(20,10,0),(15,5,0)]\n\n' +
'//Plane\naqua((1,5,0),(0,10,0),(5,25,0))'
}
