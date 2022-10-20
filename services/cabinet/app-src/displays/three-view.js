
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
const Line2d = require('../two-d/objects/line.js');
const LineMeasurement2d = require('../two-d/objects/line-measurement.js');
const PanZoom = require('../two-d/pan-zoom.js');

class ThreeView extends Lookup {
  constructor(viewer) {
    super();
    const instance = this;
    const maxDem = window.innerHeight * .45;
    const cnt = du.create.element('div');
    const p = pull(5,2);
    let front, left, top;
    let panzFront, panzLeft, panzTop;
    let threeDModel;
    document.body.append(cnt);
    this.maxDem = () => maxDem;
    cnt.innerHTML = ThreeView.template.render(this);

    const color = 'black';
    const width = .2;
    const cache = {front: {}, left: {}, top: {}};

    const drawFront = (refresh) => {
      Layout2D.release('three-view-front');
        const lm = this.lastModel();
        if (lm === undefined) return;
        const xy = lm.xy;
        const twoDmap = Polygon2d.lines(...xy);
        if (twoDmap.length < 100) {
          const measurements = LineMeasurement2d.measurements(twoDmap);
          cache.front.twoDmap = twoDmap;
          cache.front.measurements = measurements;
        }
      front(cache.front.twoDmap, color, width);
      front(cache.front.measurements, 'grey');
    }
    const drawLeft = (refresh) => {
      Layout2D.release('three-view-left');
      const lm = this.lastModel();
      if (lm === undefined) return;
      const twoDmap = Polygon2d.lines(...lm.zy);
      if (twoDmap.length < 100) {
        left(twoDmap, color, width);
        const measurements = LineMeasurement2d.measurements(twoDmap);
        left(measurements, 'grey');
      }
    }
    const drawTop = (refresh) => {
      Layout2D.release('three-view-top');
      const lm = this.lastModel();
      if (lm === undefined) return;
      const twoDmap = Polygon2d.lines(...lm.xz);
      if (twoDmap.length < 100) {
        top(twoDmap, color, width);
        const measurements = LineMeasurement2d.measurements(twoDmap);
        top(measurements, 'grey');
      }
    }

    function init() {
      if (viewer === undefined) {
        viewer = new Viewer(p, maxDem, maxDem, 50);
        addViewer(viewer, `#${instance.id()}>.three-view-three-d-cnt`);
      }
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
      setTimeout(() => {
        drawTop(true);drawLeft(true);drawFront(true);
      }, 1000);
    }

    this.isolatePart = (partCode, cabinet) => {
      threeDModel = ThreeDModel.get();
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
