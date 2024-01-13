
const Line3D = require('line');
const Vertex3D = require('vertex');
const Plane = require('plane');
const Matrix = require('matrix');

function parrellePointLine(line1, line2) {
  const vect1 = line1.vector();
  const vect2 = line2.vector();
  let closest = {dist: Number.MAX_SAFE_INTEGER};
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const vert1 = i === 0 ? line1.startVertex : line1.endVertex;
      const vert2 = j === 0 ? line2.startVertex : line2.endVertex;
      const dist = vert1.distance(vert2);
      if (dist < closest.dist) closest = {dist, vert1, vert2};
    }
  }
  const perp1 = Line3D.fromVector(vect1, new Vertex3D(vect1.scale(-.5).add(closest.vert2.vector())))
  const perp2 = Line3D.fromVector(vect2, new Vertex3D(vect2.scale(-.5).add(closest.vert1.vector())))
  const perpConn1 = Line3D.intersectingLine(perp1, line1, false, true, true, line1.startVertex.clamp, line1.endVertex.clamp);
  const perpConn2 = Line3D.intersectingLine(perp2, line2, false, true, true, line2.startVertex.clamp, line2.endVertex.clamp);
  let shortestConnection = perpConn1.length() < perpConn2.length() ? perpConn1 : perpConn2;
  if (!perpConn1.finite() && !perpConn2.finite())
    throw new Error('Sorry I guess you have to deal with this issue: Matrix that is created does not have a single solution');
  if (perpConn1.finite() && !perpConn2.finite()) shortestConnection = perpConn1;
  if (perpConn2.finite() && !perpConn1.finite()) shortestConnection = perpConn2;
  if (shortestConnection instanceof PolyLine3D) shortestConnection = shortestConnection.centerLine();
  return shortestConnection;
}

// Stole from https://stackoverflow.com/a/28701387
// Thank You, Alexandre Giordanelli
Line3D.intersectingLine = (line1, line2, clampAll, clampA0, clampA1, clampB0, clampB1) => {
  line1 = line1.clone();line2 = line2.clone();
  var sameDir = line1.vector().sameDirection(line2.vector());
  if (!sameDir) {
    line2 = line2.negitive();
    const temp = clampB0;
    clampB0 = clampB1;
    clampB1 = temp;
  }

  const a0 = line1.startVertex; const a1 = line1.endVertex;
  const b0 = line2.startVertex; const b1 = line2.endVertex;
    //Given two lines defined by numpy.array pairs (a0,a1,b0,b1)
    //Return distance, the two closest points, and their average

    clampA0 = clampAll || clampA0 || false;
    clampA1 = clampAll || clampA1 || false;
    clampB0 = clampAll || clampB0 || false;
    clampB1 = clampAll || clampB1 || false;
    a0.clamp = clampA0;a1.clamp = clampA1;b0.clamp = clampB0;b1.clamp = clampB1;

    //Calculate denomitator
    var A = a1.minus(a0);
    var B = b1.minus(b0);
    var _A = A.unit();
    var _B = B.unit();
    var cross = _A.crossProduct(_B);
    var denom = Math.pow(cross.magnitude(), 2);

    //If denominator is 0, lines are parallel: Calculate distance with a projection and evaluate clamp edge cases
    if (denom == 0){
        var d0 = _A.dot(b0.minus(a0));
        var d = _A.scale(d0).add(a0).minus(b0).magnitude();

        //If clamping: the only time we'll get closest points will be when lines don't overlap at all. Find if segments overlap using dot products.
        if(clampA0 || clampA1 || clampB0 || clampB1){
            var d1 = _A.dot(b1.minus(a0));

            //Is segment B before A?
            if(d0 <= 0 && 0 >= d1){
                if(clampA0 == true && clampB1 == true){
                    if(Math.abs(d0) < Math.abs(d1)){
                        return new Line3D(b0, a0);
                    }
                    return new Line3D(b1, a0);
                }
            }
            //Is segment B after A?
            else if(d0 >= A.magnitude() && A.magnitude() <= d1){
                if(clampA1 == true && clampB0 == true){
                    if(Math.abs(d0) < Math.abs(d1)){
                        return new Line3D(b0, a1);
                    }
                    return new Line3D(b1, a1);
                }
            }

        }


        if (!sameDir) {
          line2 = line2.negitive();
          const temp = clampB0;
          clampB0 = clampB1;
          clampB1 = temp;
        }
        //If clamping is off, or segments overlapped, we have infinite results, just return position.
        return new PolyLine3D(line1, line2, clampAll, clampA0, clampA1, clampB0, clampB1);
    }

    var t = b0.minus(a0);
    var det0 = new Matrix([t.toArray(), _B.toArray(), cross.toArray()]).transpose().determinate();
    var det1 = new Matrix([t.toArray(), _A.toArray(), cross.toArray()]).transpose().determinate();

    const answer = t.toArray();
    const m = new Matrix([[_A.i(), -_B.i()],
                          [_A.j(), -_B.j()],
                          [_A.k(), -_B.k()]]);
    const Ts = m.solve(t.toArray());


    var t0 = Ts[0][0];//det0 / denom;
    var t1 = Ts[1][0];//det1 / denom;

    var pA = _A.scale(t0).add(a0);
    var pB = _B.scale(t1).add(b0);

    const plane = new Plane(line1.startVertex, line1.endVertex, line2.startVertex);
    if (plane.valid() && !plane.within(line2.endVertex)) {
      return parrellePointLine(line1, line2);
    }

    //Clamp results to line segments if needed
    if(clampA0 || clampA1 || clampB0 || clampB1){
        if (clampA0 && line1.within(pA) === 'BEFORE') {
          pA = a0;
          const perpEnd = line2.perpendicular(pA).startVertex;
          pB = Line3D.shortest(pA, perpEnd, b0, b1).endVertex;
        } else if(clampA1 && line1.within(pA) === 'AFTER') {
          pA = a1;
          const perpEnd = line2.perpendicular(pA).startVertex;
          pB = Line3D.shortest(pA, perpEnd, b0, b1).endVertex;
        }

        if(clampB0 && line2.within(pB) === 'BEFORE') {
          pB = b0;
        } else if(clampB1 && line2.within(pB) === 'AFTER') {
          pB = b1;
        }

    }

    return new Line3D(pA, pB);
}

const infoVectorSort = (center, vector) => {
  return (info1, info2) => {
    const vert1 = info1.start;
    const vert2 = info2.start;
    const line1dot = vector.dot(vert1.minus(center));
    const line2dot = vector.dot(vert2.minus(center));
    return line2dot - line1dot;
  }
}

const getCenterLine = (l1, l2) => new Line3D({
  x: (l1.startVertex.x + l2.startVertex.x)/2,
  y: (l1.startVertex.y + l2.startVertex.y)/2,
  z: (l1.startVertex.z + l2.startVertex.z)/2,
}, {
  x: (l1.endVertex.x + l2.endVertex.x)/2,
  y: (l1.endVertex.y + l2.endVertex.y)/2,
  z: (l1.endVertex.z + l2.endVertex.z)/2,
});
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
      console.warn(`These lines are not parrelle:\n\t${startLine.toString()}\n\t${endLine.toString()}`);
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
