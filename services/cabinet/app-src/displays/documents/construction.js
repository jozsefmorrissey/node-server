const $t = require('../../../../../public/js/utils/$t.js');
const Global = require('../../services/global.js');
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Polygon3D = require('../../three-d/objects/polygon.js');
const Draw2d = require('../../../../../public/js/utils/canvas/two-d/draw.js');
const du = require('../../../../../public/js/utils/dom-utils');
const PartInfo = require('./part');
const Panel = require('../../objects/assembly/assemblies/panel.js');
const CutInfo = require('./cuts/cut.js');


const template = new $t('documents/construction');
const partTemplate = new $t('documents/part');

const typeFilter = (obj) => {
  const cn = obj.constructor.name;
  if (cn === 'DrawerBox') return 'DrawerBox';
  if (cn === 'Handle') return 'Handle';
  if (cn === 'PanelModel') return 'Panel';
  if (cn === 'DrawerFront') return 'DrawerFront';
  if (cn === 'Door') return 'Door';
  if (cn === 'Panel') return 'Panel';
  return 'unknown';
}

const scaledMidpoint = (l, center, coeficient, transLine) => {
  const midpoint = l.clone().translate(transLine).midpoint();
  let CSGv = new CSG.Vertex({x:midpoint.x(),y: midpoint.y(),z: 0}, [1,0,0]);
  CSGv.scale(center,  coeficient);
  return {
    x: ((midpoint.x() - center.x + 2.5)*coeficient) + center.x,
    y: ((midpoint.y() - center.y - 5)*coeficient) + center.y
  }
}

const textProps = {size: '10px', radians: Math.PI};
function buildCanvas(info, rightOleft) {
  model = info.model(rightOleft);
  const canvas = du.create.element('canvas', {class: 'upside-down part-canvas'});
  const newCenter = {x: canvas.width / 2, y: canvas.height/2, z:0};
  const sideLabelCenter = {x: canvas.width - 5, y: canvas.height - 10, z:0};
  const dems = model.demensions();
  const coeficient = ((canvas.height*.6) / dems.y);
  model.scale(coeficient);
  model.center(newCenter);
  const draw = new Draw2d(canvas);
  const lines = Polygon3D.lines2d(Polygon3D.merge(Polygon3D.fromCSG(model)), 'x', 'y');
  draw(lines, null, .3);
  const side = rightOleft ? 'Right' : 'Left';
  draw.text(side, sideLabelCenter, textProps);
  const edges = info.fenceEdges(rightOleft);
  const transLine = new Line2d(Vertex2d.center(Line2d.vertices(edges)), newCenter);
  edges.forEach(l => l.length() > dems.y / 8 && draw.text(l.label, scaledMidpoint(l, newCenter, coeficient, transLine), textProps));
  return canvas;
}

function partInfo(part) {
  const info = new PartInfo(part);
  const cutList = info.cutInfo();
  if (cutList) {
    info.views = {
      right: buildCanvas(info, true),
      left: buildCanvas(info, false)
    }
  }
  return info;
}

function sortParts(parts) {
  const sorted = {};
  let index = 'A'.charCodeAt(0);
  parts.forEach(part => {
    if (part instanceof Panel) {
      const pInfo = partInfo(part);
      part.index = String.fromCharCode(index++);
      const type = typeFilter(part);
      if (sorted[type] === undefined) sorted[type] = [];
      let found = false;
      sorted[type].forEach(info => {
        if (info.merge(pInfo)) {
          found = true;
        }
      });
      if (!found) {
        sorted[type].push(pInfo);
      }
    }
  });
  return sorted;
}

const sideFilter = (cl) => {
  const min = round(Math.min(cl.startVertex().y(), cl.endVertex().y()));
  return (s) => !s.isParrelle(cl) && min >= round(cl.findIntersection(s).y());
}

const lineDistanceSorter = (cl) => (a,b) => a.distance(cl) - b.distance(cl);

function viewContainer(view) {
  const id = `view-container-${String.random()}`;
  setTimeout(() => {
    if (view) {
      const cnt = du.id(id);
      cnt.append(view);
    }
  });
  return id;
}

const openingCanvasId = (cabinet) => `construction-opening-sketch-${cabinet.id()}`;


const html = {
  order: (order) => {
    order ||= Global.order();
    return template.render({order, sortParts, viewContainer, disp: CutInfo.display});
  },
  part: (part) => {
    const info = partInfo(part);
    return partTemplate.render({info, viewContainer, disp: CutInfo.display});
  }
};

module.exports = {
  html
}
