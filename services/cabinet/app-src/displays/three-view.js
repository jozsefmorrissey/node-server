
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const $t = require('../../../../public/js/utils/$t.js');
const du = require('../../../../public/js/utils/dom-utils');
const pull = require('../three-d/models/pull.js');
const ThreeDModel = require('../three-d/three-d-model.js');
const Layout2D = require('../objects/layout.js')
const Draw2D = require('../two-d/draw.js');
const Polygon2d = require('../two-d/objects/polygon.js');
const Polygon3D = require('../three-d/objects/polygon.js');
const BiPolygon = require('../three-d/objects/bi-polygon.js');
const Line2d = require('../two-d/objects/line.js');
const LineMeasurement2d = require('../two-d/objects/line-measurement.js');
const PanZoom = require('../two-d/pan-zoom.js');

const CSG = require('../../public/js/3d-modeling/csg');

function csgVert(pos, normal) {
  return new CSG.Vertex(pos, normal);
}

function normalize (verts, normal, reverse) {
  const returnValue = [];
  for (let index = 0; index < verts.length; index++)
    returnValue[index] = new CSG.Vertex(verts[index], normal);
  return reverse ? returnValue.reverse() : returnValue;
}

class ThreeView extends Lookup {
  constructor() {
    super();
    const instance = this;
    const maxDem = window.innerHeight * .45;
    const cnt = du.create.element('div');
    // const p = pull(5,2);
    const p = new BiPolygon(new Polygon3D([{x:0, y: 4, z: 0}, {x:4, y: 4, z: 0}, {x:4, y: 0, z: 0}, {x:0, y: 0, z: 0}]),
          new Polygon3D([{x:2, y: 4, z: 4}, {x:6, y: 4, z: 4}, {x:6, y: 0, z: 4}, {x:2, y: 0, z: 4}])).toModel();
    // console.log(JSON.stringify(new CSG.cube({radius: 2, center: [2,2,2]}), null, 2));
    // const p = CSG.sphere({center: {x:0, y:0, z: 0}, radius: 10});
    p.setColor([0, 255, 0])
    let draw, panz;
    let threeDModel;
    document.body.append(cnt);
    this.maxDem = () => maxDem;
    cnt.innerHTML = ThreeView.template.render(this);

    const color = 'black';
    const width = .2;

    function drawView (refresh) {
      Layout2D.release(`three-view`);
      let model = instance.lastModel();
      model ||= instance.lastRendered();
      if (model === undefined) return;
      const twoDmap = model.threeView();
      if (twoDmap.measurments === undefined) {
        const allLines = twoDmap.front.concat(twoDmap.right.concat(twoDmap.top));
        twoDmap.measurments = LineMeasurement2d.measurements(allLines);
      }
      draw(twoDmap.front, color, width);
      draw(twoDmap.right, color, width);
      draw(twoDmap.top, color, width);
      draw(twoDmap.measurments, 'grey');
    }

    function onPartSelect(elem) {
      console.log(elem.value);
      const partCode = du.find.closest(`[value="${elem.value}"`, elem).getAttribute('part-code');
      instance.isolatePart(elem.value);
      elem.value = '';
    }

    function init() {
      draw = new Draw2D(du.id('three-view'));

      panz = new PanZoom(draw.canvas(), drawView);
      panz.centerOn(0, 0);

      if (du.url.breakdown().path.match(/\/.*template$/)) {
        setTimeout(() =>
          ThreeDModel.setViewerSelector(`#${instance.id()}>.three-view-three-d-cnt`, '40vh'), 500);
      }
      du.on.match('change', '[name="partSelector"]', onPartSelect);
    }

    this.update = (cabinet) => {
      if (threeDModel === undefined) threeDModel = new ThreeDModel(cabinet);
      threeDModel.assembly(cabinet);
      threeDModel.update(cabinet);
      draw.clear();
      setTimeout(() => {
        drawView(true);
      }, 1000);
    }

    this.isolatePart = (partCode) => {
      threeDModel = ThreeDModel.get();
      threeDModel.setTargetPartName(partCode);
      threeDModel.update();
      setTimeout(() => {
        panz.once();
      }, 500);
      du.id(`three-view-part-code-${this.id()}`).innerText = partCode;
    }

    this.threeDModel = () => threeDModel;
    this.lastModel = () => threeDModel ? threeDModel.lastModel() : undefined;
    this.lastRendered = () => threeDModel ? threeDModel.getLastRendered() : undefined;
    this.partMap = () => threeDModel ? threeDModel.partMap() : {};

    setTimeout(init, 1000);
  }
}

ThreeView.template = new $t('three-view');

module.exports = ThreeView;
