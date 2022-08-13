
const Circle2D = require('circle');
const Vertex2D = require('vertex');
const Line2D = require('line');

class LineMeasurement2D extends Lookup {
  constructor(line, modificationFunction) {
    super();
    modificationFunction = modificationFunction || line.length;
    const offset = 10;
    this.line = () => line;
    this.I = (layer) => {
      layer = layer || 1;
      const termDist = (layer + 1) * offset;
      const measureDist = layer * offset;
      const startLine = line.perpendicular(line.startVertex(), termDist * 2);
      const endLine = line.perpendicular(line.endVertex(), termDist * 2);
      const startCircle = new Circle2D(measureDist, line.startVertex());
      const endCircle = new Circle2D(measureDist, line.endVertex());
      const startTerminationCircle = new Circle2D(termDist, line.startVertex());
      const endTerminationCircle = new Circle2D(termDist, line.endVertex());
      const startVerticies = startCircle.intersections(startLine);
      const endVerticies = endCircle.intersections(endLine);
      let inner, outer;
      if (startVerticies.length > 0 && endVerticies.length > 0) {
        const startTerminationVerticies = startTerminationCircle.intersections(startLine);
        const endTerminationVerticies = endTerminationCircle.intersections(endLine);
        let startTerminationLine, endTerminationLine, measurementLine;
        const center = Vertex2D.center.apply(null, line.startVertex().verticies());

        inner = new Line2D(startVerticies[1], endVerticies[1]);
        inner.startLine = new Line2D(line.startVertex(), startTerminationVerticies[1]);
        inner.endLine = new Line2D(line.endVertex(), endTerminationVerticies[1]);

        outer = new Line2D(startVerticies[0], endVerticies[0]);
        outer.startLine = new Line2D(line.startVertex(), startTerminationVerticies[0]);
        outer.endLine = new Line2D(line.endVertex(), endTerminationVerticies[0]);
        const furtherLine = (point) => LineMeasurement2D.furtherLine(inner, outer, point);
        const closerLine = (point) => LineMeasurement2D.furtherLine(inner, outer, point, true);
        return {inner, outer, furtherLine, closerLine};
      } else {
        return {};
      }
    }

    this.copy = (modFunc) => new LineMeasurement2D(line, modFunc);
    this.modificationFunction = (func) => {
      if ((typeof func) === 'function') modificationFunction = func;
      return modificationFunction;
    }

    this.display = () => new Measurement(line.length()).display();

    this.modify = (value) => modificationFunction(new Measurement(value, true).decimal());
  }
}

LineMeasurement2D.furtherLine = (inner, outer, point, closer) =>
    inner.midpoint().distance(point) > outer.midpoint().distance(point) ?
      (closer ? outer : inner) :
      (closer ? inner : outer);
