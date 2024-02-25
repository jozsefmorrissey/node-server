
const Tooling = require('./tooling');
const Utils = require('./tools/utils');
const $t = require('../../../../../public/js/utils/$t.js');

class PartDocumentation {
  constructor(partInfo) {
    const textProps = {size: '10px', radians: Math.PI};
    function buildCanvas(info, rightOleft) {
      const side = rightOleft ? 'Right' : 'Left';
      const model = CSG.fromPolygons(info.model[side.toLowerCase()], true);
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
      draw.text(side, sideLabelCenter, textProps);
      const edges = info.fenceEdges(rightOleft);
      const transLine = new Line2d(Vertex2d.center(Line2d.vertices(edges)), newCenter);
      edges.forEach(l => draw.text(l.label, scaledMidpoint(l, newCenter, coeficient, transLine), textProps));
      return canvas;
    }

    function buildViews(info) {
      if (info.veiws === undefined) return;
      info.views = {
        right: buildCanvas(info, true),
        left: buildCanvas(info, false)
      }
    }

    buildViews(partInfo);
    partInfo.Tooling = Tooling;
    this.html = () => PartDocumentation.template.render(partInfo);
  }
}

PartDocumentation.template = new $t('documents/construction/part')
module.exports = PartDocumentation;
