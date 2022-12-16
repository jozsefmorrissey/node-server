
const Circle2d = require('circle');
const Vertex2d = require('vertex');
const Line2d = require('line');
const Lookup = require('../../../../../public/js/utils/object/lookup');
const Measurement = require('../../../../../public/js/utils/measurement.js');
const approximate = require('../../../../../public/js/utils/approximate.js');

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
        buffer ||= 20;
        const closer = obj.closerLine();
        const further = obj.furtherLine();
        const cStartL = closer.startLine
        const cEndL = closer.endLine
        const offsetLine = cStartL.copy();
        offsetLine.length(buffer);
        const length = approximate(closer.length());
        do {
          const point = modifyMeasurment(offsetLine, closer, buffer, obj.takenLocations);
          if (point) {
            obj.takenLocations.push({point, buffer, length});
            return closer;
          } else if (point === undefined) return;
        } while (true);
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

LineMeasurement2d.measurements = (lines) => {
  lines.reorder();
  const verts = Line2d.vertices(lines);
  const center = Vertex2d.center(...verts);
  const measurements = [];
  const lengthMap = {};
  for (let tIndex = 0; tIndex < lines.length; tIndex += 1) {
    const tarVerts = lines[tIndex].liesOn(verts);
    if (tarVerts.length > 2) {
      for (let index = 1; index < tarVerts.length; index += 1) {
        const sv = tarVerts[index - 1];
        const ev = tarVerts[index];
        const line = new Line2d(sv,ev);
        const length = approximate(line.length());
        if (lengthMap[length] === undefined) lengthMap[length] = [];
        lengthMap[length].push(line);
        // measurements.push(new LineMeasurement2d(line, center, 1));
      }
    }
    if (tarVerts.length > 1) {
      const sv = tarVerts[0];
      const ev = tarVerts[tarVerts.length - 1];
      const line = new Line2d(sv,ev);
      const length = approximate(line.length());
      if (lengthMap[length] === undefined) lengthMap[length] = [];
      lengthMap[length].push(line);
      // measurements.push(new LineMeasurement2d(line, center, 2));
    }
  }

  const lengths = Object.keys(lengthMap);
  for (index = 0; index < lengths.length; index += 1) {
    const slopeMap = {};
    let lines = lengthMap[lengths[index]];
    for(let li = 1; li < lines.length; li++) {
      const line = lines[li];
      const mp1 = lines[li-1].midpoint();
      const mp2 = line.midpoint();
      if (!mp1.equal(mp2)) {
        const center2center = new Line2d(mp1, mp2);
        const slopeMag = approximate.abs(center2center.slope());
        if (!slopeMap[slopeMag] && approximate(line.length()) !== 0) {
          for (let si = 0; si < li; si++) {
            const c2c = new Line2d(lines[si].midpoint(), line.midpoint());
            const slopeMag = approximate.abs(center2center.slope());
            slopeMap[slopeMag] = true;
          }
        } else {
          lines.splice(li, 1);
          li--;
        }
      }
    }
    if (lines.length > 1) lines.splice(0,1);
    measurements.concatInPlace(lines);
  }

  for (let index = 0; index < measurements.length; index++)
    if (approximate.abs(measurements[index].length()) !== 0)
      measurements[index] = new LineMeasurement2d(measurements[index], center, measurementLevel(measurements[index]));

  return measurements;
}

LineMeasurement2d.furtherLine = (l1, l2, point, closer) =>
    point === undefined ? (closer ? l1 : l2) :
    (l1.midpoint().distance(point) > l2.midpoint().distance(point) ?
      (closer ? l2 : l1) :
      (closer ? l1 : l2));

module.exports = LineMeasurement2d;
