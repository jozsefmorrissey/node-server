
const du = require('../../../../public/js/utils/dom-utils.js');
const Draw2D = require('../../../../public/js/utils/canvas/two-d/draw.js');
const Line2d = require('../../../../public/js/utils/canvas/two-d/objects/line.js');
const Vertex2d = require('../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Polygon2d = require('../../../../public/js/utils/canvas/two-d/objects/polygon.js');
const Parimeters2d = require('../../../../public/js/utils/canvas/two-d/maps/parimeters.js');
const EscapeMap = require('../../../../public/js/utils/canvas/two-d/maps/escape.js');

const {Vector3D, Vertex3D, Line3D, Polygon3D} = require('../../../../public/js/utils/canvas/three-d/lib');

const PanZoom = require('../../../../public/js/utils/canvas/two-d/pan-zoom.js');
const LineMeasurement2d = require('../../../../public/js/utils/canvas/two-d/objects/line-measurement.js');
const Cabinet = require('../objects/assembly/assemblies/cabinet.js');
const Global = require('../services/global.js');

const rotatedLineFunc = (coDirRotz, center) => (p1, p2) => new Line3D(p1,p2).rotate(coDirRotz, center);

class OpeningSketch {
  constructor(selector, cabinet, cabinetInfo) {
    let sketch, panZ, canvas, elem;
    const instance = this;
    if (cabinet === undefined) throw new Error('Cannot make a sketch without a cabinet!!!!');
    this.canvas = canvas;

    const idProps = {size: '10px', mirror:{x:true}};
    function drawSectionLabel(section, center, coDirRotz) {
      const openingCenter = new Vertex3D(JSON.copy(section.inner.center()))
                            .rotate(coDirRotz, center).to2D('x', 'y');
      let text = section.userFriendlyIndex();
      if (text === 'S') text = '1';
      sketch.text(text, openingCenter, idProps);
    }

    function drawDividerLabel(section, center, coDirRotz) {
      if (section.divideRight()) {
        const dp = section.divider();
        const outer = section.coordinates().outer;
        const rotatedLine = rotatedLineFunc(coDirRotz, center);
        const divideCenter3D = section.parentAssembly().vertical() ?
                                rotatedLine(outer[1], outer[2]).midpoint() :
                                rotatedLine(outer[2], outer[3]).midpoint();
        const dividerCenter = divideCenter3D.to2D('x', 'y');
        const text = dp.userFriendlyId().replace(/^dv/, '');
        sketch.text(text, dividerCenter, idProps);
      }
    }

    function drawLabels(center, coDirRotz, cabinet) {
      OpeningSketch.dividerSections(cabinet)
              .forEach(s => drawDividerLabel(s, center, coDirRotz));
      OpeningSketch.demensionSections(cabinet)
              .forEach(s => drawSectionLabel(s, center, coDirRotz));
    }

    function draw() {
      try {
        if (cabinet.openings.length === 0) return;
        // if (cabinet.openings.length > 1) throw new Error('Not Set Up for multiple openings: Should consider creating seperate canvas for each opening');
        sketch.clear()
        // sketch.ctx().drawImage(0,0)

        const model = cabinetInfo.model.boxOnly.clone();
        const coDirRotz = Vector3D.coDirectionalRotations(cabinet.normals(true));
        const center = model.center();
        model.rotate(coDirRotz);
        model.center(center);

        let innerLines = [];
        let outerLines = [];
        const rotatedLine = rotatedLineFunc(coDirRotz, center);
        const sections = cabinet.allAssemblies()
            .filter(a => a.constructor.name === 'SectionProperties' && a.sections.length === 0);
        for (let index = 0; index < sections.length; index++) {
          const section = sections[index];
          const inner = JSON.copy(section.coordinates().inner);
          const outer = JSON.copy(section.coordinates().outer);

          innerLines.concatInPlace([rotatedLine(inner[0], inner[1]),
                                    rotatedLine(inner[1], inner[2]),
                                    rotatedLine(inner[2], inner[3]),
                                    rotatedLine(inner[3], inner[0])]);
          outerLines.concatInPlace([rotatedLine(outer[0], outer[1]),
                                    rotatedLine(outer[1], outer[2]),
                                    rotatedLine(outer[2], outer[3]),
                                    rotatedLine(outer[3], outer[0])]);
        }
        const view = Polygon3D.fromCSG(model);
        const lines = view.map(p => p.lines()).concatElements();
        const lines2d = Line2d.consolidate(lines.map(l => l.to2D('x','y')));
        const cabinetOutlines = Parimeters2d.lines(lines2d).map(l => l.clone());


        innerLines = Line3D.to2D(innerLines, 'x', 'y');
        outerLines = Line3D.to2D(outerLines, 'x', 'y');
        const allLines = innerLines.concat(outerLines);

        const dems = {x: model.demensions().x, y: model.demensions().y};


        sketch.position(center, dems);
        allLines.concatInPlace(cabinetOutlines);
        sketch(innerLines, 'black', .3);
        // sketch(outerLines, 'green', .3);
        sketch(cabinetOutlines, 'black', .3);

        drawLabels(center, coDirRotz, cabinet);
        // const measurements = LineMeasurement2d.measurements(allLines);
        // sketch(measurements, 'grey', 1);
      } catch (e) {
        console.error(e);
      }
    }
    this.draw = draw;

    function init() {
      let canvas = du.find(selector);
      if (canvas.tagName !== 'CANVAS') {
        let elem = canvas;
        canvas = du.create.element('canvas', {class: 'mirror-x upside-down build-diagram'});
        sketch = new Draw2D(canvas);
        sketch.staticOffset = true;
        elem.append(canvas);
      }
      draw();
      // new PanZoom(canvas, draw);
    }

    init();
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
