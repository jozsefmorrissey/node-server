
const Line2d = require('../../objects/line');
const Tolerance = require('../../../../tolerance.js');
const ToleranceMap = require('../../../../tolerance-map.js');
const tol = .0001;
const withinTol = Tolerance.within(tol);


class ExtremeSector {
  constructor(center, theta) {
    const intersectionMap = new ToleranceMap({'line.slope': tol})
    center = center.copy();
    const limits = {start: {
        dist: 0
      },middle: {
        dist: 0
      },end: {
        dist: 0
      }
    }

    const sectorLine = Line2d.startAndTheta(center, theta);
    // sectorLine.translate(new Line2d(sectorLine.midpoint(), sectorLine.startVertex()));
    this.line = () => sectorLine;

    function newLimit(vertex, line, limitObj) {
      const dist = center.distance(vertex);
      if (dist > limitObj.dist) {
        limitObj.dist = dist;
        limitObj.line = line;
      }
    }

    this.filter = (extremes) => {
      extremes ||= {};
      const add = (line) => line && extremes[line.toString()] === undefined &&
                            (extremes[line.toString()] = line);
      add(limits.start.line);
      add(limits.middle.line);
      add(limits.end.line);
      return extremes;
    }

    this.toDrawString = (color) => {
      const sectionStr = Line2d.toDrawString([sectorLine], color);
      const extremes = Object.values(this.extremes());
      const linesStrs = Line2d.toDrawString(extremes, color);
      return `// ${Math.toDegrees(theta)}\n${sectionStr}\n${linesStrs}\n`;
    }

    //Maybe useful to remove consolidatable lines.
    function additionFilter(matches, elem) {
      matches.push(elem);
      const lineToMatch = {};
      let lines = [];
      for (let index = 0; index < matches.length; index++) {
        const match = matches[index];
        lines.push(match.line);
        lineToMatch[match.line.toString()] = match;
      }
      lines = Line2d.consolidate(...lines);
      const consolidated = [];
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        let match = lineToMatch[line.toString()];
        if (!match) match = {line, intersection: sectorLine.findDirectionalIntersection(line)}
        consolidated.push(match);
      }
      return consolidated;
    }

    this.add = (line) => {
      const intersection = sectorLine.findDirectionalIntersection(line);
      if (intersection && line.withinSegmentBounds(intersection)) {
        const sv = line.startVertex(); const mv = line.midpoint(); const ev = line.endVertex();
        // intersectionMap.filter({line, intersection},  additionFilter);
        newLimit(sv, line, limits.start);
        newLimit(mv, line, limits.middle);
        newLimit(ev, line, limits.end);
      }
    }
  }
}

module.exports = ExtremeSector;
