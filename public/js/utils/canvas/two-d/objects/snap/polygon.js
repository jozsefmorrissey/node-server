const Snap2d = require('../snap');
const Line2d = require('../line');
const Square2d = require('../square');
const Polygon2d = require('../polygon');
const SnapLocation2d = require('../snap-location');
const Vertex2d = require('../vertex');
const ToleranceMap = require('../../../../tolerance-map.js');

class SnapPolygon extends Snap2d {
  constructor(parent, polygon, tolerance) {
    // if (!(polygon instanceof Polygon2d) || !polygon.valid()) throw new Error('PolygonSnap requires a valid polygon to intialize');
    super(parent, polygon, tolerance);
    let locationCount = 0;
    polygon.centerOn(parent.center());
    if (parent === undefined) return this;
    const instance = this;

    this.longestFaceLine = () => {
      const rotated = this.object();
      const lines = rotated.faces();
      const longest = lines[0];
      for (let index = 1; index < lines.length; index++) {
        const line = lines[index];
        if (longest.length < line) longest = line;
      }
      return longest;
    }

    this.polyCopy = (other) => {
      polygon.copy(other);
      lastTheta = undefined;
    }

    let rotated;
    let lastTheta;
    this.object = () => {
      let theta = this.radians();
      if (lastTheta !== theta) {
        // I think the direction might have to be variable for different axis...
        rotated = polygon.rotate(-theta, null, true);
        lastTheta = theta;
      }
      rotated.center(this.center());
      return rotated;
    }

    const midpointMap = new ToleranceMap({x: .1, y:.1});
    const vertexFunc = (index) => (position) => instance.object().vertex(index, position);
    const midpointFunc = (index) => (position) => instance.object().midpoint(index, position);
    function addLine(index, name, targetName) {
      const locFunc = vertexFunc(index + 1);
      const snapLoc = new SnapLocation2d(instance, name + locationCount++,  locFunc,  targetName);
      instance.addLocation(snapLoc);
      const mpFunc = midpointFunc(index + (name === 'left' ? 1 : 0));
      const mpLoc = mpFunc();
      if(midpointMap.matches(mpLoc).length === 0) {
        midpointMap.add(mpLoc);
        const snapLocMidpoint = new SnapLocation2d(instance, `${name}${locationCount++}center`,  mpFunc,  `${targetName}Center`);
        instance.addLocation(snapLocMidpoint);
      }

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
      if (prevIsFace && !targetIsFace && nextIsFace){
        queBack(index);
      } else if (targetIsFace && !nextIsFace) {
        addLine(index, 'left', 'right');
      } else if (!targetIsFace && nextIsFace) {
        addLine(index, 'right', 'left');
      } else if (targetIsFace) {
        return;
      } else {
        queBack(index);
      }
    }

    function build() {
      const faces = instance.object().faces();
      const lines = instance.object().lines();
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

    this.getTextInfo = () => {
      const lfl = this.longestFaceLine();
      const dist = instance.height() / 4;
      const radians = lfl ? lfl.radians() : 0;
      const textLine = lfl ? lfl.perpendicular(dist/2) : 0;
      return {
        text: instance.parent().name() || '?????',
        center: textLine ? textLine.endVertex() : new Vertex2d(),
        radians,
        x: 0,
        y: 0,
        size: instance.height() / 4,
        maxWidth: lfl ? lfl.length() : instance.width(),
        limit: 10
      }};

    build();
  }
}

module.exports = SnapPolygon;
