
const Line2d = require('../objects/line')
const Vertex2d = require('../objects/vertex')
const Polygon2d = require('../objects/polygon')


const tol = .0000000001;
class Parimeters2d {
  constructor(lines, onlyOne) {
    lines = Line2d.sliceAll(lines);
    class PartialParimeter2d {
      constructor(line) {
        this.lineMap = Line2d.toleranceMap(tol, true, lines),
        this.vertexMap = Vertex2d.toleranceMap(),
        this.parimeter = [line];
        this.clone = (line) => {
          const clone = new PartialParimeter2d();
          clone.lineMap = this.lineMap.clone([line]),
          clone.vertexMap = this.vertexMap.clone([line.startVertex()]),
          clone.parimeter = this.parimeter.map(l => l.copy()).concat(line)
          return clone;
        }
      }
    }

    let deadEndCount = 0;
    const allVerticesMap = Vertex2d.toleranceMap();
    allVerticesMap.addAll(Line2d.vertices(lines));
    const center = Line2d.center(lines);
    this.center = () => center.copy();
    const allVertices = Line2d.vertices(lines);
    const verticesEliminated = {};

    const priority = (center) => (a, b) => {
      const reverse = deadEndCount % 20 > 10;
      if (reverse) return b.distance(center) - a.distance(center);
      return a.distance(center) - b.distance(center);
    }

    const partialsToDrawString = (pdObj, startIndex, endIndex) => {
      startIndex ||= 0;
      endIndex ||= 1;
      for (let index = startIndex; index < endIndex; index++) {
        const allLinesStr = '//All Lines\n' + Line2d.toDrawString(lines);
        const parimeterStr = '//Parimeter Lines\n' + Line2d.toDrawString(pdObj.parimeter, 'yellow');
        const lastLine = pdObj.parimeter[pdObj.parimeter.length - 1];
        const lastLineNeg = lastLine.negitive();
        let matches = pdObj.lineMap.matches(lastLineNeg).filter(l => !l.equals(lastLine));
        matches.sort(priority(center));

        const matchesStr = '//Match Lines\n' + Line2d.toDrawString(matches, 'blue');
        const nextLineStr = '//Next Line\nyellow' + matches[matches.length - 1].toString();
        const lastLineStr = '//Last Line\n' + Line2d.toDrawString([lastLine], 'red');
        const startLineStr = '//Start Line\ngreen' + pdObj.parimeter[0].toString()
        const order = [allLinesStr, parimeterStr, matchesStr, nextLineStr, lastLineStr, startLineStr];
        console.log(order.join('\n\n'));
      }
    }

    const eliminatedCheck = (vert) => verticesEliminated[vert.toString()] === true;
    const lineEliminatedCheck = (line) => eliminatedCheck(line[0]) || eliminatedCheck(line[1]);
    const eliminated = (...vertsOlines) => {
      let hasntBeen = true;
      for (let index = 0; hasntBeen && index < vertsOlines.length; index++) {
        const target = vertsOlines[index];
        if (target instanceof Vertex2d) hasntBeen &&= !eliminatedCheck(target);
        if (target instanceof Line2d) hasntBeen &&= lineEliminatedCheck(target);
      }
      return !hasntBeen;
    }

    this.parimeterLines = () => lines.filter(l => !eliminatedCheck(l[0]) && !eliminatedCheck(l[1]));

    function reduceParimeters(parimeter) {
      // parimeter.vertices().forEach(v => verticesEliminated[v.toString()] = true);
      if (onlyOne) return;
      const resultMap = {};
      for (let i = 0; i < allVertices.length; i++) {
        const vert = allVertices[i];
        const vStr = vert.toString();
        if (!verticesEliminated[vStr] && resultMap[vStr] === undefined) {
          const isWithin = parimeter.isWithin(vert, false);
          const matches = allVerticesMap.matches(vert);
          for (let j = 0; j < matches.length; j++) {
            const str = matches[j].toString();
            resultMap[str] = isWithin;
            if (isWithin) verticesEliminated[str] = true;
          }
        }
      }
    }


    this.polygons = () => polys.map(p => p.copy());
    this.largest = () => polys[polys.length - 1].copy();
    const findIndexFunc = (visited) => l => l[0].equals(visited) || l[1].equals(visited);
    const parimeterFinished = (parimeter) => {
      const madeItFullCircle = parimeter[0][0].equals(parimeter[parimeter.length - 1][1]);
      if (madeItFullCircle) {
        const poly = Polygon2d.fromLines(parimeter);
        poly.combine();
        deadEndCount++;
        return poly;
      }
      return null;
    }


    function follow(pdObj, rightOleft) {
      let finished = false;
      let count = 0;
      while (!finished) {
        const lastLine = pdObj.parimeter[pdObj.parimeter.length - 1];
        const lastLineNeg = lastLine.negitive();
        let matches = pdObj.lineMap.matches(lastLineNeg).filter(l => !l.equals(lastLine));
        matches.sort(Parimeters2d.rightLeftSort(lastLine.degrees(), rightOleft));
        pdObj.parimeter.push(matches[0]);
        finished = parimeterFinished(pdObj.parimeter);
        if (count++ > lines.length) return null;
      };
      return finished;
    }

    let debug = true;
    const polys = [];
    function build() {
      let lineList = lines.map(l => l.copy());
      while (lineList.length > 0) {
        const furthestLine = Line2d.isolateFurthestLine(center, lineList).line;
        const rightPoly = follow(new PartialParimeter2d(furthestLine), true);
        const leftPoly = follow(new PartialParimeter2d(furthestLine),false);
        const outerPoly = rightPoly.area() > leftPoly.area() ? rightPoly : leftPoly;
        reduceParimeters(outerPoly);
        polys.push(outerPoly);
        if (onlyOne) break;
        polys.sortByAttr('area');
        lineList = lineList.filter(l => !lineEliminatedCheck(l));
      }
    }
    build();
  }
}

Parimeters2d.getRelitiveDegree = (degree, zeroAt) => {
  degree = Math.mod(degree, 360);
  zeroAt = Math.mod(zeroAt, 360);
  const neg180 = Math.mod(zeroAt - 180, 360);
  let relDeg;
  if (degree >= neg180) {
    if (neg180 > zeroAt) relDeg = degree - zeroAt - 360;
    else if (degree <= zeroAt) relDeg = -1 * (zeroAt - degree);
    else {
      relDeg = degree - zeroAt;
    }
  } else relDeg = 180 - (neg180 - degree);
  return relDeg % 180;
}

Parimeters2d.rightLeftSort = (zeroAt, rightOleft) => (a, b) => {
  let relAdeg = Parimeters2d.getRelitiveDegree(a.degrees(), zeroAt);
  let relBdeg = Parimeters2d.getRelitiveDegree(b.degrees(), zeroAt);
  return !rightOleft ? relAdeg - relBdeg : relBdeg - relAdeg;
}

Parimeters2d.lines = (lines, onlyOne) => {
  const parimeter = new Parimeters2d(lines, onlyOne);
  return parimeter.polygons()[0].lines();
}


module.exports = Parimeters2d;
