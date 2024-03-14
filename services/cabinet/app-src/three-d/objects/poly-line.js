
const Line3D = require('line');
const Vertex3D = require('vertex');
const Plane = require('plane');
const Matrix = require('matrix');

const infoVectorSort = (center, vector) => {
  return (info1, info2) => {
    const vert1 = info1.start;
    const vert2 = info2.start;
    const line1dot = vector.dot(vert1.minus(center));
    const line2dot = vector.dot(vert2.minus(center));
    return line2dot - line1dot;
  }
}

class PolyLine3D extends Line3D {
  constructor(line1, line2, clampAll, clampA0, clampA1, clampB0, clampB1) {
    line1 = line1.clone();
    line2 = line2.clone();
    clampAll ||= false;
    clampA0 ||= clampAll; clampA1 ||= clampAll; clampB0 ||= clampAll; clampB1 ||= clampAll;
    line1.startVertex.clamp = clampA0;
    line1.endVertex.clamp = clampA1;
    line2.startVertex.clamp = clampB0;
    line2.endVertex.clamp = clampB1;
    let sortedClamps = [line1.startVertex, line1.endVertex, line2.startVertex, line2.endVertex];
    Vertex3D.vectorSort(sortedClamps, line1.vector().unit(), Vertex3D.center(...sortedClamps));
    if (!line1.isParrelle(line2)) {
      console.warn(`These lines are not parrelle:\n\t${line1.toString()}\n\t${line2.toString()}`);
      return undefined;
    }
    let startLine, endLine, centerLine;

    const interInfo = [];
    const intersectionInfo = (line, plane, start, excludeBefore, excludeAfter) => {
      let end;
      if (excludeBefore && excludeAfter) end = plane.intersection.line.segment(line);
      else if (excludeBefore) end = plane.intersection.line.directional(line);
      else if (excludeAfter) end = plane.intersection.line.directional(line.negitive());
      else end = plane.intersection.line(line);
      if (end) {
        interInfo.push({end, start, plane});
      }
    }
    const unitVec = line1.vector().unit();
    const plane1 = Plane.fromPointNormal(line1.startVertex, unitVec);
    plane1.clamp = clampA0;
    plane1.initialVert = line1.midp;
    const plane2 = Plane.fromPointNormal(line1.endVertex, unitVec);
    plane2.clamp = clampA1;
    plane2.initialVert = line1.endVertex;
    const plane3 = Plane.fromPointNormal(line2.startVertex, unitVec);
    plane3.clamp = clampB0;
    plane3.initialVert = line2.startVertex;
    const plane4 = Plane.fromPointNormal(line2.endVertex, unitVec);
    plane4.clamp = clampB1;
    plane4.initialVert = line2.endVertex;
    intersectionInfo(line2, plane1, line1.startVertex, clampB0, clampB1);
    intersectionInfo(line2, plane2, line1.endVertex, clampB0, clampB1);
    intersectionInfo(line1, plane3, line2.startVertex, clampA0, clampA1);
    intersectionInfo(line1, plane4, line2.endVertex, clampA0, clampA1);
    const center = Vertex3D.center(line1.startVertex, line1.endVertex, line2.startVertex, line2.endVertex);
    interInfo.sort(infoVectorSort(sortedClamps[0], line1.vector().unit()));
    let infinityPlus = false;
    let infinityNegitive = false;
    if (interInfo.length >= 2) {
      const startIndex = interInfo.length - 1;
      startLine = new Line3D(interInfo[startIndex].start, interInfo[startIndex].end);
      endLine = new Line3D(interInfo[0].start, interInfo[0].end).acquiescent(startLine);
      centerLine = Line3D.averageLine([startLine, endLine]);

      sortedClamps = sortedClamps.filter(v => v.clamp);
      if (sortedClamps.length === 0) {
        infinityPlus = true;
        infinityNegitive = true;
      } else if (sortedClamps.length === 1) {
        if (sortedClamps[0].minus(centerLine.midpoint()).dot(line1.vector()) >= 0) infinityNegitive = true;
        else infinityPlus = true;
      }

      super(centerLine.startVertex, centerLine.endVertex);
    } else if (interInfo.length === 1){
      startLine = centerLine = endLine = new Line3D(interInfo[0].start, interInfo[0].end);
    } else {
      startLine = centerLine = endLine = new Line3D([0,0,0],[0,0,0]);
      super(centerLine.startVertex, centerLine.endVertex);
    }

    this.startLine = () => startLine.clone();
    this.endLine = () => endLine.clone();
    this.centerLine = () => centerLine.clone();

    function span(isInfinite) {
      if (isInfinite) return Infinity;
      const dist = startLine.startVertex.distance(endLine.startVertex);
      return dist;
    }
    this.span = () => span(infinityPlus || infinityNegitive);
    this.span.positive = () => span(infinityPlus);
    this.span.negitive = () => span(infinityNegitive);

    function spanLine(scale, startVertex) {
      const vector = new Line3D(startLine.startVertex, endLine.startVertex).vector().scale(scale);
      const perpEnd = startVertex.clone().translate(vector);
      return new Line3D(startVertex, perpEnd);
    }

    this.span.line = () => spanLine(1, startLine.midpoint());
    this.span.positive.line = () => spanLine(.5, centerLine.midpoint());
    this.span.negitive.line = () => spanLine(-.5, centerLine.midpoint());


    this.inverse = () => {
      return new PolyLine3D(line2, line1, clampAll, clampB0, clampB1, clampA0, clampA1);
    }

    this.negitive = () => new PolyLine3D(line1.negitive(), line2.negitive(), clampAll, clampA1, clampA0, clampB1, clampB0);

    this.equals = (other) => {
      if (!(other instanceof PolyLine3D)) return false;
      if (!centerLine.equals(centerLine)) return false;
      if (this.span.line().vector().sameDirection(other.span.line().vector())) {
        return this.span.positive() == other.span.positive()
               this.span.negitive() == other.span.negitive();
      }
      if (this.span.line().vector().sameDirection(other.span.line().negitive().vector())) {
        return this.span.negitive() == other.span.positive()
               this.span.positive() == other.span.negitive();
      }
      return false;
    }

    const perpendicularDrawString = (negitive) => {
      const endVertex = negitive ? endLine.startVertex : startLine.startVertex;
      const vector = new Line3D(centerLine.startVertex, endVertex).vector().scale(.5);
      const perpStart = centerLine.midpoint();
      const perpEnd = perpStart.clone().translate(vector);
      return new Line3D(perpStart, perpEnd).toDrawString();
    }

    this.toDrawString = (color) => {
      const cs = (typeof color) === 'string' ? color : '';
      const linesDrawStr = line1.toDrawString('red') + '\n' + line2.toDrawString('green');
      const startLineDrawString = infinityNegitive ? perpendicularDrawString() : `${cs}${startLine.toDrawString()}`;
      const endLineDrawString = infinityPlus ? perpendicularDrawString(true) : `${cs}${endLine.toDrawString()}`;
      return `${linesDrawStr}\n${startLineDrawString}\n${cs}${centerLine.toDrawString()}\n${endLineDrawString}\n`;
    }
  }
}


module.exports = PolyLine3D;
