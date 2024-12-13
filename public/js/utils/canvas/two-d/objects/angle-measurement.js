

const Circle2d = require('circle');
const Vertex2d = require('vertex');
const Line2d = require('line');
const Lookup = require('../../../object/lookup');
const Measurement = require('../../../measurement.js');
const ToleranceMap = require('../../../tolerance-map.js');

const furthestEndpoint = (int, l) => [l[0], l[1]].max(v => v.distance(int));

class AngleMeasurement2d {
  constructor(line1, line2) {
    const intersection = line1.findIntersection(line2);
    let degrees, leg1, leg2;
    if (!intersection) degrees = 0;
    else {
      leg1 = new Line2d(intersection, furthestEndpoint(intersection, line1));
      leg2 = new Line2d(intersection, furthestEndpoint(intersection, line2));
      degrees = Math.toDegrees(Math.abs(leg1.acute(leg2)));
    }
    this.intersection = () => intersection;
    this.degrees = () => Math.roundTo(degrees, .1);
    this.bisector = (dist) => leg1.bisector(leg2, dist);
    this.legs = () => [leg1, leg2];
  }
}

module.exports = AngleMeasurement2d;
