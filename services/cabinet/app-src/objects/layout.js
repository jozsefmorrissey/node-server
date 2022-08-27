
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const Measurement = require('../../../../public/js/utils/measurement.js');
const StateHistory = require('../../../../public/js/utils/services/state-history');
const approximate = require('../../../../public/js/utils/approximate.js');
const Vertex2d = require('../two-d/objects/vertex.js');
const Line2d = require('../two-d/objects/line.js');
const Square2d = require('../two-d/objects/square.js');
const Snap2d = require('../two-d/objects/snap.js');

const pushVertex = (x, y, arr) => {
  if (Number.isNaN(x) || Number.isNaN(y)) return;
  arr.push(new Vertex2d({x, y}));
}

function toRadians(angle) {
  return approximate((angle*Math.PI/180)%(2*Math.PI));
}

const vertexMap = {};
function getVertex(point, wall1, wall2) {
  const mapId = `${wall1.id()}->${wall2.id()}`;
  if (vertexMap[mapId] === undefined) {
    vertexMap[mapId] = new Vertex2d(point);
    wall1.startVertex(vertexMap[mapId]);
    wall2.endVertex(vertexMap[mapId]);
  }
  else vertexMap[mapId].point(point);
  return vertexMap[mapId];
}

class OnWall {
  constructor(wall, fromPreviousWall, fromFloor, height, width) {
    Object.getSet(this, {width, height, fromFloor, fromPreviousWall}, 'wallId');
    let start = new Vertex2d();
    let end = new Vertex2d();
    this.wallId = () => wall.id();
    this.endpoints2D = () => {
      const wallStartPoint = wall.startVertex();
      const dist = this.fromPreviousWall();
      const total = dist + this.width();
      const theta = wall.radians();
      const startPoint = {};
      startPoint.x = wallStartPoint.x() + dist * Math.cos(theta);
      startPoint.y = wallStartPoint.y() + dist * Math.sin(theta);
      start.point(startPoint);

      const endPoint = {};
      endPoint.x = (wallStartPoint.x() + total * Math.cos(theta));
      endPoint.y = (wallStartPoint.y() + total * Math.sin(theta));
      end.point(endPoint);

      return { start, end, toString: () => `${start.toString()} => ${end.toString()}`};
    }
    this.fromPreviousWall = (value) => {
      value = Number.parseFloat(value);
      if (!Number.isNaN(value)) fromPreviousWall = value;
      return fromPreviousWall;
    }
    this.fromNextWall = (value) => {
      value = Number.parseFloat(value);
      if (value) {
        this.fromPreviousWall(wall.length() - this.width() - value);
      }
      return wall.length() - this.width() - this.fromPreviousWall();
    }
    this.wall = () => wall;
    this.move = (center) => {
      const point = wall.closestPointOnLine(center);
      let distance = wall.startVertex().distance(point);
      const max = wall.length() - this.width();
      distance = distance < 0 ? 0 : distance;
      distance = distance > max ? max : distance;
      this.fromPreviousWall(distance);
    };
    this.toString = () => `${this.constructor.name}:${wall}, ${fromPreviousWall}, ${fromFloor}, ${height}, ${width}`
  }
}
OnWall.sort = (ow1, ow2) => ow1.fromPreviousWall() - ow2.fromPreviousWall();
OnWall.fromJson = (json) => {
  const cxtr = Lookup.decode(json.id).constructor;
  const wall = Lookup.get(json.wallId);
  const instance = new cxtr(wall, json.fromPreviousWall, json.fromFloor, json.height, json.width);
  instance.id(json.id);
  return instance;
}

class Door2D extends OnWall {
  constructor() {
    super(...arguments);
    this.width(this.width() || 91.44);
    this.height(this.height() || 198.12);
    this.fromPreviousWall(this.fromPreviousWall() || 150);
    this.fromFloor(this.fromFloor() || 0);
    let hinge = 0;
    Object.getSet(this, 'hinge');
    this.toString = () => `${this.id()}:${this.endpoints2D().toString()}:${hinge}`;
    this.remove = () => this.wall().removeDoor(this);
    this.hinge = (val) => val === undefined ? hinge :
      hinge = ((typeof val) === 'number' ? val : hinge + 1) % 5;
  }
}

Door2D.fromJson = (json) => {
  const inst = OnWall.fromJson(json);
  inst.hinge(json.hinge);
  return inst;
}

class Window2D extends OnWall {
  constructor(wall, fromPreviousWall, fromFloor, height, width) {
    width = width || 81.28;
    height = height || 91.44;
    fromFloor = fromFloor || 101.6;
    fromPreviousWall = fromPreviousWall || 20;
    super(wall, fromPreviousWall, fromFloor, height, width);
    this.remove = () => this.wall().removeWindow(this);
    this.toString = () => `${this.id()}:${this.endpoints2D().toString()}`;
  }
}

class Wall2D extends Line2d {
  constructor(startVertex, endVertex, height, windows, doors) {
    super(startVertex, endVertex);
    windows = windows || [];
    doors = doors || [];
    const wall = this;

    height = height || 243.84;
    Object.getSet(this, {height, windows, doors});
    this.copy = () => new Wall2D(this.length(), this.radians());
    this.windows = () => windows;
    this.addWindow = (fromPreviousWall) => windows.push(new Window2D(this, fromPreviousWall));
    this.doors = () => doors;
    this.addDoor = (fromPreviousWall) => doors.push(new Door2D(this, fromPreviousWall));
    this.verticies = () => {
      const verts = [this.startVertex()];
      const doorsAndWindows = doors.concat(windows);
      doorsAndWindows.sort(OnWall.sort);
      doorsAndWindows.forEach((onWall) => {
        const endpoints = onWall.endpoints2D();
        verts.push(endpoints.start);
        verts.push(endpoints.end);
      });
      verts.push(this.endVertex());
      return verts;
    }

    this.remove = () => {
        const prevWall = this.startVertex().prevLine();
        const nextLine = this.endVertex().nextLine();
        const startVertex = this.startVertex();
        nextLine.startVertex(startVertex);
        startVertex.nextLine(nextLine);
    }

    this.removeDoor = (door) => doors.splice(doors.indexOf(door), 1);
    this.removeWindow = (window) => windows.splice(windows.indexOf(window), 1);
  }
}
Wall2D.fromJson = (json) => {
  const doors = Object.fromJson(json.doors);
  const windows = Object.fromJson(json.windows);
  const height = json.height;
  const inst = new Wall2D(undefined, undefined, height, windows, doors);
  inst.id(json.id);
  return inst;
}

function defSquare(center, layout) {
  return new Snap2d(layout, new Square2d(center), 30);
}

class Object2d {
  constructor(center, layout, payload) {
    const id = String.random();
    this.id = () => id;
    center = new Vertex2d(center);
    Object.getSet(this, {payload,
      topview: defSquare(center, layout), bottomView: defSquare(center, layout),
      leftview: defSquare(center, layout), rightview: defSquare(center, layout),
      frontview: defSquare(center, layout), backView: defSquare(center, layout)
    });

    this.toString = () => `Object2d: ${center}`;
  }
}

const ww = 500;
class Layout2D extends Lookup {
  constructor(walls, objects, history) {
    super();
    walls = walls || [];
    objects = objects || [];
    Object.getSet(this, {objects, walls});
    const initialized = walls.length > 0;

    this.startLine = () => this.walls()[0];
    this.endLine = () => this.walls()[this.walls().length - 1];

    function sortByAttr(attr) {
      function sort(obj1, obj2) {
        if (obj2[attr] === obj1[attr]) {
          return 0;
        }
        return obj2[attr] < obj1[attr] ? 1 : -1;
      }
      return sort;
    }

    const sortById = sortByAttr('id');
    this.toJson = () => {
      const objs = this.objects();
      const json = {walls: []};
      json.id = this.id();
      json.objects = Array.toJson(objs);
      this.walls().forEach((wall) => {
        json.walls.push(wall.toJson());
      });
      json.walls.sort(sortById);
      json.objects.sort(sortById);
      const snapMap = {};
      objs.forEach((obj) => {
        const snapLocs = obj.topview().snapLocations.paired();
        snapLocs.forEach((snapLoc) => {
          const snapLocJson = snapLoc.toJson();
          if (snapMap[snapLocJson.UNIQUE_ID] === undefined) {
            snapMap[snapLocJson.UNIQUE_ID] = snapLocJson;
          }
        });
      });
      json.snapLocations = Object.values(snapMap);
      json._TYPE = this.constructor.name;
      return json;
    }

    this.push = (...points) => {
      if (this.startLine() === undefined) {
        const walls = this.walls();
        if (points.length < 3) throw Error('Layout must be initialized with atleast three vertices');
        walls[0] = new Wall2D(points[0], points[1]);
      }
      for (let index = 1; index < points.length; index += 1) {
        const endLine = this.endLine();
        const startV = endLine.endVertex();
        const endV = new Vertex2d(points[(index + 1) % points.length]);
        walls.push(new Wall2D(startV, endV));
      }
    }

    this.addObject = (id) => {
      const center = Vertex2d.center.apply(null, this.verticies())
      const obj = new Object2d(center, this);
      obj.id(id);
      this.objects().push(obj);
      return obj;
    }

    this.idMap = () => {
      const idMap = {};
      const walls = this.walls();
      walls.forEach((wall) => {
        idMap[wall.id()] = wall;
        const endV = wall.endVertex();
        idMap[endV.id()] = endV;
        wall.windows().forEach((window) => idMap[window.id()] = window);
        wall.windows().forEach((window) => idMap[window.id()] = window);
        wall.doors().forEach((door) => idMap[door.id()] = door);
      });
      return idMap;
    }

    this.removeWall = (wall) => {
      if (!(wall instanceof Wall2D)) return undefined;
      const walls = this.walls();
      for (index = 0; index < walls.length; index += 1) {
        const wall = walls[index];
        if (wall.id() === id) {
          walls[index - 1].endVertex(walls[index + 1].startVertex());
          walls.splice(index, 1);
          return wall;
        }
      }
    }

    this.removeVertex = (vertex) => {
      if (!(vertex instanceof Vertex2d)) return undefined;
      const walls = this.walls();
      for (index = 0; index < walls.length; index += 1) {
        const wall = walls[index];
        if (wall.startVertex().id() === id) {
          walls[index - 1].endVertex(walls[index + 1].startVertex());
          walls.splice(index, 1);
        }
        if (wall.endVertex().id() === id) {
          walls[index + 1].startVertex(walls[index - 1].endVertex());
          walls.splice(index, 1);
        }
      }
    }

    this.remove = (id) => {
      id = id instanceof Lookup ? id.id() : id;
      const idMap = this.idMap();
      const walls = this.walls();
      const wallCount = walls.length;
      const item = idMap[id];
      if (item === undefined) throw new Error(`Unknown id: ${id}`);
      if (wallCount < 3 && (item instanceof Wall2D || item instanceof Vertex2d))
          throw new Error('Cannot Remove any more verticies or walls');

      return this.removeVertex(item) || this.removeWall(item) || item.remove();
    }

    if (!initialized) this.push({x:1, y:1}, {x:ww, y:0}, {x:ww,y:ww}, {x:0,y:ww});
    this.walls = () => walls;

    this.verticies = (target, before, after) => {
      const lines = this.walls();
      if (lines.length === 0) return [];
      const fullList = [];
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        fullList.push(line.startVertex());
      }
      if (target) {
        const verticies = [];
        const index = fullList.indexOf(target);
        if (index === undefined) return null;
        for (let i = before; i < before + after + 1; i += 1)
            verticies.push(fullList[Math.mod(i, fullList.length)]);
        return verticies;
      } else return fullList;

      return verticies;
    }

    this.within = (vertex, print) => {
      vertex = vertex instanceof Vertex2d ? vertex.point() : vertex;
      const endpoint = {x: 0, y: 0};
      this.verticies().forEach(vertex => {
        endpoint.x -= vertex.x();
        endpoint.y -= vertex.y();
      });
      const escapeLine = new Line2d(vertex, endpoint);
      const intersections = [];
      let onLine = false;
      const allIntersections = [];
      this.walls().forEach((wall) => {

        const intersection = wall.findIntersection(escapeLine, true);
        allIntersections.push(intersection);
        if (intersection) {
          const xEqual = approximate.eq(intersection.x, vertex.x);
          const yEqual = approximate.eq(intersection.y, vertex.y);
          if (xEqual && yEqual) onLine = true;
          intersections.push(intersection);
        }
      });

      return onLine || intersections.length % 2 === 1;
    }

    history = history instanceof StateHistory ? history : new StateHistory(this.toJson);
    this.history = () => history;
  }
}

Layout2D.fromJson = (json, history) => {
  const walls = Object.fromJson(json.walls);
  const objects = Object.fromJson(json.objects);
  const layout = new Layout2D(walls, objects, history);
  layout.id(json.id);
  json.snapLocations.forEach((snapLocJson) => {
    const snapLoc1 = Lookup.get(snapLocJson[0].objectId)[snapLocJson[0].location]();
    const snapLoc2 = Lookup.get(snapLocJson[1].objectId)[snapLocJson[1].location]();
    snapLoc2.pairWith(snapLoc1);
  });

  layout.id(json.id);
  return layout;
}

new Layout2D();
new Object2d();

Layout2D.Wall2D = Wall2D;
Layout2D.Window2D = Window2D;
Layout2D.Object2d = Object2d;
Layout2D.Door2D = Door2D;
module.exports = Layout2D;
