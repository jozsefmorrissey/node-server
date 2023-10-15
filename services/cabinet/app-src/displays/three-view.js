
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const $t = require('../../../../public/js/utils/$t.js');
const du = require('../../../../public/js/utils/dom-utils');
const pull = require('../three-d/models/pull.js');
const ThreeDModel = require('../three-d/three-d-model.js');
const Layout2D = require('../two-d/layout/layout.js')
const Draw2D = require('../../../../public/js/utils/canvas/two-d/draw.js');
const Polygon3D = require('../three-d/objects/polygon.js');
const BiPolygon = require('../three-d/objects/bi-polygon.js');
const Line2d = require('../../../../public/js/utils/canvas/two-d/objects/line.js');
const LineMeasurement2d = require('../../../../public/js/utils/canvas/two-d/objects/line-measurement.js');
const PanZoomClickMeasure = require('../../../../public/js/utils/canvas/two-d/pan-zoom-click-measure.js');
const Global = require('../services/global.js');
const CSG = require('../../public/js/3d-modeling/csg');
const CabinetModel = require('../three-d/cabinet-model.js');
const ThreeViewObj = require('../../../../public/js/utils/canvas/two-d/objects/three-view.js')
const FunctionCache = require('../../../../public/js/utils/services/function-cache.js');
const HoverMap2d = require('../../../../public/js/utils/canvas/two-d/hover-map.js');

FunctionCache.on('three-view', 1000);
function csgVert(pos, normal) {
  return new CSG.Vertex(pos, normal);
}

function normalize (verts, normal, reverse) {
  const returnValue = [];
  for (let index = 0; index < verts.length; index++)
    returnValue[index] = new CSG.Vertex(verts[index], normal);
  return reverse ? returnValue.reverse() : returnValue;
}

let defCnt;
function defaultCnt() {
  if (defCnt === undefined) {
    defCnt = du.create.element('div');
    document.body.append(defCnt);
  }
  return defCnt;
}

function updatePartsDataList(container) {
  const datalist = du.find.down('[id="part-list"]', container);

  const cabinet = Global.cabinet();
  const parts = cabinet.getParts();
  let htmlArr = ['<option value="ASSEMBLY"></option>'];
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const partCode = part.partCode(true);
    const partName = part.partName();
    htmlArr.push(`<option value='${partCode}' part-id='${part.id()}'></option>`);
  }
  htmlArr.sort()
  datalist.innerHTML = htmlArr.join('');
}

class ThreeView extends Lookup {
  constructor(cnt) {
    super();
    const instance = this;
    const maxDem = window.innerHeight * .45;
    let targetPart;
    // const p = pull(5,2);
    // const p = new BiPolygon(new Polygon3D([{x:0, y: 4, z: 0}, {x:4, y: 4, z: 0}, {x:4, y: 0, z: 0}, {x:0, y: 0, z: 0}]),
    //       new Polygon3D([{x:2, y: 4, z: 4}, {x:6, y: 4, z: 4}, {x:6, y: 0, z: 4}, {x:2, y: 0, z: 4}])).toModel(true);
    // const p = CSG.sphere({center: {x:0, y:0, z: 0}, radius: 10});
    // p.setColor([0, 255, 0])
    let draw, panz, hovermap;
    let threeDModel;
    this.maxDem = () => maxDem;
    this.container = () => cnt || defaultCnt;
    this.container().innerHTML = ThreeView.template.render(this);

    const color = 'black';
    const width = .2;

    const threeViewObj = {};
    function getThreeView() {
      if (threeViewObj.targetPart === targetPart) return threeViewObj.threeView;
      if (targetPart) {
        let model = targetPart.toModel(targetPart.constructor.name === 'Cabinet');
        const polys = Polygon3D.fromCSG(model.polygons)
        threeViewObj.threeView = new ThreeViewObj(polys);
      } else {
        const model = CabinetModel.get();
        if (model) threeViewObj.threeView = model.threeView();
      }
      if (threeViewObj.threeView) threeViewObj.targetPart = targetPart;
      return threeViewObj.threeView;
    }

    this.toLines = () => {
      const threeView = getThreeView();
      if (targetPart) {
        return threeView.top().concat(threeView.right().concat(threeView.front()));
      } else {
        return threeView.parimeter().allLines();
      }
    }

    function build() {
      Layout2D.release(`three-view`);
      let threeView;
      hovermap.clear();
      const allLines = instance.toLines(threeView);
      for (let index = 0; index < allLines.length; index++) {
        hovermap.add(allLines[index]);
      }
      const measures = LineMeasurement2d.measurements(allLines);
      measures.forEach(m => hovermap.add(m.I().furtherLine(), null, m));
      return true;
    }
    this.build = new FunctionCache(build, this, 'three-view');

    let allLines;
    function drawView () {
      if (getThreeView() === undefined) return;
      instance.build();

      const objs = hovermap.targets();
      for (let index = 0; index < objs.length; index++) {
        const obj = objs[index];
        draw(obj, color, width);
      }
    }

    function onPartSelect(elem) {
      // FunctionCache.clear('three-view');
      const selected = du.find.closest(`[value="${elem.value}"`, elem);
      const id = selected.getAttribute('part-id');
      instance.isolatePart(id, elem.value);
      elem.value = '';
    }

    function init() {
      draw = new Draw2D(du.id('three-view'), true);

      hovermap = new HoverMap2d();
      panz = new PanZoomClickMeasure(draw.canvas(), drawView, () => hovermap);
      panz.disable.move();
      panz.vertexTolerance(.4);
      panz.lineTolerance(.2);
      panz.centerOn(0, 0);

      du.on.match('change', '[name="partSelector"]', onPartSelect);
    }

    let lastPart;
    this.update = () => {
      const cabinet = Global.cabinet();
      if (cabinet === undefined) return;
      if (threeDModel === undefined) threeDModel = new ThreeDModel(cabinet);
      threeDModel.object(cabinet);
      const model = threeDModel.buildObject();
      draw.clear();
      setTimeout(() => {
        updatePartsDataList(instance.container());
        drawView(true);
      }, 100);
      return model;
    }

    this.isolatePart = (partId, partCode) => {
      targetPart = ThreeView.get(partId);
      setTimeout(() => {
        panz.once();
      }, 500);
      du.id(`three-view-part-code-${this.id()}`).innerText = `${partCode}: ${partId}`;
    }

    this.threeDModel = () => threeDModel;
    this.lastModel = () => threeDModel ? threeDModel.lastModel() : undefined;
    this.lastRendered = () => threeDModel ? threeDModel.getLastRendered() : undefined;
    this.partMap = () => threeDModel ? threeDModel.partMap() : {};

    function rulerClick(elem) {
      du.class.toggle(elem, 'active');
      if (du.class.has(elem, 'active')) {
        panz.measurements.enable();
      } else {
        panz.measurements.disable();
      }
    }

    du.on.match('click', `#${this.id()} .ruler`, rulerClick);

    setTimeout(init, 1000);
  }
}

function copyDrawString(elem) {
  const id = du.find.up('.three-view-cnt', elem).getAttribute('id');
  const threeView = ThreeView.get(id);
  const str = Line2d.toDrawString(threeView.toLines());
  du.copy(str);
}

du.on.match('click', '.three-view-draw-string-btn', copyDrawString);

ThreeView.template = new $t('three-view');

module.exports = ThreeView;
