
const Global = require('../../services/global');
const {Vertex3D} = require('../../../../../public/js/utils/canvas/three-d/lib.js');
let partAxis = [];
let extraObjs = () =>
  partAxis.concat(openingVerticies);

const csgVertex = (center, radius, color) => {
  radius ||= .5;
  const vertex = CSG.sphere({center, radius});
  vertex.setColor(Color.rgb(color));
  return vertex;
}

let openingVerticies = [];
function addOpeningPoints(template, state, big) {
  openingVerticies = [];
  const openings = Global.cabinet().openings;
  for (let index = 0; index < openings.length; index++) {
    const opening = openings[index];
    const size = big ? 1 : .25;
    const i = state.index;
    const vertexColor = (io, i) => !big ? 'black' :
                    ((io !== state.innerOouter) ? 'black' :
                    (i === state.index ? 'green' : 'white'));

    const vertexSize = (io) => big && io === state.innerOouter ? size*2 : size;

    const coords = opening.update();
    openingVerticies.push(csgVertex(coords.inner[0], vertexSize('true'), vertexColor('true', 0)));
    openingVerticies.push(csgVertex(coords.inner[1], vertexSize('true'), vertexColor('true', 1)));
    openingVerticies.push(csgVertex(coords.inner[2], vertexSize('true'), vertexColor('true', 2)));
    openingVerticies.push(csgVertex(coords.inner[3], vertexSize('true'), vertexColor('true', 3)));

    openingVerticies.push(csgVertex(coords.outer[0], vertexSize('false'), vertexColor('false', 0)));
    openingVerticies.push(csgVertex(coords.outer[1], vertexSize('false'), vertexColor('false', 1)));
    openingVerticies.push(csgVertex(coords.outer[2], vertexSize('false'), vertexColor('false', 2)));
    openingVerticies.push(csgVertex(coords.outer[3], vertexSize('false'), vertexColor('false', 3)));
  }
}

function addNormalLines(obj) {
  partAxis = [];
  const assem = Global.target().getAssembly(obj.code);
  const isPoly = obj.positionMethod === 'poly';
  let config;
  if (isPoly) {
    config = assem.evalObject(obj.polyConfig.points);
    config.forEach(arr => partAxis.push(csgVertex(arr, .4, 'black')));
  }
  let vectors = assem.position().normals(true).map(v => v.toArray());
  const center = isPoly ? Vertex3D.center(config) :
                          assem.position().center();
  const origin = [center.x, center.y, center.z];
  const dems = assem.position().demension();
  const size = Math.max(dems.x, dems.y, dems.z);
  const axis = new CSG.Axis(size, .25, origin, vectors);
  partAxis = [axis];
}
const removeNormalLines = () => partAxis = [];


Canvas.extraCsgObjects(extraObjs, () => true);
module.exports = {addOpeningPoints, extraObjs, addNormalLines, removeNormalLines,
      };
