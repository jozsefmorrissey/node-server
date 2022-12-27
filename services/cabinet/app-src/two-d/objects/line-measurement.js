
const Circle2d = require('circle');
const Vertex2d = require('vertex');
const Line2d = require('line');
const Lookup = require('../../../../../public/js/utils/object/lookup');
const Measurement = require('../../../../../public/js/utils/measurement.js');
const approximate = require('../../../../../public/js/utils/approximate.js');
const ToleranceMap = require('../../../../../public/js/utils/tolerance-map.js');

class LineMeasurement2d {
  constructor(line, center, layer, modificationFunction) {
    const offset = 3;
    this.line = () => line;

    function modifyMeasurment(offsetLine, line, buffer, takenLocations) {
      const startLength = line.startLine.length();
      line.startLine.length(startLength + buffer);
      line.endLine.length(startLength + buffer);
      line.translate(offsetLine);
      let notTaken = true;
      const point = line.midpoint();
      for (let index = 0; index < takenLocations.length; index++) {
        const locationInfo = takenLocations[index];
        const takenPoint = locationInfo.point;
        const biggestBuffer = locationInfo.buffer < buffer ? locationInfo.buffer : buffer;
        if (takenPoint.distance(point) < biggestBuffer) {
          if (takenPoint.length === length) return;
          notTaken = false;
        }
      }
      return notTaken === true ? point : undefined;
    }

    function notTaken(obj) {
      return (buffer) => {
        buffer ||= 7.5;
        const closer = obj.closerLine();
        const further = obj.furtherLine();
        const cStartL = further.startLine
        const cEndL = further.endLine
        const offsetLine = cStartL.copy();
        offsetLine.length(buffer);
        const length = approximate(further.length());
        do {
          const point = modifyMeasurment(offsetLine, further, buffer, obj.takenLocations);
          if (point) {
            obj.takenLocations.push({point, buffer, length});
            return further;
          }
        } while (buffer < 1000);
      }
    }
    this.I = (l, takenLocations) => {
      takenLocations ||= [];
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
        const obj = {furtherLine, closerLine, takenLocations};
        obj.midpointClear = notTaken(obj);
        return obj;
      } else {
        throw new Error('No Intersection???');
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

function measurementLevel(line) {
  if ((typeof line.length) !== 'function')
    console.log(line);

  return Math.log(line.length()*line.length())*2;
}

const lengthSortFunc = (center) => (l1, l2) => {
  const lengthDiff = l1.length() - l2.length();
  if (lengthDiff !== 0)
    return lengthDiff;
  return center.distance(l2.midpoint()) - center.distance(l1.midpoint());
}
LineMeasurement2d.measurements = (lines) => {
  const verts = Line2d.vertices(lines);
  const center = Vertex2d.center(...verts);
  lines.sort(lengthSortFunc(center));
  // lines.sort(lengthSortFunc(center));
  const measurements = [];
  const lengthMap = new ToleranceMap({length: .00001});
  for (let tIndex = 0; tIndex < lines.length; tIndex += 1) {
    const tarVerts = lines[tIndex].liesOn(verts);
    if (tarVerts.length > 2) {
      for (let index = 1; index < tarVerts.length; index += 1) {
        const sv = tarVerts[index - 1];
        const ev = tarVerts[index];
        const line = new Line2d(sv,ev);
        lengthMap.add(line);
      }
    }
    if (tarVerts.length > 1) {
      const sv = tarVerts[0];
      const ev = tarVerts[tarVerts.length - 1];
      const line = new Line2d(sv,ev);
      lengthMap.add(line);
    }
  }


  const lengths = Object.keys(lengthMap.map());
  const slopeMap = new ToleranceMap({length: .00001, slope: .1});
  for (index = 0; index < lengths.length; index += 1) {
    let lines = lengthMap.map()[lengths[index]];
    //TODO: possibly restrict the measurements that display....
    for(let li = 0; li < lines.length; li++) {
      const line = lines[li];
      const perpLine = line.perpendicular();
      if (slopeMap.matches(perpLine).length === 0) {
        slopeMap.add(perpLine);
      } else {
        lines.splice(li, 1);
        li--;
      }
    }
    measurements.concatInPlace(lines);
  }

  for (let index = 0; index < measurements.length; index++)
    if (approximate.abs(measurements[index].length()) !== 0)
      measurements[index] = new LineMeasurement2d(measurements[index], center, measurementLevel(measurements[index]));
    else
      measurements.splice(index--, 1);

  return measurements;
}

LineMeasurement2d.furtherLine = (l1, l2, point, closer) =>
    point === undefined ? (closer ? l1 : l2) :
    (l1.midpoint().distance(point) > l2.midpoint().distance(point) ?
      (closer ? l2 : l1) :
      (closer ? l1 : l2));

module.exports = LineMeasurement2d;
