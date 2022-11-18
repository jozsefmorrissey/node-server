
const du = require('../../../../public/js/utils/dom-utils.js');
const Draw2D = require('../two-d/draw.js');
const Line2d = require('../two-d/objects/line.js');
const Vertex2d = require('../two-d/objects/vertex.js');
const PanZoom = require('../two-d/pan-zoom.js');
const LineMeasurement2d = require('../two-d/objects/line-measurement.js');


class LayouSketch {
  constructor(id) {
    let sketch, panZ, elem, cabinet;

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

    function draw() {
      if (cabinet === undefined) return;
      // sketch.ctx().drawImage(0,0)

      const allLines = [];
      for (let index = 0; index < cabinet.openings.length; index++) {
        const sections = getSections(cabinet.openings[index].sections);
        for (let si = 0; si < sections.length; si++) {
          const section = sections[si];
          if (section.sections.length < 1) {
            const center = JSON.copy(section.innerCenter());
            center.y*=-1;
            sketch.text(section.partCode(), center, 6, 'grey');
          }
          const inner = JSON.copy(section.coordinates().inner);
          // For some reason the sketch canvas is mirrored in the y direction
          inner[0].y*=-1;inner[1].y*=-1;inner[2].y*=-1;inner[3].y*=-1;
          let lines = [new Line2d(inner[0], inner[1]),
                          new Line2d(inner[1], inner[2]),
                          new Line2d(inner[2], inner[3]),
                          new Line2d(inner[3], inner[0])];
          sketch(lines, undefined, .3);
          const outer = JSON.copy(section.coordinates().outer);
          // For some reason the sketch canvas is mirrored in the y direction
          outer[0].y*=-1;outer[1].y*=-1;outer[2].y*=-1;outer[3].y*=-1;
          lines = [new Line2d(outer[0], outer[1]),
                          new Line2d(outer[1], outer[2]),
                          new Line2d(outer[2], outer[3]),
                          new Line2d(outer[3], outer[0])];
          sketch(lines, 'green', .3);
          allLines.concatInPlace(lines);
        }
      }
      const cabLimits = cabinet.position().limits();
      const cabinetOutline = [
        new Line2d({x: 0, y: -2*cabLimits['y']}, {x: 2*cabLimits['x'], y: -2*cabLimits['y']}),
        new Line2d({x: 2*cabLimits['x'], y: -2*cabLimits['y']}, {x: 2*cabLimits['x'], y: 0}),
        new Line2d({x: 2*cabLimits['x'], y: 0}, {x: 0, y: 0}),
        new Line2d({x: 0, y: 0}, {x: 0, y: -2*cabLimits['y']}),
      ];
      sketch(cabinetOutline, 'red', .3);
      allLines.concatInPlace(cabinetOutline);

      const measurements = LineMeasurement2d.measurements(allLines);
      sketch(measurements, 'grey', 1);
    }

    function init() {
      elem = du.id(id);
      const canvas = du.create.element('canvas');
      elem.append(canvas);
      sketch = new Draw2D(canvas);
      panZ = new PanZoom(sketch.canvas(), draw);
    }

    this.cabinet = (cab) => (cab.constructor.name === 'Cabinet' && (cabinet = cab)) || cabinet;

    setTimeout(init, 500);
  }
}

module.exports = LayouSketch;
