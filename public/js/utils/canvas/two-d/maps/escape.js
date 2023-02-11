
const Line2d = require('../objects/line');
const Vertex2d = require('../objects/vertex');
const Polygon2d = require('../objects/polygon');
const Tolerance = require('../../../tolerance.js');
const ToleranceMap = require('../../../tolerance-map.js');
const tol = .0015;
const withinTol = Tolerance.within(tol);

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
      if (ce === true && this.type() !== 'independent') {
        console.log.subtle('gotcha', 1000);
      }
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
      updateReference.right();
      escapeGroupRight.connect(other);
      other.reference(escapeGroupRight);
    }
    this.left.connected = (other) => {
      updateReference.left();
      escapeGroupLeft.connect(other);
      other.reference(escapeGroupLeft);
    }

    this.right.group = () => escapeGroupRight;
    this.left.group = () => escapeGroupLeft;
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
          let dirOfEndpoint = dirObj.line.direction(dirObj.runner.endVertex());
          let escapeBretheran = dirOfEndpoint === 'left' ? dirState.escape.right.group() : dirState.escape.left.group();
          obj.escape[dir].connected(escapeBretheran);
          dirState.escape.updateReference();
          if (obj.escape[dir]()) dirObj.successful = true;
        }
      }

      function setEscapes(obj, closest) {
        if (obj.escape.right() === true) obj.escape.left(false);
        else if (obj.escape.left() === true) obj.escape.right(false);
        setEscape(obj, closest, 'right');
        setEscape(obj, closest, 'left');
        return obj;
      }

      const initEscape = (line, index) => {
        if (getState(line) === undefined)
          escapeObj.states[line.toString()] = {index, line, closest: {}, escape: new Escape(line)};
      };

      const isClosest = (origin, curr, prospective) => prospective instanceof Vertex2d &&
                    (!curr || prospective.distance(origin) < curr.distance(origin));

      function runners(line, funcName, radians) {
        const state = getState(line);
        const vertex = line[funcName]();
        const perp = line.perpendicular(perpDist, vertex, true);
        const rightOrigin = Line2d.startAndTheta(perp.startVertex(), radians - Math.PI, .1).endVertex();
        const right = Line2d.startAndTheta(rightOrigin, radians, 1000000000);
        const leftOrigin = Line2d.startAndTheta(perp.endVertex(), radians - Math.PI, .1).endVertex();
        const left = Line2d.startAndTheta(leftOrigin, radians, 100000000);
        escapeObj.runners.right.push(right);
        escapeObj.runners.left.push(left);
        state.closest[funcName] = {right: {}, left:{}};
        let closest = state.closest[funcName];
        let escapedLeft = true;
        let escapedRight = true;
        for (let index = 0; index < lines.length; index++) {
          const other = lines[index];
          const leftIntersection = left.findDirectionalIntersection(other);
          if (other.withinSegmentBounds(leftIntersection)) {
            escapedLeft = false;
            if (isClosest(leftOrigin, closest.left.intersection, leftIntersection)) {
              const escapeLine = new Line2d(left.startVertex(), leftIntersection);
              closest.left = {intersection: leftIntersection, line: other, escapeLine, runner: left};
            }
          }
          const rightIntersection = right.findDirectionalIntersection(other);
          if (other.withinSegmentBounds(rightIntersection)) {
            escapedRight = false;
            if (isClosest(rightOrigin, closest.right.intersection, rightIntersection)) {
              const escapeLine = new Line2d(right.startVertex(), rightIntersection);
              closest.right = {intersection: rightIntersection, line: other, escapeLine, runner: right};
            }
          }
        }

        if (escapedRight)
          state.escape.right(true, 'independent');
        if (escapedLeft)
          state.escape.left(true, 'independent');
        if (escapedRight || escapedLeft) state.type = 'independent';
      }

      function runAll(lines) {
        escapeObj = {states: {}, runners: {right: [], left: []}};
        for (let index = 0; index < lines.length; index++) {
          const line = lines[index];
          initEscape(line, index);
          runners(line, 'startVertex', line.radians() - Math.PI);
          runners(line, 'endVertex', line.radians());
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

      runAll(lines);

      const values = Object.values(escapeObj.states);
      for (let index = 0; index < values.length; index++) {
        recursiveEscape(values[index]);
      }
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
      // str += '\n\n//Right Runners\n' + Line2d.toDrawString(escapeObj.runners.right, 'red');
      // str += '\n\n//Left Runners\n' + Line2d.toDrawString(escapeObj.runners.left, 'lavender');
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
  const escaped = escapeObj.escaped();
  const breakdown = Line2d.sliceAll(escaped);
  const parimeter = new EscapeMap(breakdown).escaped();
  const poly = Polygon2d.build(parimeter);
  console.log(escapeObj.toDrawString());
  return poly;
}

module.exports = EscapeMap;
