
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const $t = require('../../../../public/js/utils/$t.js');
const du = require('../../../../public/js/utils/dom-utils');
const Viewer = require('../../public/js/3d-modeling/viewer.js').Viewer;
const addViewer = require('../../public/js/3d-modeling/viewer.js').addViewer;
const pull = require('../three-d/models/pull.js');
const ThreeDModel = require('../three-d/three-d-model.js');
const Layout2D = require('../objects/layout.js')
const Draw2D = require('../two-d/draw.js');
const PanZoom = require('../two-d/pan-zoom.js');

class ThreeView extends Lookup {
  constructor() {
    super();
    const instance = this;
    const cnt = du.create.element('div', {class: 'three-view-cnt', id: this.id()});
    const p = pull(5,2);
    const viewer = new Viewer(p, 300, 300, 50);
    let front, left, top;
    let panzFront, panzLeft, panzTop;
    let threeDModel;
    document.body.append(cnt);
    cnt.innerHTML = ThreeView.template.render({});

    function polygonsToLines(polygons, group) {
      const lineMap = {};
      const verts = [];
      let line;
      for (let index = 0; index < polygons.length; index += 1) {
        const verticies = polygons[index];
        for (let index = 0; index < verticies.length; index += 1) {
          const startV = verticies[index];
          const endV = verticies[(index + 1) % verticies.length];
          if (line) {
            line.startVertex(Layout2D.Vertex2D.instance(startV, group));
            line.endVertex(Layout2D.Vertex2D.instance(endV, group));
          } else line =  Layout2D.Line2D.instance(startV, endV, group);
          const key = line.toString();
          const vertsEqual = line.startVertex().equal(line.endVertex());
          if (!vertsEqual && lineMap[key] === undefined &&
                      lineMap[line.toNegitiveString()] === undefined) {
            lineMap[key] = line;
            verts.push(Layout2D.Circle2D.instance(.4, line.startVertex()));
            line = undefined;
          }
        }
      }
      return Object.values(lineMap).concat(verts);
    }

    const color = 'black';
    const width = .2;
    const drawFront = () => {
      Layout2D.release('three-view-front');
      const lm = this.lastModel();
      if (lm === undefined) return;
      const twoDmap = lm.xy;
      front(polygonsToLines(twoDmap, 'three-view-front'), color, width);
      // panzTop.centerOn(twoDmap[0][0].x, twoDmap[0][0].y);

    }
    const drawLeft = () => {
      Layout2D.release('three-view-left');
      const lm = this.lastModel();
      if (lm === undefined) return;
      const twoDmap = lm.zy;
      left(polygonsToLines(twoDmap, 'three-view-left'), color, width);
      // panzTop.centerOn(twoDmap[0][0].x, twoDmap[0][0].y);
    }
    const drawTop = () => {
      Layout2D.release('three-view-top');
      const lm = this.lastModel();
      if (lm === undefined) return;
      const twoDmap = lm.xz;
      top(polygonsToLines(twoDmap, 'three-view-top'), color, width);
      // panzTop.centerOn(twoDmap[0][0].x, twoDmap[0][0].y);
    }

    function init() {
      addViewer(viewer, `#${instance.id()}`);
      front = new Draw2D(du.id('three-view-front'));
      left = new Draw2D(du.id('three-view-left'));
      top = new Draw2D(du.id('three-view-top'));

      panzFront = new PanZoom(front.canvas(), drawFront);
      panzLeft = new PanZoom(left.canvas(), drawLeft);
      panzTop = new PanZoom(top.canvas(), drawTop);
    }

    this.update = (cabinet) => {
      if (threeDModel === undefined) threeDModel = new ThreeDModel(cabinet, viewer);
      threeDModel.assembly(cabinet, viewer);
      threeDModel.update(cabinet);
      front.clear();left.clear();top.clear();


    }

    this.isolatePart = (partCode) => threeDModel.setTargetPartCode(partCode);

    this.lastModel = () => threeDModel ? threeDModel.lastModel() : undefined;
    this.partMap = () => threeDModel ? threeDModel.partMap() : {};

    setTimeout(init, 1000);
  }
}

ThreeView.template = new $t('three-view');

module.exports = ThreeView;
