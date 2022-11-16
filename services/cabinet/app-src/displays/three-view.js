
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

function door(face1, face2) {
  const front = new CSG.Polygon(normalize(face1, [+1, 0, 0]));
  front.plane.normal = new CSG.Vector([0,0+1, 0,0]);
  const back = new CSG.Polygon(normalize(face2, [-1, 0, 0], true));
  back.plane.normal = new CSG.Vector([0,0,1,0,0]);
  const top = new CSG.Polygon(normalize([face1[0], face1[1], face2[1], face2[0]], [0,1,0], true));
  top.plane.normal = new CSG.Vector([0, 1, 0]);
  const left = new CSG.Polygon(normalize([face2[3], face2[0], face1[0], face1[3]], [-1,0,0]));
  left.plane.normal = new CSG.Vector([-1, 0, 0]);
  const right = new CSG.Polygon(normalize([face1[1], face1[2], face2[2], face2[1]], [1,0,0], true));
  right.plane.normal = new CSG.Vector([1, 0, 0]);
  const bottom = new CSG.Polygon(normalize([face1[3], face1[2], face2[2], face2[3]], [0,-1,0]));
  bottom.plane.normal = new CSG.Vector([0, -1, 0]);

  const poly = CSG.fromPolygons([front, back, top, left, right, bottom]);
  return poly;
}

class ThreeView extends Lookup {
  constructor(viewer) {
    super();
    const instance = this;
    const maxDem = window.innerHeight * .45;
    const cnt = du.create.element('div');
    // const p = pull(5,2);
    const p = new BiPolygon(new Polygon3D([{x:0, y: 4, z: 0}, {x:4, y: 4, z: 0}, {x:4, y: 0, z: 0}, {x:0, y: 0, z: 0}]),
          new Polygon3D([{x:2, y: 4, z: 4}, {x:6, y: 4, z: 4}, {x:6, y: 0, z: 4}, {x:2, y: 0, z: 4}])).toModel();
    // const p = door([{x:0, y: 4, z: 0}, {x:4, y: 4, z: 0}, {x:4, y: 0, z: 0}, {x:0, y: 0, z: 0}],
    //       [{x:0, y: 4, z: 4}, {x:4, y: 4, z: 4}, {x:4, y: 0, z: 4}, {x:0, y: 0, z: 4}]);
    // console.log(JSON.stringify(new CSG.cube({radius: 2, center: [2,2,2]}), null, 2));
    // const p = CSG.sphere({center: {x:0, y:0, z: 0}, radius: 10});
    p.setColor([0, 255, 0])
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

    function onPartSelect(elem) {
      console.log(elem.value);
      instance.isolatePart(elem.value);
      elem.value = '';
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

      du.on.match('change', '[name="partSelector"]', onPartSelect);
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

    this.isolatePart = (partCode) => {
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

    this.threeDModel = () => threeDModel;
    this.lastModel = () => threeDModel ? threeDModel.lastModel() : undefined;
    this.partMap = () => threeDModel ? threeDModel.partMap() : {};

    setTimeout(init, 1000);
  }
}

ThreeView.template = new $t('three-view');

module.exports = ThreeView;
