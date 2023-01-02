const Snap2d = require('../snap');
const Square2d = require('../square');
const Polygon2d = require('../polygon');
const SnapLocation2d = require('../snap-location');
const Vertex2d = require('../vertex');
const ToleranceMap = require('../../../../../../public/js/utils/tolerance-map.js');

class SnapPolygon extends Snap2d {
  constructor(parent, polygon, tolerance) {
    if (!(polygon instanceof Polygon2d) || !polygon.valid()) throw new Error('PolygonSnap requires a valid polygon to intialize');
    super(parent, polygon, tolerance);
    if (parent === undefined) return this;
    const instance = this;

    const midpointMap = new ToleranceMap({x: .1, y:.1});
    const vertexFunc = (index) => () => polygon.vertex(index);
    const midpointFunc = (index) => () => polygon.midpoint(index);
    function addLine(index, name, targetName) {
      const locFunc = vertexFunc(index + 1);
      const snapLoc = new SnapLocation2d(parent, name,  locFunc(),  targetName);
      snapLoc.locationFunction(locFunc);
      instance.addLocation(snapLoc);
      const mpFunc = midpointFunc(index + (name === 'right' ? 1 : 0));
      const mpLoc = mpFunc();
      if(midpointMap.matches(mpLoc).length === 0) {
        midpointMap.add(mpLoc);
        const snapLocMidpoint = new SnapLocation2d(parent, `${name}Center`,  mpLoc,  `${targetName}Center`);
        snapLocMidpoint.locationFunction(mpFunc);
        instance.addLocation(snapLocMidpoint);
      }

      // snapLoc.wallThetaOffset(0);
      // snapLoc.thetaOffset(null, null, 180);
      snapLoc.at();
    }

    const backs = [];
    function queBack (index) {backs.push(index)};

    function addBacks(index) {
      for (let index = 0; index < backs.length; index++) {
        const i = backs[index];
        addLine(i, `back${i}`, 'back');
      }
    }

    function addVertex(index, prevIsFace, targetIsFace, nextIsFace) {
      if (prevIsFace && !targetIsFace && nextIsFace) queBack(index);
      else if (targetIsFace && !nextIsFace) {
        addLine(index, 'right', 'left');
      } else if (!targetIsFace && nextIsFace) {
        addLine(index, 'left', 'right');
      } else if (targetIsFace) return;
      else {
        queBack(index);
      }
    }

    function build() {
      const faces = polygon.faces();
      const lines = polygon.lines();
      let prevPrevIsFace = faces.equalIndexOf(lines[lines.length -2]) !== -1;
      let prevIsFace = faces.equalIndexOf(lines[lines.length - 1]) !== -1;
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const currIsFace = faces.equalIndexOf(line) !== -1;
        const currIndex = index === 0 ? lines.length - 1 : index - 1;
        addVertex(currIndex, prevPrevIsFace, prevIsFace, currIsFace);
        prevPrevIsFace = prevIsFace;
        prevIsFace = currIsFace;
      }
      addBacks();
    }

    polygon.getTextInfo = () => ({
      text: instance.parent().name() || 'banjo',
      center: instance.object().center(),
      radians: instance.radians(),
      x: 0,
      y: instance.height() / 4,
      maxWidth: instance.width(),
      limit: 10
    });

    build();
  }
}

module.exports = SnapPolygon;
