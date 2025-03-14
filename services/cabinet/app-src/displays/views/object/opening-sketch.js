
const du = require('../../../../../../public/js/utils/dom-utils.js');
const $t = require('../../../../../../public/js/utils/$t.js');
const Draw2D = require('../../../../../../public/js/utils/canvas/two-d/draw.js');
const Line2d = require('../../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Vertex2d = require('../../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Polygon2d = require('../../../../../../public/js/utils/canvas/two-d/objects/polygon.js');
const Parimeters2d = require('../../../../../../public/js/utils/canvas/two-d/maps/parimeters.js');
const EscapeMap = require('../../../../../../public/js/utils/canvas/two-d/maps/escape.js');
const Measurement = require('../../../../../../public/js/utils/std-lib/measurement.js');

const {Vector3D, Vertex3D, Line3D, Polygon3D} = require('../../../../../../public/js/utils/canvas/three-d/lib');

const PanZoomClickMeasure = require('../../../../../../public/js/utils/canvas/two-d/pan-zoom-click-measure.js');
const HoverMap = require('../../../../../../public/js/utils/canvas/two-d/hover-map.js');
const LineMeasurement2d = require('../../../../../../public/js/utils/canvas/two-d/objects/line-measurement.js');
const Cabinet = require('../../../objects/assembly/assemblies/cabinet.js');
const Jobs = require('../../../../web-worker/external/jobs.js');
const rotatedLineFunc = (coDirRotz, center) => (p1, p2) =>
    new Line3D(p1,p2).rotate(coDirRotz, center);
const inputs = require('../../../input/inputs.js');
const Controller = require('../controllers/object/layout');


const sectionTemplate = new $t('divider-controls');
class OpeningSketchSettings {
  constructor() {
    const keys = ['OUTER_LINES', 'INNER_LINES', 'COVERS', 'BACKGROUND_COLOR', 'SECTION_INDICIES', 'DIVIDER_INDICIES'];
    const settings = {};
    keys.forEach(k => (this[k] = (val) =>
                      val === undefined ? settings[k] : (settings[k] = val)));
    // this.SECTION_INDICIES(true);
    this.INNER_LINES(true);
    this.COVERS(true);
  }
}

class OpeningSketch {
  constructor(selector) {
    const hoverMap = new HoverMap();
    let sketch, panZ, canvas, elem, _cabinet, _modelInfo;
    const instance = this;

    let coDirRotz, innerLines, cabinetOutlines, center, outerLines, model,
        allLines, leafSections, labels, pullLines, sectionPolys, toeKickLines;

    const cabinetSizeHash = (cab = _cabinet) =>
                          Math.hash(cab.width(), cab.length(), cab.thickness());

    this.canvas = canvas;
    this.cabinet = (cabinet) => {
      if (cabinet instanceof Cabinet && (cabinet !== _cabinet || sizeHash !== cabinetSizeHash(cabinet))) {
        if (_cabinet !== cabinet) {
          cabinetOutlines = [];
          _modelInfo = undefined;
        }
        _cabinet = cabinet;
        new Jobs.CSG.Assembly(_cabinet).then((modelInfo, job) => {
          if (_cabinet === cabinet) {
            _modelInfo = modelInfo;
            build(true);
            sizeHash = cabinetSizeHash();
          }
        }).queue();
        build();
      }
      return _cabinet;
    }

    const Center = (obj) => Center[obj.constructor.name](obj);
    Center.OpeningToeKick = (toeKick) => {
      const y = toeKick.tkh()/-2;
      return toeKick.opening().outerPoly().lines()[2].midpoint()
                    .rotate(coDirRotz, center)
                    .translate({x:0,y,z:0}, true);
    };
    Center.Divider = (divider) => {
      const outer = divider.parentAssembly().outer()
      const rotatedLine = rotatedLineFunc(coDirRotz, center);
      return divider.parentAssembly().parentAssembly().vertical() ?
                              rotatedLine(outer[1], outer[2]).midpoint() :
                              rotatedLine(outer[2], outer[3]).midpoint();
    }
    Center.SectionProperties = (section) => section.innerPoly().rotate(coDirRotz, center);

    function buildSectionLabel(section) {
      const sectionCenter = Center(section);
      let text = section.userFriendlyIndex();
      if (text === 'S') text = '1';
      labels.sections.push({text, center: sectionCenter});
    }

    function buildToeKicks() {
      if (!_cabinet.autoToeKick()) return;
      const autoTK = _cabinet.children().findLast(()=>true);
      const rotatedLine = l => l.rotate(coDirRotz, center);
      autoTK.children().forEach((tk) => {
        const oLines = tk.opening().outerPoly().lines();
        const iLines = tk.opening().innerPoly().lines();
        let right = rotatedLine((!tk.rightEndStyle() ? oLines : iLines)[1]).to2D();
        let top = rotatedLine(oLines[2]).to2D();
        let left = rotatedLine((!tk.leftEndStyle() ? oLines : iLines)[3]).to2D();
        const leftInt = top.findIntersection(left);
        const rightInt = top.findIntersection(right);
        top = new Line2d(leftInt, rightInt);
        left = Line2d.startAndTheta(leftInt, left.negitive().radians(), tk.tkh());
        right = Line2d.startAndTheta(rightInt, right.radians(), tk.tkh());
        toeKickLines.push(right, left, top);
        const tkCenter = Center(tk);
        hoverMap.add(tkCenter, 30, {target: tk, center: tkCenter});
      });
    }

    function buildDividerLabel(section) {
      if (section.divideRight()) {
        const dp = section.divider();
        const outer = section.coordinates().outer;
        const rotatedLine = rotatedLineFunc(coDirRotz, center);
        const text = dp.userFriendlyId().replace(/^dv/, '');
        const dividerCenter = Center(dp);
        labels.dividers.push({text, center: dividerCenter});
        hoverMap.add(dividerCenter, 30, {target: dp, center: dividerCenter});
      }
    }

    function buildLabels() {
      OpeningSketch.dividerSections(_cabinet)
              .forEach(s => buildDividerLabel(s));
      OpeningSketch.demensionSections(_cabinet)
              .forEach(s => buildSectionLabel(s));
    }

    function DualDoorSectionPolys(coverSection, poly) {
      const cover = coverSection.cover();
      const gap = cover.gap();
      const normals = cover.normals();
      const polyDems = Polygon3D.demensions(poly, normals);
      const width = (polyDems.x - gap)/2;
      const lines = poly.lines();
      const rightVect = lines[0].vector().unit();
      const centerLeft = lines[3].midpoint().translate(rightVect.scale(width/2));
      const centerRight = lines[1].midpoint().translate(rightVect.scale(-width/2));
      const left = Polygon3D.fromVectorObject(width, polyDems.y, centerLeft, normals);
      const right = Polygon3D.fromVectorObject(width, polyDems.y, centerRight, normals);
      return {left, right};
    }

    function buildCovers() {
      leafSections.forEach(section => {
        let polys = [];
        // const section = section.linkListFind('parentAssembly', a => a && a.cover && a.cover() || a.divideRight()));
        const ip = section.innerPoly();
        ip.rotate(coDirRotz, center);
        hoverMap.add(ip, 30, {target: section, center: Center(section)});
        if (section.cover()) {
          const cover = section.cover();
          if (cover.constructor.name === 'PanelSection') return;
          const poly = section.approximateCoverPoly();
          const isDDS = cover.constructor.name === 'DualDoorSection';
          const {left, right} = isDDS ? DualDoorSectionPolys(section, poly) : {};
          if (isDDS) polys.push(left,right)
          else polys.push(poly);

          const pulls = cover.children().filter(c => c.pulls).map(c => c.pulls()).concatElements();
          pulls.forEach(pull => {
            const doorPoly = !isDDS ? undefined : (pull.parentAssembly().partCode() === 'Dl' ? left : right);
            pull.locations(doorPoly).forEach(l => {
              const line = Line3D.fromVector(new Vector3D(pull.centerToCenter(), 0, 0));
              if (l.rotate === true) line.rotate({z: 90});
              const line2d = line.centerOn(l.center.rotate(coDirRotz, center, true)).to2D('x','y');
              line2d.color = pull.color;
              pullLines.push(line2d);
            });
          });
          polys.forEach(poly => {
            poly.rotate(coDirRotz, center);
            sectionPolys.push(poly);
          });
        } else {
          sectionPolys.push(ip);
        }
      });
    }

    let calls = 1;
    const openingIndex = 0
    function build(force) {
      const currHash = _cabinet.hash();
      if (force !== true && currHash === cabHash) return;
      cabHash = currHash;
      init();
      labels = {sections: [], dividers: []}
      pullLines = [];
      toeKickLines = [];
      sectionPolys = [];
      hoverMap.clear();
      allLines = undefined;
      try {
        // if (_cabinet.openings.length === 0) return;
        // if (_cabinet.openings.length > 1) throw new Error('Not Set Up for multiple openings: Should consider creating seperate canvas for each opening');
        // sketch.clear()
        // sketch.ctx().drawImage(0,0)

        const norms = _cabinet.openings[openingIndex].normals();
        coDirRotz = Vector3D.coDirectionalRotations([norms.x, norms.y], [Vector3D.i, Vector3D.j]);
        center = _cabinet.buildCenter();

        innerLines = [];
        outerLines = [];
        const rotatedLine = rotatedLineFunc(coDirRotz, center);

        let treatedAsLeaf = (a) =>
                          (a.sections[0] && a.sections[0].sections.length === 0 &&
                          a.sections.length === 1 &&
                          !a.sections[0].cover());
        leafSections = _cabinet.allAssemblies().filter(a => a.constructor.name === 'SectionProperties')
            .filter(a => (a.sections.length === 0 && (a.isRoot() || !treatedAsLeaf(a.parentAssembly()))) ||
                          (a.sections.length !== 0 && treatedAsLeaf(a)) || a.divideRight() || a.cover());
        for (let index = 0; index < leafSections.length; index++) {
          const section = leafSections[index];
          const inner = JSON.copy(section.coordinates().inner);
          const outer = JSON.copy(section.coordinates().outer);

          if (!section.cover() || section.cover().constructor.name !== 'PanelSection')
            innerLines.concatInPlace([rotatedLine(inner[0], inner[1]),
                                      rotatedLine(inner[1], inner[2]),
                                      rotatedLine(inner[2], inner[3]),
                                      rotatedLine(inner[3], inner[0])]);
          outerLines.concatInPlace([rotatedLine(outer[0], outer[1]),
                                    rotatedLine(outer[1], outer[2]),
                                    rotatedLine(outer[2], outer[3]),
                                    rotatedLine(outer[3], outer[0])]);
        }

        let dems = _cabinet.position().demension();
        if (_modelInfo) {
          model = _modelInfo.unioned.boxOnly().clone();
          model.rotate(coDirRotz);
          model.center(center);
          const silhouette = _modelInfo.unioned.silhouettes().openings[openingIndex];
          dems = model.demensions();
          cabinetOutlines = silhouette.rotate(coDirRotz, center, true).to2D('x', 'y').lines();
        }

        innerLines = Line3D.to2D(innerLines, 'x', 'y');
        outerLines = Line3D.to2D(outerLines, 'x', 'y');
        allLines = innerLines.concat(outerLines).concat(cabinetOutlines);
        buildCovers();
        buildLabels();
        buildToeKicks();
        panZ.positionOn(center, dems);
        panZ.update(true);
      } catch (e) {
        console.error(e);
      }
    }

    const settings = new OpeningSketchSettings();
    this.settings = () => settings;

    const idProps = {size: '10px', mirror:{x:true}};
    function drawLabels() {
      if (settings.SECTION_INDICIES())
        labels.sections.forEach(label =>
          sketch.text(label.text, label.center, idProps));
      if (settings.DIVIDER_INDICIES())
        labels.dividers.forEach(label =>
          sketch.text(label.text, label.center, idProps));
    }


    function drawCovers() {
      sectionPolys.forEach(lines => sketch(lines, null, .1));
      pullLines.forEach(line => sketch(line, line.color(), 1));
    }

    function draw() {
      // build.subtle('OpenSketchBuilder', 500);
      if (allLines) {
        sketch(cabinetOutlines, 'black', .3);
        sketch(toeKickLines, 'black', .3);
        if (settings.INNER_LINES()) sketch(innerLines, 'black', .1);
        if (settings.OUTER_LINES()) sketch(outerLines, 'green', .1);

        drawLabels();
        if (settings.COVERS()) drawCovers();
        const hovering = hoverMap.hovering();
        if (hovering) sketch(hovering.center, 'green', 2);
        if (selected) sketch(selected.center, 'blue', 2);
        sketch.vertex(panZ.displayTransform.realPosition(), 'red', 2.5);
        // const measurements = LineMeasurement2d.measurements(allLines);
        // sketch(measurements, 'grey', 1);
      }
    }


    const dividerTemplate = new $t('advanced/cabinet/divider');
    const toeKickTemplate = new $t('cabinet/toe-kick');
    const Displays = {
      OpeningToeKick: (toeKick) => toeKickTemplate.render({toeKick, inputs, Measurement}),
      Divider: (divider) => dividerTemplate.render({divider, inputs, Measurement}),
      SectionProperties: (section) => {
        const patterInputHtml = Controller.patterInputHtml(section);
        const scope = {section, inputs, patterInputHtml};
        return Controller.html(section);
      }
    }

    let selected;
    function updateDisplay(targetObj) {
      if (!targetObj) return;
      selected = targetObj;
      const center = targetObj.center;
      let target = targetObj.target;
      if(!Displays[target.constructor.name]) return;
      const html = Displays[target.constructor.name](target);
      du.find('.obj-layout-cnt').innerHTML = html;
    }

    du.on.match('click', '[layout-target-id]', (elem) => {
      const target = Lookup.get(elem.getAttribute('layout-target-id'));
      const center = Center(target);
      updateDisplay({target, center});
    });

    du.on.match('click', '#force-object-drawing-build', () => build(true));

    let sizeHash;
    let cabHash;
    Cabinet.on.change(() => {
      build.lastCall('openSketchBuild', 500);
    });

    this.draw = draw;

    function init() {
      if (panZ) return;
      let canvas = du.find(selector);
      if (canvas.tagName !== 'CANVAS') {
        let elem = canvas;
        canvas = du.create.element('canvas', {class: 'mirror-x upside-down build-diagram'});
        sketch = new Draw2D(canvas);
        sketch.staticOffset = true;
        elem.append(canvas);
      } else {
        sketch = new Draw2D(canvas);
      }
      panZ = new PanZoomClickMeasure(canvas, draw, () => hoverMap);
      panZ.on.click(() => updateDisplay(hoverMap.hovering()));
      instance.update = panZ.update;
    }
  }
}

const pcIsS = a => a.partCode() === 'S';
const parentHasCover = c => pcIsS(c) && c.cover();
const childHasDividerOrCover = c => pcIsS(c) && (c.divideRight() || c.cover());
const dividerSectionFilter = a => pcIsS(a) && a.divideRight();
const demensionSectionFilter = a => pcIsS(a) && (a.shelves().length ||
              (a.getSubassemblies().filter(childHasDividerOrCover).length === 0 &&
              a.ancestors().filter(parentHasCover).length === 0));
OpeningSketch.demensionSections = (cabinet) => cabinet.allAssemblies().filter(demensionSectionFilter)
OpeningSketch.dividerSections = (cabinet) => cabinet.allAssemblies().filter(dividerSectionFilter);

module.exports = OpeningSketch;
