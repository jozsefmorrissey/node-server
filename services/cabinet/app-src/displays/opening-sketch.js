
const du = require('../../../../public/js/utils/dom-utils.js');
const Draw2D = require('../../../../public/js/utils/canvas/two-d/draw.js');
const Line2d = require('../../../../public/js/utils/canvas/two-d/objects/line.js');
const Vertex2d = require('../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Polygon2d = require('../../../../public/js/utils/canvas/two-d/objects/polygon.js');
const Parimeters2d = require('../../../../public/js/utils/canvas/two-d/maps/parimeters.js');
const EscapeMap = require('../../../../public/js/utils/canvas/two-d/maps/escape.js');
const Vertex3D = require('../three-d/objects/vertex.js');
const Line3D = require('../three-d/objects/line.js');
const Polygon3D = require('../three-d/objects/polygon.js');
const PanZoom = require('../../../../public/js/utils/canvas/two-d/pan-zoom.js');
const LineMeasurement2d = require('../../../../public/js/utils/canvas/two-d/objects/line-measurement.js');
const Cabinet = require('../objects/assembly/assemblies/cabinet.js');
const Global = require('../services/global.js');

class OpeningSketch {
  constructor(selector, cabinet, modelInfo) {
    let sketch, panZ, canvas, elem;
    const instance = this;
    if (cabinet === undefined) throw new Error('Cannot make a sketch without a cabinet!!!!');
    this.canvas = canvas;


    function getSections(sections, list) {
      list ||= [];
      for (let index = 0; index < sections.length; index++) {
        const section = sections[index];
        if (sections.length > 0 || sections.cover()) {
          list.push(section);
          getSections(section.sections, list);
        }
      }
      return list;
    }

    const idProps = {size: '10px'};
    function drawSectionLabel(section, offset, normal) {
      if (section.sections.length < 1) {
        const openingCenter = new Vertex3D(JSON.copy(section.innerCenter()))
                                  .viewFromVector(normal).to2D('x', 'y');
        const center = openingCenter.translate(offset.x, offset.y, true).point();
        center.x -= 5;
        const text = section.userFriendlyIndex();
        sketch.text(text, center, idProps);
      }
    }

    function drawDividerLabel(section, offset, normal) {
      if (section.divideRight()) {
        const dp = section.divider().divider();
        const outer = section.coordinates().outer;
        const divideCenter3D = section.parentAssembly().vertical() ?
                                new Line3D(outer[1], outer[2]).midpoint() :
                                new Line3D(outer[2], outer[3]).midpoint();
        const dividerCenter = divideCenter3D.viewFromVector(normal).to2D('x', 'y');
        dividerCenter.point().x -= 5;
        const center = dividerCenter.translate(offset.x, offset.y, true).point();
        const text = dp.userFriendlyId().replace(/^dv/, '');
        sketch.text(text, center, idProps);
      }
    }

    function drawLabels(offset, normal) {
      for (let index = 0; index < cabinet.openings.length; index++) {
        const sections = getSections(cabinet.openings[index].sections());
        for (let si = 0; si < sections.length; si++) {
          const section = sections[si];
          drawSectionLabel(section, offset, normal);
          drawDividerLabel(section, offset, normal);
        }
      }
    }

    function draw() {
      if (cabinet.openings.length === 0) return;
      if (cabinet.openings.length > 1) throw new Error('Not Set Up for multiple openings: Should consider creating seperate canvas for each opening');
      sketch.clear()
      // sketch.ctx().drawImage(0,0)

      let innerLines = [];
      let outerLines = [];
      const normal = cabinet.openings[0].normal().inverse();
      for (let index = 0; index < cabinet.openings.length; index++) {
        const sections = getSections(cabinet.openings[index].sections());
        for (let si = 0; si < sections.length; si++) {
          const section = sections[si];
          const inner = JSON.copy(section.coordinates().inner);
          const outer = JSON.copy(section.coordinates().outer);

          // inner[0].x*=-1;inner[1].x*=-1;inner[2].x*=-1;inner[3].x*=-1;
          // outer[0].x*=-1;outer[1].x*=-1;outer[2].x*=-1;outer[3].x*=-1;
          innerLines.concatInPlace([new Line3D(inner[0], inner[1]),
                          new Line3D(inner[1], inner[2]),
                          new Line3D(inner[2], inner[3]),
                          new Line3D(inner[3], inner[0])]);
          outerLines.concatInPlace([new Line2d(outer[0], outer[1]),
                          new Line3D(outer[1], outer[2]),
                          new Line3D(outer[2], outer[3]),
                          new Line3D(outer[3], outer[0])]);
        }
      }
      const cabDems = cabinet.position().demension();
      const model = modelInfo.unioned();
      const view = Polygon3D.viewFromVector(model, normal);
      const lines2d = Polygon3D.lines2d(view, 'x', 'y');
      const cabinetOutlines = Parimeters2d.lines(lines2d).map(l => l.clone());


      innerLines = Line3D.to2D(Line3D.viewFromVector(innerLines, normal), 'x', 'y');
      outerLines = Line3D.to2D(Line3D.viewFromVector(outerLines, normal), 'x', 'y');
      const allLines = innerLines.concat(outerLines);

      const minMax = Vertex2d.minMax(Line2d.vertices(cabinetOutlines));
      const scaleY = (sketch.canvas().height * .95) / (minMax.max.y() - minMax.min.y());
      const scaleX = (sketch.canvas().width * .95) / (minMax.max.x() - minMax.min.x());
      const minScale = Math.min(scaleX, scaleY);
      sketch.ctx().scale(minScale, minScale);


      const offset = Line2d.centerOn(cabinetOutlines, {
        x: sketch.canvas().width * 1.25/2,
        y: sketch.canvas().height * 1.25/2
      });

      // const offset = {x: 0, y:0}
      Line2d.translate(allLines, offset);
      allLines.concatInPlace(cabinetOutlines);
      sketch(innerLines, undefined, .3);
      // sketch(outerLines, 'green', .3);
      sketch(cabinetOutlines, 'red', .3);

      drawLabels(offset, normal, cabinet);
      // const measurements = LineMeasurement2d.measurements(allLines);
      // sketch(measurements, 'grey', 1);
    }
    this.draw = draw;

    function init() {
      let canvas = du.find(selector);
      if (canvas.tagName !== 'CANVAS') {
        let elem = canvas;
        canvas = du.create.element('canvas', {class: 'build-diagram'});
        sketch = new Draw2D(canvas, true);
        // sketch.ctx().canvas.style.width = '100vw';
        // sketch.ctx().canvas.style.height = '100vh';

        elem.append(canvas);
      }
      draw();
      // new PanZoom(canvas, draw);
    }

    init();
  }
}

module.exports = OpeningSketch;
