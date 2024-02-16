
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const $t = require('../../../../public/js/utils/$t.js');
const du = require('../../../../public/js/utils/dom-utils');
const Layout2D = require('../two-d/layout/layout.js')
const Draw2D = require('../../../../public/js/utils/canvas/two-d/draw.js');
const Polygon3D = require('../three-d/objects/polygon.js');
const Line3D = require('../three-d/objects/line.js');
const BiPolygon = require('../three-d/objects/bi-polygon.js');
const Line2d = require('../../../../public/js/utils/canvas/two-d/objects/line.js');
const LineMeasurement2d = require('../../../../public/js/utils/canvas/two-d/objects/line-measurement.js');
const PanZoomClickMeasure = require('../../../../public/js/utils/canvas/two-d/pan-zoom-click-measure.js');
const Global = require('../services/global.js');
const CSG = require('../../../../public/js/utils/3d-modeling/csg.js');
const CabinetModel = require('../three-d/cabinet-model.js');
const FunctionCache = require('../../../../public/js/utils/services/function-cache.js');
const HoverMap2d = require('../../../../public/js/utils/canvas/two-d/hover-map.js');
const construction = require('./documents/construction.js');
const Jobs = require('../../web-worker/external/jobs.js');

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
    const locationCode = part.locationCode();
    const partName = part.partName();
    htmlArr.push(`<option value='${locationCode}' part-id='${part.id()}'></option>`);
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
    // p.setColor([0, 255, 0])
    let draw, panz, hovermap;
    let side = 'right';
    let threeViewObj;

    const setThreeView = (target) => (modelInfo) => {
      threeViewObj = {target, threeView: modelInfo.threeView(target.id())};
    };
    let lastHash;
    function getThreeView() {
      if (targetPart) {
        const hash = targetPart.hash();
        if (lastHash !== hash) {
          lastHash = hash;
          new Jobs.CSG.Assembly.To2D(targetPart).then(setThreeView(targetPart));
        }
      } else {
        const cabinet = Global.cabinet();
        if (cabinet === undefined) return;
        const hash = cabinet.hash();
        if (lastHash !== hash) {
          lastHash = hash;
          new Jobs.CSG.Cabinet.To2D(cabinet).then(setThreeView(cabinet)).queue();
        }
      }
    }

    this.maxDem = () => maxDem;
    this.container = () => cnt || defaultCnt;
    this.side = (s) => {
      if (s) {
        const rebuild = s !== side;
        side = s;
        if (rebuild) {
          lastHash = undefined;
          this.build.clearCache()();
        }
      }
      return side;
    }
    this.container().innerHTML = ThreeView.template.render(this);

    const color = 'black';
    const width = .2;

    this.toLines = () => {
      if (!threeViewObj) return [];
      const threeView = threeViewObj.threeView;
      if (!targetPart) {
        return threeView.top.concat(threeView.right.concat(threeView.front));
      } else {
        return threeView.parimeter.threeView;
      }
    }

    function build() {
      Layout2D.release(`three-view`);
      hovermap.clear();
      const allLines = instance.toLines();
      for (let index = 0; index < allLines.length; index++) {
        hovermap.add(allLines[index]);
      }
      return true;
    }
    this.build = new FunctionCache(build, this, 'three-view');

    let allLines;
    function drawView () {
      getThreeView();
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
      draw = new Draw2D(du.id('three-view'));

      hovermap = new HoverMap2d();
      panz = new PanZoomClickMeasure(draw.canvas(), drawView, () => hovermap);
      // panz.disable.move();
      panz.vertexTolerance(1.6);
      panz.lineTolerance(.8);
      panz.centerOn(0, 0);

      du.on.match('change', '[name="partSelector"]', onPartSelect);
    }

    let lastPart;
    this.update = () => {
      const cabinet = Global.cabinet();
      if (cabinet === undefined) return;
      draw.clear();
      setTimeout(() => {
        updatePartsDataList(instance.container());
        drawView(true);
      }, 100);
    }

    function updatePartInfo(elem) {
      const infoCnt = du.find.closest('.part-info-cnt', elem);
      const html = construction.Part.html(targetPart);
      infoCnt.innerHTML = html;
    }

    this.isolatePart = (partId, partCode) => {
      targetPart = ThreeView.get(partId);
      setTimeout(() => {
        panz.once();
      }, 500);
      const partCodeCnt = du.id(`three-view-part-code-${this.id()}`);
      partCodeCnt.innerText = `${partCode}: ${partId}`;
      updatePartInfo(partCodeCnt);
    }

    function rulerClick(elem) {
      du.class.toggle(elem, 'active');
      if (du.class.has(elem, 'active')) {
        panz.measurements.enable();
      } else {
        panz.measurements.disable();
      }
    }

    du.on.match('click', `#${this.id()} .ruler`, rulerClick);
    du.on.match('click', `#${this.id()} [name='side']`, (e) => this.side(e.value));

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
