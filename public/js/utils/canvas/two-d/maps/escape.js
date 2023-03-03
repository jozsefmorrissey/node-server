
const Line2d = require('../objects/line');
const Vertex2d = require('../objects/vertex');
const Polygon2d = require('../objects/polygon');
const Tolerance = require('../../../tolerance.js');
const ToleranceMap = require('../../../tolerance-map.js');
const tol = .0015;
const withinTol = Tolerance.within(tol);
const nonZero = (val) => !withinTol(val, 0);

class EscapeGroup {
  constructor(line) {
    let canEscape;
    const lineMap = {};
    const id = String.random();
    lineMap[line.toString()] = line;
    let reference, type;

    this.id = () => id;
    this.type = (val) => {
      if (val !== undefined) type = val;
      return type;
    }
    this.reference = (other) => {
      if (other instanceof EscapeGroup && other !== this)
        reference = other;
      return reference;
    }
    this.lines = () => Object.values(lineMap);
    this.canEscape = (ce, type) => {
      if (ce === true || ce === false) {
        if ((canEscape === true && ce === false) || (canEscape === false && ce === true))
          console.warn('Conflicting escape values???');
      }
      this.type(type);
      if (ce === true) canEscape = true;
      return canEscape;
    }
    this.connect = (other) => {
      if (other === this) return;
      const lines = other.lines();
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        lineMap[line.toString()] = line;
      }

      if (this.canEscape() !== true)
        this.canEscape(other.canEscape());
    }
  }
}

class Escape {
  constructor(line) {
    let escapeGroupRight = new EscapeGroup(line);
    let escapeGroupLeft = new EscapeGroup(line);
    let groupIdMap = {}
    groupIdMap[escapeGroupRight.id()] = true;
    groupIdMap[escapeGroupLeft.id()] = true;
    const updateReference = {
      left: () => {
        let reference = escapeGroupLeft.reference();
        if (reference) {
          if (groupIdMap[reference.id()]) {
            reference = new EscapeGroup(line);
            reference.connect(escapeGroupLeft);
          }
          groupIdMap[reference.id()] = true;
          escapeGroupLeft = reference;
          updateReference.left();
        }
      },
      right: () => {
        let reference = escapeGroupRight.reference();
        if (reference) {
          if (groupIdMap[reference.id()]) {
            reference = new EscapeGroup(line);
            reference.connect(escapeGroupRight);
          }
          groupIdMap[reference.id()] = true;
          escapeGroupRight = reference;
          updateReference.right();
        }
      }
    }
    this.updateReference = () => updateReference.left() || updateReference.right();
    this.right = (ce, type) => {
      updateReference.right();
      return escapeGroupRight.canEscape(ce, type);
    }
    this.left = (ce, type) => {
      updateReference.left();
      return escapeGroupLeft.canEscape(ce, type);
    }

    this.right.connected = (other) => {
      escapeGroupRight.canEscape();
      updateReference.right();
      escapeGroupRight.connect(other);
      other.reference(escapeGroupRight);
    }
    this.left.connected = (other) => {
      escapeGroupLeft.canEscape();
      updateReference.left();
      escapeGroupLeft.connect(other);
      other.reference(escapeGroupLeft);
    }

    this.right.group = () => this.updateReference() || escapeGroupRight;
    this.left.group = () => this.updateReference() || escapeGroupLeft;
    this.right.type = (type) => escapeGroupRight.type(type);
    this.left.type = (type) => escapeGroupLeft.type(type);
  }
}

class EscapeMap {
  constructor(lines, perpindicularDistance) {
    perpindicularDistance ||= .05;
    const instance = this;
    let escapeObj;

    function escapeLines(lines, perpDist) {
      const getState = (lineOstr) =>
        escapeObj.states[lineOstr instanceof Line2d ? lineOstr.toString() : lineOstr];

      function recursiveEscape(obj) {
        const closests = Object.values(obj.closest);
        for (let cIndex = 0; cIndex < closests.length; cIndex++) {
          setEscapes(obj, closests[cIndex]);
        }
      }

      function setEscape(obj, closest, dir) {
        const dirObj = closest[dir];
        if (dirObj.line) {
          const dirState = getState(dirObj.line);
          let dirOfEndpoint = dirObj.line.direction(dirObj.runner.startVertex());
          let escapeBretheran = dirOfEndpoint === 'right' ? dirState.escape.right.group() : dirState.escape.left.group();
          obj.escape[dir].connected(escapeBretheran);
          dirState.escape.updateReference();
          if (obj.escape[dir]()) dirObj.successful = true;
        }
      }

      const targetLine = new Line2d(new Vertex2d(45, 37.5),
                                  new Vertex2d(45, 12.5))
      function setEscapes(obj, closest) {
        if (obj.escape.right() === true) obj.escape.left(false);
        else if (obj.escape.left() === true) obj.escape.right(false);
        if (obj.line.equals(targetLine)) {
          console.log('gotcha');
        }
        setEscape(obj, closest, 'right');
        setEscape(obj, closest, 'left');
        return obj;
      }

      const toDrawString = (key) => () => {
        const state = escapeObj.states[key];
        const sRight = state.closest.startVertex.right;
        const sLeft = state.closest.startVertex.left;
        const eRight = state.closest.endVertex.right;
        const eLeft = state.closest.endVertex.left;
        Line2d.toDrawString([state.line,sRight, eRight,sLeft,eLeft],
                              'green', 'red', 'red', 'blue', 'blue');
      }
      const initEscape = (line, index) => {
        if (getState(line) !== undefined) return;
        const key = line.toString();
        escapeObj.states[key] = {index, line, closest: {}, runners: {},
                escape: new Escape(line),
                toDrawString: toDrawString(key)};
      };

      const isClosest = (origin, curr, prospective, originToEndDist) => {
        if (!prospective instanceof Vertex2d) return false;
        const prospectDist = prospective.distance(origin) - originToEndDist;
        // const validDistance = prospectDist > 0 || withinTol(prospectDist, 0);
        // if (!validDistance) return false;
        if (!curr) return true;
        const currDist = curr.distance(origin) - originToEndDist;
        return Math.abs(currDist) > Math.abs(prospectDist);
      }

      const intersectsPoint = (target, line1, line2) => {
        const intersection = line1.findDirectionalIntersection(line2);
        return intersection instanceof Vertex2d &&
                  (target.equals(intersection, .1) ||
                   intersection.distance(line2.startVertex()) >
                   target.distance(line2.startVertex()));
      }

      function runners(line, targetFuncName, startPointFuncName, radians) {
        const state = getState(line);
        const vertex = line[targetFuncName]();
        const perp = line.perpendicular(perpDist, line[startPointFuncName](), true);
        const originToEndDist = line.midpoint().distance(line.startVertex());
        const rightOrigin = perp.startVertex();
        const right = Line2d.startAndTheta(rightOrigin, radians, 1000000000);
        const rightPerp = line.perpendicular(-10000000);
        const leftOrigin = perp.endVertex();
        const left = Line2d.startAndTheta(leftOrigin, radians, 100000000);
        const leftPerp = line.perpendicular(10000000);
        const center = Line2d.startAndTheta(line[startPointFuncName](), radians, 100000000);
        state.runners[radians] = {right, left};
        state.closest[targetFuncName] = {right: {}, left:{}};
        let closest = state.closest[targetFuncName];
        let escapedLeft = true;
        let escapedRight = true;
        let escapedLeftPerp = true;
        let escapedRightPerp = true;
        for (let index = 0; index < lines.length; index++) {
          const other = lines[index];
          if (intersectsPoint(vertex, other, center)) {
            const leftIntersection = left.findDirectionalIntersection(other);
            if (other.withinSegmentBounds(leftIntersection)) {
              if (isClosest(leftOrigin, closest.left.intersection, leftIntersection, originToEndDist)) {
                escapedLeft = false;
                const escapeLine = new Line2d(left.startVertex(), leftIntersection);
                closest.left = {intersection: leftIntersection, line: other, escapeLine, runner: left};
              }
            }
            const rightIntersection = right.findDirectionalIntersection(other);
            if (other.withinSegmentBounds(rightIntersection)) {
              if (isClosest(rightOrigin, closest.right.intersection, rightIntersection, originToEndDist)) {
                escapedRight = false;
                const escapeLine = new Line2d(right.startVertex(), rightIntersection);
                closest.right = {intersection: rightIntersection, line: other, escapeLine, runner: right};
              }
            }
          }
          const rightPerpIntersection = rightPerp.findDirectionalIntersection(other);
          if (other.withinSegmentBounds(rightPerpIntersection) && nonZero(line.distance(rightPerpIntersection)))
            escapedRightPerp = false;
          const leftPerpIntersection = leftPerp.findDirectionalIntersection(other);
          if (other.withinSegmentBounds(leftPerpIntersection) && nonZero(line.distance(leftPerpIntersection)))
            escapedLeftPerp = false;
        }

        if (escapedRight || escapedRightPerp)
          state.escape.right(true, 'independent');
        if (escapedLeft || escapedLeftPerp)
          state.escape.left(true, 'independent');
        if (escapedRight || escapedLeft) state.type = 'independent';
      }

      function runAll(lines) {
        escapeObj = {states: {}, runners: {right: [], left: []}};
        for (let index = 0; index < lines.length; index++) {
          const line = lines[index];
          initEscape(line, index);
          runners(line, 'startVertex', 'endVertex', line.radians() - Math.PI);
          runners(line, 'endVertex', 'startVertex', line.radians());
        }
      }

      runAll(lines);

      const indStates = instance.states.independent();
      const indLines = indStates.map(s => s.line);
      for (let index = indStates.length - 1; index > -1; index--) {
        const state = indStates[index];
        const indLine = state.line;
        const sliced = indLine.slice(indLines);
        if (sliced) {
          lines.splice(state.index, 1);
          for (let sIndex = 0; sIndex < sliced.length; sIndex++) {
            lines.push(sliced[sIndex]);
          }
        }
      }

      // runAll(lines);
      //
      // const values = Object.values(escapeObj.states);
      // for (let index = 0; index < values.length; index++) {
      //   recursiveEscape(values[index]);
      // }
      return escapeObj;
    }

    this.states = () => escapeObj.states;
    this.states.independent = () => Object.values(escapeObj.states)
                                .filter(obj => obj.type === 'independent');
    this.independent = () => this.states.independent().map(obj => obj.line);


    this.dependent = () => Object.values(escapeObj.states)
                                .filter(obj => (obj.escape.left() || obj.escape.right()) && obj.type !== 'independent')
                                .map(obj => obj.line);
    this.escaped = () => Object.values(escapeObj.states)
                                .filter(obj => obj.escape.left() || obj.escape.right())
                                .map(obj => obj.line);

    this.groups = () => {
      const parents = {};
      Object.values(escapeObj.states).forEach((obj) => {
        if (parents[obj.escape.right.group().id()] === undefined)
          parents[obj.escape.right.group().id()] = obj.escape.right.group();
        if (parents[obj.escape.left.group().id()] === undefined)
          parents[obj.escape.left.group().id()] = obj.escape.left.group();
      })
      return Object.values(parents);
    }

    this.escapeAttempts = (successOfailure) => {
      const lines = [];
      const add = (obj) =>
            (successOfailure === undefined || (successOfailure && obj.successful) || (!successOfailure && !obj.successful)) &&
            obj.intersection && lines.push(obj.escapeLine);
      const lateBloomers = Object.values(escapeObj.states).filter(obj => obj.type !== 'independent');
      for (let index = 0; index < lateBloomers.length; index++) {
        const target = lateBloomers[index];
        const closests = Object.values(target.closest);
        for (let cIndex = 0; cIndex < closests.length; cIndex++) {
          add(closests[cIndex].right);
          add(closests[cIndex].left);
        }
      }
      return lines;
    }



    this.toDrawString = () => {
      let str = Line2d.toDrawString(lines);
      str += '\n\n//Independed Escapers\n' + Line2d.toDrawString(this.independent(), 'green');
      str += '\n\n//Dependent Escapers\n' + Line2d.toDrawString(this.dependent(), 'lightgreen');
      // str += '\n\n//Successful Escapes\n' + Line2d.toDrawString(this.escapeAttempts(true), 'blue');
      // str += '\n\n//Attempted Escapes\n' + Line2d.toDrawString(this.escapeAttempts(false), 'red');
      return str;
    }

    this.groupDrawString = () => {
      const groups = this.groups();
      let str = '';
      for (let index = 0; index < groups.length; index++) {
        const group = groups[index];
        const lines = group.lines();
        str += `\n\n//Group ${index} (${lines.length})\n//${Line2d.toDrawString(lines, 'red')}`;
      }
      return str;
    }

    escapeLines(lines, perpindicularDistance);
  }
}

EscapeMap.parimeter = (lines) => {
  const escapeObj = new EscapeMap(lines);
  // TODO: need a better/more complete algorythum.
  const escaped = escapeObj.independent();
  const breakdown = Line2d.sliceAll(escaped);
  const breakdownMap = new EscapeMap(breakdown);
  const parimeter = Line2d.consolidate(...breakdownMap.escaped());
  const poly = Polygon2d.build(parimeter);
  return poly;
}

module.exports = EscapeMap;
