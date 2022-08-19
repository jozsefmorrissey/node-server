
const Circle2d = require('circle');
const Vertex2d = require('vertex');
const Line2d = require('line');
const Measurement = require('../../../../../public/js/utils/measurement.js');

class LineMeasurement2d {
  constructor(line, modificationFunction) {
    modificationFunction = modificationFunction || line.length;
    const offset = 10;
    this.line = () => line;
    this.I = (layer) => {
      layer = layer || 1;
      const termDist = (layer + 1) * offset;
      const measureDist = layer * offset;
      const startLine = line.perpendicular(line.startVertex(), termDist * 2);
      const endLine = line.perpendicular(line.endVertex(), termDist * 2);
      const startCircle = new Circle2d(measureDist, line.startVertex());
      const endCircle = new Circle2d(measureDist, line.endVertex());
      const startTerminationCircle = new Circle2d(termDist, line.startVertex());
      const endTerminationCircle = new Circle2d(termDist, line.endVertex());
      const startVerticies = startCircle.intersections(startLine);
      const endVerticies = endCircle.intersections(endLine);
      let inner, outer;
      if (startVerticies.length > 0 && endVerticies.length > 0) {
        const startTerminationVerticies = startTerminationCircle.intersections(startLine);
        const endTerminationVerticies = endTerminationCircle.intersections(endLine);
        let startTerminationLine, endTerminationLine, measurementLine;

        inner = new Line2d(startVerticies[1], endVerticies[1]);
        inner.startLine = new Line2d(line.startVertex(), startTerminationVerticies[1]);
        inner.endLine = new Line2d(line.endVertex(), endTerminationVerticies[1]);

        outer = new Line2d(startVerticies[0], endVerticies[0]);
        outer.startLine = new Line2d(line.startVertex(), startTerminationVerticies[0]);
        outer.endLine = new Line2d(line.endVertex(), endTerminationVerticies[0]);
        const furtherLine = (point) => LineMeasurement2d.furtherLine(inner, outer, point);
        const closerLine = (point) => LineMeasurement2d.furtherLine(inner, outer, point, true);
        return {inner, outer, furtherLine, closerLine};
      } else {
        return {};
      }
    }

    this.copy = (modFunc) => new LineMeasurement2d(line, modFunc);
    this.modificationFunction = (func) => {
      if ((typeof func) === 'function') modificationFunction = func;
      return modificationFunction;
    }

    this.toString = () => `|--${this.line()}--|`;
    this.display = () => new Measurement(line.length()).display();

    this.modify = (value) => modificationFunction(new Measurement(value, true).decimal());
  }
}

LineMeasurement2d.furtherLine = (inner, outer, point, closer) =>
    inner.midpoint().distance(point) > outer.midpoint().distance(point) ?
      (closer ? outer : inner) :
      (closer ? inner : outer);

module.exports = LineMeasurement2d;
