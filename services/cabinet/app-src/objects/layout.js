
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const History = require('../services/history');

class Circle2D extends Lookup {
  constructor(radius, center) {
    super();
    // ( x - h )^2 + ( y - k )^2 = r^2
    this.radius = () => radius;
    this.center = () => center;
    this.center.x = () => center.x();
    this.center.y = () => center.y();
    // Stole the root code from: https://stackoverflow.com/a/37225895
    this.lineIntersects = (line, bounded) => {
      line.p1 = line.startVertex();
      line.p2 = line.endVertex();
        var a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
        v1 = {};
        v2 = {};
        v1.x = line.p2.x() - line.p1.x();
        v1.y = line.p2.y() - line.p1.y();
        v2.x = line.p1.x() - this.center.x();
        v2.y = line.p1.y() - this.center.y();
        b = (v1.x * v2.x + v1.y * v2.y);
        c = 2 * (v1.x * v1.x + v1.y * v1.y);
        b *= -2;
        d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - this.radius() * this.radius()));
        if(isNaN(d)){ // no intercept
            return [];
        }
        u1 = (b - d) / c;  // these represent the unit distance of point one and two on the line
        u2 = (b + d) / c;
        retP1 = {};   // return points
        retP2 = {}
        ret = []; // return array
        if(!bounded || (u1 <= 1 && u1 >= 0)){  // add point if on the line segment
            retP1.x = line.p1.x() + v1.x * u1;
            retP1.y = line.p1.y() + v1.y * u1;
            ret[0] = retP1;
        }
        if(!bounded || (u2 <= 1 && u2 >= 0)){  // second add point if on the line segment
            retP2.x = line.p1.x() + v1.x * u2;
            retP2.y = line.p1.y() + v1.y * u2;
            ret[ret.length] = retP2;
        }
        return ret;
    }
  }
}

class Vertex2D extends Lookup {
  constructor(point) {
    if (point instanceof Vertex2D) return point;
    super();
    Object.getSet(this, {point}, 'index', 'nextLine', 'prevLine');
    const instance = this;
    this.move = (event) => {
      this.point({x: event.imageX, y: event.imageY});
      return true;
    };
    this.x = () => this.point().x;
    this.y = () => this.point().y;
    function assignVertex(forward) {
      return (point, lineConst) => {
        const vertexGetter = forward ? instance.tex : instance.prevVertex;
        const lineGetter = forward ? instance.nextLine : instance.prevLine;
        if (point !== undefined) {
          const vertex = new Vertex2D(point);
          const origVertex = vertexGetter();
          if (origVertex instanceof Vertex2D) {
            lineConst = lineConst || Line2D;
            const line = forward ? new lineConst(vertex, origVertex) : new lineConst(origVertex, vertex);
            origVertex.lineGetter(line);
            vertex.lineGetter(line);
          } else {
            lineConst = lineConst || Line2D;
            const line = forward ? new lineConst(vertex, instance) : new lineConst(instance, vertex);
            lineGetter(line);
            const otherLineGetter = !forward ? vertex.nextLine : vertex.prevLine;
            otherLineGetter(line);
          }
        }
        const line = lineGetter();
        if (line === undefined) return undefined;
        return instance.nextLine().endVertex();
      };
    }

    const dummyFunc = () => true;
    this.forEach = (func, backward) => {
      let currVert = this;
      let lastVert;
      do {
        lastVert = currVert;
        func(currVert);
        currVert = backward ? currVert.prevVertex() : currVert.nextVertex();
      } while (currVert && currVert !== this);
      return currVert || lastVert;
    }

    this.verticies = () => {
      let list = [];
      const endVertex = this.forEach((vertex) => vertex && list.push(vertex));
      if (endVertex === this) return list;
      let reverseList = [];
      this.forEach((vertex) => reverseList.push(vertex), true);
      return reverseList.reverse().concat(list);
    }

    this.lines = () => {
      let list = [];
      const endVertex = this.forEach((vertex) =>
          vertex && vertex.nextLine() && list.push(vertex.nextLine()));
      if (endVertex === this) return list;
      let reverseList = [];
      this.forEach((vertex) =>
        vertex && vertex.prevLine() && reverseList.push(vertex.prevLine()), true);
      return reverseList.reverse().concat(list);
    }

    this.isEnclosed = () => {
      lineConst = lineConst || Line2D;
      const start = this.forEach(dummyFunc, true);
      const end = this.foreEach(dummyFunc);
      return start !== end;
    }

    this.enclose = (lineConst) => {
      if (this.isEnclosed) {
        const start = this.forEach(dummyFunc, true);
        const end = this.forEach(dummyFunc, false);
        const newLine = new lineConst(end, start);
        start.prevLine(newLine);
        end.nextLine(newLine);
      }
    }
    this.prevVertex = (point, lineConst) => {
      if (point !== undefined) {
        const vertex = new Vertex2D(point);
        const origVertex = this.prevVertex();
        if (origVertex instanceof Vertex2D) {
          lineConst = lineConst || Line2D;
          const line = new lineConst(origVertex, vertex);
          origVertex.nextLine(line);
          vertex.prevLine(line);
        } else {
          lineConst = lineConst || Line2D;
          const line = new lineConst(vertex, instance);
          instance.prevLine(line);
          vertex.nextLine(line);
        }
      }
      const line = instance.prevLine();
      if (line === undefined) return undefined;
      return line.startVertex();
    };
    this.nextVertex = (point, lineConst) => {
      if (point !== undefined) {
        const vertex = new Vertex2D(point);
        const origVertex = this.nextVertex();
        const origLine = this.nextLine();
        if (origVertex instanceof Vertex2D) {
          lineConst = lineConst || Line2D;
          const line = new lineConst(vertex, origVertex);
          origVertex.prevLine(line);
          vertex.nextLine(line);
          vertex.prevLine(origLine);
          origLine.endVertex(vertex);
        } else {
          lineConst = lineConst || Line2D;
          const line = new lineConst(instance, vertex);
          instance.nextLine(line);
          vertex.prevLine(line);
        }
      }
      const line = instance.nextLine();
      if (line === undefined) return undefined;
      return line.endVertex();
    };
    this.distance = (vertex) => {
      vertex = (vertex instanceof Vertex2D) ? vertex : new Vertex2D(vertex);
      const xDiff = vertex.x() - this.x();
      const yDiff = vertex.y() - this.y();
      return Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
    }
  }
}

Vertex2D.center = (...verticies) => {
  let x = 0;
  let y = 0;
  let count = 0;
  verticies.forEach((vertex) => {
      count++;
      x += vertex.x();
      y += vertex.y();
  });
  return new Vertex2D({x: x/count, y: y/count});
}

class LineMeasurment2D extends Lookup {
  constructor(line) {
    super();
    const offset = 100;
    this.I = (layer) => {
      layer = layer || 1;
      const startLine = line.perpendicular(line.startVertex());
      const endLine = line.perpendicular(line.endVertex());
      const startCircle = new Circle2D(offset, line.startVertex());
      const endCircle = new Circle2D(offset, line.endVertex());
      const startTerminationCircle = new Circle2D(layer * 10 + offset, line.startVertex());
      const endTerminationCircle = new Circle2D(layer * 10 + offset, line.endVertex());
      const startVerticies = startCircle.lineIntersects(startLine);
      const endVerticies = endCircle.lineIntersects(endLine);
      let inner, outer;
      if (startVerticies.length > 0 && endVerticies.length > 0) {
        const startTerminationVerticies = startTerminationCircle.lineIntersects(startLine);
        const endTerminationVerticies = endTerminationCircle.lineIntersects(endLine);
        const startTerminationLine = new Line2D(startTerminationVerticies[0], startTerminationVerticies[1]);
        const endTerminationLine = new Line2D(endTerminationVerticies[0], endTerminationVerticies[1]);
        const center = Vertex2D.center.apply(null, line.startVertex().verticies());
        inner = new Line2D(startVerticies[1], endVerticies[1]);
        outer = new Line2D(startVerticies[0], endVerticies[0]);
        if (inner.midpoint().distance(center) > outer.midpoint().distance(center)) {
          outer = undefined;
        } else {
          inner = undefined;
        }
        return {startLine: startTerminationLine, endLine: endTerminationLine, outer, inner};
      } else {
        console.log(startVerticies, endVerticies);
        return {};
      }
    }
  }
}

class Line2D  extends Lookup {
  constructor(startVertex, endVertex) {
    super();
    startVertex = new Vertex2D(startVertex);
    endVertex = new Vertex2D(endVertex);
    const measurement = new LineMeasurment2D(this);
    Object.getSet(this, {startVertex, endVertex, measurement});
    function getSlope(v1, v2) {
      const y1 = v1.y();
      const y2 = v2.y();
      const x1 = v1.x();
      const x2 = v2.x();
      return (y2 - y1) / (x2 - x1);
    }

    function getB(x, y, slope) {
        return y - slope * x;
    }

    function newX(m1, m2, b1, b2) {
      return (b2 - b1) / (m1 - m2);
    }

    function getY(x, slope, b) {return slope*x + b}
    function getX(y, slope, b) {return  (y - b)/slope}

    this.length = () => {
      const a = endVertex.x() - startVertex.x();
      const b = endVertex.y() - startVertex.y();
      return Math.sqrt(a*a + b*b);
    }

    this.midpoint = () => {
      const x = (endVertex.x() + startVertex.x())/2;
      const y = (endVertex.y() + startVertex.y())/2;
      return new Vertex2D({x,y});
    }

    // this.y = (x) => this.slope()*x + this.yIntercept();
    // this.x = (y) => {}(y - this.yIntercept())/this.slope();
    this.y = (x) => {
      const slope = this.slope();
      return Math.abs(slope) === Infinity ? 0 : (this.slope()*x + this.yIntercept());
    }

    this.x = (y) => {
      const slope = this.slope();
      return Math.abs(slope) === Infinity ? y: (y - this.yIntercept())/slope;
    }

    this.closestPointOnLine = (vertex) => {
      vertex = (vertex instanceof Vertex2D) ? vertex : new Vertex2D(vertex);
      const perpLine = this.perpendicular(vertex);
      const perpSlope = perpLine.slope();
      const slope = this.slope();
      let x, y;
      if (!Number.isFinite(slope)) {
        x = this.startVertex().x();
        y = vertex.y();
      } else if (!Number.isFinite(perpSlope)) {
        x = vertex.x();
        y = this.startVertex().y();
      } else {
        x = newX(slope, perpSlope, this.yIntercept(), perpLine.yIntercept());
        y = this.y(x);
      }
      console.log('x:', x, 'y:', y);
      return new Vertex2D({x, y});
    }

    this.slope = () => getSlope(startVertex, endVertex);
    this.inverseX = (y) => this.slope()*y + this.yIntercept();
    this.inverseY = (x) => (x-this.yIntercept())/this.slope();
    const MSI = Number.MAX_SAFE_INTEGER;
    const NMSI = -1*Number.MAX_SAFE_INTEGER;
    this.perpendicular = (vertex) => {
      const slope = this.slope();
      if (slope === 0) return new Line2D({x: vertex.x(), y: 1000}, {x: vertex.x(), y: -1*1000});
      if (Math.abs(slope) === Infinity) return new Line2D({x: 1000, y: vertex.y()}, {x: -1*1000, y: vertex.y()});;

      const slopeInverse = -1/slope;
      const b = getB(vertex.x(), vertex.y(), slopeInverse);
      const startVertex = {x: getX(1000, slopeInverse, b), y: 1000};
      const endVertex = {x: getX(-1000, slopeInverse, b), y: -1000};
      const line = new Line2D(startVertex, endVertex);
      return line;
    }
    this.yIntercept = () => getB(startVertex.x(), startVertex.y(), this.slope());
    this.findIntersection = (line) => {
      const slope = this.slope();
      const lineSlope = line.slope();
      let x, y;
      if (!Number.isFinite(slope)) {
        x = this.startVertex().x();
        y = line.y(x);
      } else if (!Number.isFinite(lineSlope)) {
        y = line.startVertex().y();
        x = line.x(y);
      } else {
        x = newX(slope, lineSlope, this.yIntercept(), line.yIntercept());
        y = this.y(x);
      }
      console.log('test passed: ', y === line.y(x));
      return {x, y};
    }
    this.angle = () => this.radians() * 180/Math.PI % 360;
    this.radians = () => {
      const deltaX = endVertex.x() - startVertex.x();
      const deltaY = endVertex.y() - startVertex.y();
      return Math.atan2(deltaY, deltaX);
    }

    this.move = (event) => {
      const mouseLocation = new Vertex2D({x: event.imageX, y: event.imageY});
      const perpLine = this.perpendicular(mouseLocation);
      const interX = this.findIntersection(perpLine);
      const diffLine = new Line2D(interX, mouseLocation);
      const rads = diffLine.radians();
      const xDiff = Math.cos(rads);
      const yDiff = Math.sin(rads);
      const sv = this.startVertex();
      const newStart = {x: sv.x() + xDiff, y: sv.y() + yDiff};
      const ev = this.endVertex();
      const newEnd = {x: ev.x() + xDiff, y: ev.y() + yDiff};
      this.startVertex().point().x = newStart.x;
      this.startVertex().point().y = newStart.y;
      this.endVertex().point().x = newEnd.x;
      this.endVertex().point().y = newEnd.y;

      // const slope = this.slope();
      // const b = getB(event.imageX, event.imageY, slope);
      //
      // const prevLine = startVertex.prevLine();
      // const nextLine = endVertex.nextLine();
      //
      // const newPrevX = newX(prevLine.slope(), slope, prevLine.yIntercept(), b);
      // const newPrevY = prevLine.y(newPrevX);
      // startVertex.point({x: newPrevX, y: newPrevY});
      //
      // const nX = newX(nextLine.slope(), slope, nextLine.yIntercept(), b);
      // const nY = nextLine.y(nX);
      // endVertex.point({x: nX, y: nY});
    };
  }
}




const vertexMap = {};
function getVertex(point, wall1, wall2) {
  const mapId = `${wall1.id()}->${wall2.id()}`;
  if (vertexMap[mapId] === undefined) {
    vertexMap[mapId] = new Layout2D.Vertex2D(point);
    wall1.startVertex(vertexMap[mapId]);
    wall2.endVertex(vertexMap[mapId]);
  }
  else vertexMap[mapId].point(point);
  return vertexMap[mapId];
}

class OnWall extends Lookup {
  constructor(wall, fromPreviousWall, fromFloor, height, width) {
    super();
    Object.getSet(this, {width, height, fromFloor, fromPreviousWall});
    this.wallEndpoints2D = () => {
      const wallStartPoint = wall.startVertex();
      const dist = this.fromPreviousWall();
      const total = dist + width;
      return {
        start: new Vertex2D({
          x: wallStartPoint.x() + dist * Math.cos(theta),
          y: wallStartPoint.y() + dist * Math.sin(theta)
        }),
        end: new Vertex2D({
          x: wallStartPoint.x + total * Math.cos(theta),
          y: wallStartPoint.y + total * Math.sin(theta)
        })
      };
    }
    this.move = (event) => {
      const point = wall.closestPointOnLine({x: event.imageX, y: event.imageY});
      let distance = wall.startVertex().distance(point);
      const max = wall.length() - this.width();
      distance = distance < 0 ? 0 : distance;
      distance = distance > max ? max : distance;
      this.fromPreviousWall(distance);
    };
  }
}

class Door2D extends Lookup {
  constructor() {
    super(...arguments);
    this.width(this.width() || 81.28);
    this.height(this.height() || 198.12);
    this.fromPreviousWall(this.fromPreviousWall() || 150);
    Object.getSet(this, {
      hingeRight: true,
    });
  }
}

class Window2D extends Lookup {
  constructor(wall, fromPreviousWall, fromFloor, height, width) {
    width = width || 81.28;
    height = height || 91.44;
    fromFloor = fromFloor || 101.6;
    fromPreviousWall = fromPreviousWall || 20;
    super(wall, fromPreviousWall, fromFloor, height, width);
  }
}

class Wall2D extends Line2D {
  constructor(startVertex, endVertex, height) {
    super(startVertex, endVertex);
    const windows = [];
    const doors = [];
    const wall = this;

    height = height || 243.84;
    Object.getSet(this, {height, windows, doors});
    this.copy = () => new Wall2D(this.length(), this.radians());
    this.windows = () => windows;
    this.addWindow = (window) => windows.push(window);
    this.doors = () => doors;
    this.addDoor = (door) => doors.push(door);
    this.verticies = () => {
      const verts = [startVertex, endVertex];
      doors.concat(windows).forEach((onWall) => {

      });
    }

    this.addDoor(new Door2D(this));
    this.addWindow(new Window2D(this));
  }
}

const ww = 304.8;
class Layout2D extends Lookup {
  constructor() {
    super();
    let startVertex;
    let endVertex;

    this.push = (...points) => {
      points = Array.isArray(points) ? points : [points];
      points.forEach((point) => {
        if (startVertex === undefined) {
          startVertex = new Vertex2D(point);
          endVertex = startVertex;
        } else {
          endVertex = endVertex.nextVertex(point, Wall2D);
        }
      });
    }

    this.push({x:0, y:0}, {x:ww, y:50}, {x:ww,y:-1*ww}, {x:50,y:-1*ww});
    startVertex.enclose(Wall2D);
    this.walls = () => startVertex.lines();
    this.verticies = () => startVertex.verticies();
  }
}

const circle = new Circle2D(5, new Vertex2D({x: 0, y: 0}));
const line = new Line2D({x: -1, y: 0}, {x: 0, y: -1});
const perp = line.perpendicular(new Vertex2D({x:0, y: 0}));
console.log(circle.lineIntersects(line));
console.log(circle.lineIntersects(perp));

Layout2D.Vertex2D = Vertex2D;
Layout2D.Wall2D = Wall2D;
module.exports = Layout2D;
