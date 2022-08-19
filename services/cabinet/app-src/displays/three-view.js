
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const $t = require('../../../../public/js/utils/$t.js');
const du = require('../../../../public/js/utils/dom-utils');
const Viewer = require('../../public/js/3d-modeling/viewer.js').Viewer;
const addViewer = require('../../public/js/3d-modeling/viewer.js').addViewer;
const pull = require('../three-d/models/pull.js');
const ThreeDModel = require('../three-d/three-d-model.js');
const Layout2D = require('../objects/layout.js')
const Draw2D = require('../two-d/draw.js');
const Polygon2d = require('../two-d/objects/polygon.js');
const PanZoom = require('../two-d/pan-zoom.js');

class ThreeView extends Lookup {
  constructor() {
    super();
    const instance = this;
    const cnt = du.create.element('div');
    const p = pull(5,2);
    const viewer = new Viewer(p, 300, 300, 50);
    let front, left, top;
    let panzFront, panzLeft, panzTop;
    let threeDModel;
    document.body.append(cnt);
    cnt.innerHTML = ThreeView.template.render(this);

    const color = 'black';
    const width = .2;
    const drawFront = () => {
      Layout2D.release('three-view-front');
      const lm = this.lastModel();
      if (lm === undefined) return;
      const xy = lm.xy;
      const twoDmap = Polygon2d.lines(...xy);
      front(twoDmap, color, width);
    }
    const drawLeft = () => {
      Layout2D.release('three-view-left');
      const lm = this.lastModel();
      if (lm === undefined) return;
      const twoDmap = Polygon2d.lines(...lm.zy);
      left(twoDmap, color, width);
    }
    const drawTop = () => {
      Layout2D.release('three-view-top');
      const lm = this.lastModel();
      if (lm === undefined) return;
      const twoDmap = Polygon2d.lines(...lm.xz);
      top(twoDmap, color, width);
    }

    function init() {
      addViewer(viewer, `#${instance.id()}>.three-view-three-d-cnt`);
      front = new Draw2D(du.id('three-view-front'));
      left = new Draw2D(du.id('three-view-left'));
      top = new Draw2D(du.id('three-view-top'));

      panzFront = new PanZoom(front.canvas(), drawFront);
      panzLeft = new PanZoom(left.canvas(), drawLeft);
      panzTop = new PanZoom(top.canvas(), drawTop);
      panzFront.centerOn(0, 0);
      panzLeft.centerOn(0, 0);
      panzTop.centerOn(0, 0);
    }

    this.update = (cabinet) => {
      if (threeDModel === undefined) threeDModel = new ThreeDModel(cabinet, viewer);
      threeDModel.assembly(cabinet, viewer);
      threeDModel.update(cabinet);
      front.clear();left.clear();top.clear();


    }

    this.isolatePart = (partCode) => {
      threeDModel.setTargetPartCode(partCode);
      threeDModel.update();
      setTimeout(() => {
        panzFront.once();
        panzLeft.once();
        panzTop.once();
      }, 500);
      du.id(`three-view-part-code-${this.id()}`).innerText = partCode;
    }

    this.lastModel = () => threeDModel ? threeDModel.lastModel() : undefined;
    this.partMap = () => threeDModel ? threeDModel.partMap() : {};

    setTimeout(init, 1000);
  }
}

ThreeView.template = new $t('three-view');

module.exports = ThreeView;
