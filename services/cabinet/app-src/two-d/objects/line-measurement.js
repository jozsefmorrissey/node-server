
const Circle2d = require('circle');
const Vertex2d = require('vertex');
const Line2d = require('line');
const Lookup = require('../../../../../public/js/utils/object/lookup');
const Measurement = require('../../../../../public/js/utils/measurement.js');

class LineMeasurement2d {
  constructor(line, center, layer, modificationFunction) {
    const offset = 3;
    this.line = () => line;
    this.I = (l) => {
      l = l || layer || 1;
      const termDist = (l + 1) * offset;
      const measureDist = l * offset;
      const startLine = line.perpendicular(termDist * 2, line.startVertex(), true);
      const endLine = line.perpendicular(termDist * 2, line.endVertex(), true);
      const startCircle = new Circle2d(measureDist, line.startVertex());
      const endCircle = new Circle2d(measureDist, line.endVertex());
      const startTerminationCircle = new Circle2d(termDist - 2.5, line.startVertex());
      const endTerminationCircle = new Circle2d(termDist - 2.5, line.endVertex());
      const startVerticies = startCircle.intersections(startLine);
      const endVerticies = endCircle.intersections(endLine);
      let l1, l2;
      if (startVerticies.length > 0 && endVerticies.length > 0) {
        const startTerminationVerticies = startTerminationCircle.intersections(startLine);
        const endTerminationVerticies = endTerminationCircle.intersections(endLine);
        let startTerminationLine, endTerminationLine, measurementLine;

        l1 = new Line2d(startVerticies[1], endVerticies[1]);
        l1.startLine = new Line2d(line.startVertex(), startTerminationVerticies[1]);
        l1.endLine = new Line2d(line.endVertex(), endTerminationVerticies[1]);

        l2 = new Line2d(startVerticies[0], endVerticies[0]);
        l2.startLine = new Line2d(line.startVertex(), startTerminationVerticies[0]);
        l2.endLine = new Line2d(line.endVertex(), endTerminationVerticies[0]);
        const furtherLine = (point) => LineMeasurement2d.furtherLine(l1, l2, point || center);
        const closerLine = (point) => LineMeasurement2d.furtherLine(l1, l2, point || center, true);
        return {furtherLine, closerLine};
      } else {
        return {};
      }
    }

    this.copy = (modFunc) => new LineMeasurement2d(line, modFunc);
    this.modificationFunction = (func) => {
      if ((typeof func) === 'function') {
        if ((typeof this.id) !== 'function') Lookup.convert(this);
        modificationFunction = func;
      }
      return modificationFunction;
    }

    this.toString = () => `|--${this.line()}--|`;
    this.display = () => new Measurement(line.length()).display();

    this.modify = (value) => modificationFunction(new Measurement(value, true).decimal());

    this.modificationFunction(modificationFunction);
  }
}

LineMeasurement2d.measurements = (lines) => {
  const verts = Line2d.vertices(lines);
  const center = Vertex2d.center(...verts);
  const measurements = [];
  for (let tIndex = 0; tIndex < lines.length; tIndex += 1) {
    const tarVerts = lines[tIndex].liesOn(verts);
    if (tarVerts.length > 2) {
      for (let index = 1; index < tarVerts.length; index += 1) {
        const sv = tarVerts[index - 1];
        const ev = tarVerts[index];
        const line = new Line2d(sv,ev);
        measurements.push(new LineMeasurement2d(line, center, 1));
      }
    }
    if (tarVerts.length > 1) {
      const sv = tarVerts[0];
      const ev = tarVerts[tarVerts.length - 1];
      const line = new Line2d(sv,ev);
      measurements.push(new LineMeasurement2d(line, center, 2));
    }
  }
  return measurements;
}

LineMeasurement2d.furtherLine = (l1, l2, point, closer) =>
    point === undefined ? (closer ? l1 : l2) :
    (l1.midpoint().distance(point) > l2.midpoint().distance(point) ?
      (closer ? l2 : l1) :
      (closer ? l1 : l2));

module.exports = LineMeasurement2d;
