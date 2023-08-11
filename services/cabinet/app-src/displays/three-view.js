
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
const PanZoom = require('../../../../public/js/utils/canvas/two-d/pan-zoom.js');
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
    const partCode = part.partCode();
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
    const p = new BiPolygon(new Polygon3D([{x:0, y: 4, z: 0}, {x:4, y: 4, z: 0}, {x:4, y: 0, z: 0}, {x:0, y: 0, z: 0}]),
          new Polygon3D([{x:2, y: 4, z: 4}, {x:6, y: 4, z: 4}, {x:6, y: 0, z: 4}, {x:2, y: 0, z: 4}])).toModel(true);
    // console.log(JSON.stringify(new CSG.cube({radius: 2, center: [2,2,2]}), null, 2));
    // const p = CSG.sphere({center: {x:0, y:0, z: 0}, radius: 10});
    p.setColor([0, 255, 0])
    let draw, panz, hovermap, measurementLines, lastClicked;
    let threeDModel;
    this.maxDem = () => maxDem;
    this.container = () => cnt || defaultCnt;
    this.container().innerHTML = ThreeView.template.render(this);

    const color = 'black';
    const width = .2;

    function getThreeView() {
      if (targetPart) {
        let model = targetPart.toModel(true);
        const polys = Polygon3D.fromCSG(model.polygons)
        return new ThreeViewObj(polys);
      } else {
        return CabinetModel.get().threeView();
      }
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
      const measurments = LineMeasurement2d.measurements(allLines);
      for (let index = 0; index < allLines.length; index++) {
        hovermap.add(allLines[index]);
      }
      return {allLines, measurments};
    }
    this.build = new FunctionCache(build, this, 'three-view');

    let allLines;
    function drawView () {
      if (Global.cabinet() === undefined) return;
      const built = instance.build();

      if (measurementLines) draw(LineMeasurement2d.measurements(measurementLines));
      else draw(built.measurments, 'grey');

      for (let index = 0; index < built.allLines.length; index++) {
        const line = built.allLines[index];
        const lineColor = line === hovermap.hovered()  || line === lastClicked ?
                          'blue' : color;
        draw(line, lineColor, width);
      }
    }

    function onPartSelect(elem) {
      FunctionCache.clear('three-view');
      const selected = du.find.closest(`[value="${elem.value}"`, elem);
      const id = selected.getAttribute('part-id');
      instance.isolatePart(id, elem.value);
      if (measurementLines) measurementLines = [];
      elem.value = '';
    }

    function init() {
      draw = new Draw2D(du.id('three-view'), true);

      panz = new PanZoom(draw.canvas(), drawView);
      panz.centerOn(0, 0);
      hovermap = new HoverMap2d(panz);

      hovermap.on.click(() => {
        const lastTwo = hovermap.clicked(0,2);
        const nadaClick0 = lastTwo[0] === null;
        const nadaClick1 = lastTwo[1] === null;
        if (nadaClick0 && nadaClick1) {
          console.log('do nothing');
        } else if (nadaClick0) {
          lastClicked = null;
        } else if (nadaClick1 || lastClicked === null) {
          lastClicked = lastTwo[0];
        } else if (lastTwo[0] instanceof Line2d && lastTwo[0] === lastTwo[1]) {
          measurementLines.push(lastTwo[0]);
          lastClicked = null;
        } else {
          const line = Line2d.between(lastTwo[0], lastTwo[1]);
          if (line) measurementLines.push(line);
          lastClicked = null;
        }
      });

      if (du.url.breakdown().path.match(/\/.*template$/)) {
        setTimeout(() =>
          ThreeDModel.setViewerSelector(`#${instance.id()}>.three-view-three-d-cnt`, '40vh'), 500);
      }
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
        hovermap.enable();
        measurementLines = [];
      } else {
        hovermap.disable();
        measurementLines = null;
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
