
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const Measurement = require('../../../../public/js/utils/measurement.js');
const StateHistory = require('../../../../public/js/utils/services/state-history');
const approximate = require('../../../../public/js/utils/approximate.js');
const Vertex2d = require('../two-d/objects/vertex.js');
const Line2d = require('../two-d/objects/line.js');
const Square2d = require('../two-d/objects/square.js');
const Circle2d = require('../two-d/objects/circle.js');
const Snap2d = require('../two-d/objects/snap.js');

const pushVertex = (x, y, arr) => {
  if (Number.isNaN(x) || Number.isNaN(y)) return;
  arr.push(new Vertex2d({x, y}));
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

class OnWall extends Lookup {
  constructor(wall, fromPreviousWall, fromFloor, height, width) {
    super();
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
    this.setWall = (w) => wall = w;
    this.move = (center) => {
      const point = wall.closestPointOnLine(center);
      const onLine = wall.closestPointOnLine(point, true);
      let distanceStart = wall.startVertex().distance(point);
      if (!onLine) {
        let distanceEnd = wall.endVertex().distance(point);
        if (distanceStart < distanceEnd) this.fromPreviousWall(0);
        else this.fromPreviousWall(wall.length() - this.width());
      } else {
        const max = wall.length() - this.width();
        distanceStart = distanceStart > max ? max : distanceStart;
        this.fromPreviousWall(distanceStart);
      }
    };
    this.toString = () => `${this.constructor.name}:${wall}, ${fromPreviousWall}, ${fromFloor}, ${height}, ${width}`
  }
}
OnWall.sort = (ow1, ow2) => ow1.fromPreviousWall() - ow2.fromPreviousWall();
OnWall.fromJson = (json) => {
  const cxtr = Lookup.decode(json.id).constructor;
  const instance = new cxtr(null, json.fromPreviousWall, json.fromFloor, json.height, json.width);
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

function modifyVertex(vertex) {
  return (props) => {
      console.log('DummyFuncNotIntendedToBeCalled');
  }
}

class Wall2D extends Line2d {
  constructor(startVertex, endVertex, height, windows, doors) {
    super(startVertex, endVertex);
    this.startVertex().modificationFunction(modifyVertex(this.startVertex()));
    this.endVertex().modificationFunction(modifyVertex(this.endVertex()));
    Lookup.convert(this);
    windows = windows || [];
    windows.forEach((win) => win.setWall(this));
    doors = doors || [];
    doors.forEach((door) => door.setWall(this));
    const wall = this;

    height = height || 243.84;
    Object.getSet(this, {height, windows, doors});
    // this.copy = () => new Wall2D(this.length(), this.radians());
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
Wall2D.fromJson = (json, vertexMap) => {
  vertexMap ||= {};
  const newSv = Object.fromJson(json.startVertex);
  const svStr = newSv.toString();
  const newEv = Object.fromJson(json.endVertex);
  const evStr = newEv.toString();
  if (vertexMap[svStr] === undefined) vertexMap[svStr] = newSv;
  if (vertexMap[evStr] === undefined) vertexMap[evStr] = newEv;
  const sv = vertexMap[svStr];
  const ev = vertexMap[evStr];
  const windows = Object.fromJson(json.windows);
  const doors = Object.fromJson(json.doors);
  const inst = new Wall2D(sv, ev, json.height, windows, doors);
  inst.id(json.id);
  return inst;
}

function defSquare(center, parent) {
  return new Snap2d(parent, new Square2d(center), 30);
}

class Object2d extends Lookup {
  constructor(center, layout, payload, name) {
    super();
    center = new Vertex2d(center);
    this.layout = () => layout;
    Object.getSet(this, {payload, name,
      topview: defSquare(center, this), bottomView: defSquare(center, this),
      leftview: defSquare(center, this), rightview: defSquare(center, this),
      frontview: defSquare(center, this), backView: defSquare(center, this)
    });

    if ((typeof name) === 'function') this.name = name;
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
    const instance = this;

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

    this.wallIndex = (wallOrIndex) => {
      if (wallOrIndex instanceof Wall2D) {
        for (let index = 0; index < walls.length; index += 1) {
          if (walls[index] === wallOrIndex) return index;
        }
        return -1;
      } else {
        while(wallOrIndex < 0) wallOrIndex += walls.length;
        return wallOrIndex % walls.length;
      }
    }

    function relitiveWall(wall, i) {
      let position = instance.wallIndex(wall);
      if (position === undefined) return null;
      const relitiveList = walls.slice(position).concat(walls.slice(0, position));
      return relitiveList[instance.wallIndex(i)];
    }
    this.relitiveWall = relitiveWall;
    this.nextWall = (wall) => relitiveWall(wall, 1);
    this.prevWall = (wall) => relitiveWall(wall, -1);

    function reconsileLength (wall) {
      return (newLength) => {
        const moveVertex = wall.endVertex();
        const nextLine = instance.nextWall(wall);
        if (nextLine === undefined) wall.length(newLength);

        const vertex1 = nextLine.endVertex();
        const circle1 = new Circle2d(nextLine.length(), vertex1);
        const vertex2 = wall.startVertex();
        const circle2 = new Circle2d(newLength, vertex2);
        const intersections = circle1.intersections(circle2);

        const useFirst = (intersections.length !== 0 && intersections.length === 1) ||
                  moveVertex.distance(intersections[0]) < moveVertex.distance(intersections[1]);
        if (intersections.length === 0) {
          wall.length(newLength);
        } else if (useFirst) {
          moveVertex.point(intersections[0]);
        } else {
          moveVertex.point(intersections[1]);
        }
      }
    }
    this.reconsileLength = reconsileLength;

    const sortById = sortByAttr('id');
    this.toJson = () => {
      const objs = this.objects();
      const json = {walls: []};
      json.id = this.id();
      json.objects = Array.toJson(objs);
      this.walls().forEach((wall) => {
        json.walls.push(wall.toJson());
      });
      // json.walls.sort(sortById);
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
      delete json.id;
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

    this.addObject = (id, payload, name) => {
      const center = Vertex2d.center.apply(null, this.verticies())
      const obj = new Object2d(center, this, payload, name);
      obj.id(id);
      this.objects().push(obj);
      return obj;
    }

    this.removeObject = (obj) => {
      for (index = 0; index < objects.length; index += 1) {
        if (objects[index] === obj) {
          return objects.splice(index, 1);
        }
      }
      return null;
    }

    this.removeByPayload = (payload) => {
      for (index = 0; index < objects.length; index += 1) {
        if (objects[index].payload() === payload) {
          return objects.splice(index, 1);
        }
      }
      return null;
    }

    this.idMap = () => {
      const idMap = {};
      const walls = this.walls();
      idMap[walls[0].startVertex().id()] = walls[0].startVertex();
      walls.forEach((wall) => {
        idMap[wall.id()] = wall;
        const endV = wall.endVertex();
        idMap[endV.id()] = endV;
        wall.windows().forEach((window) => idMap[window.id()] = window);
        wall.windows().forEach((window) => idMap[window.id()] = window);
        wall.doors().forEach((door) => idMap[door.id()] = door);
      });
      objects.forEach((obj) => idMap[obj.id()] = obj);
      return idMap;
    }

    this.removeWall = (wall) => {
      if (!(wall instanceof Wall2D)) return undefined;
      const walls = this.walls();
      for (index = 0; index < walls.length; index += 1) {
        const currWall = walls[index];
        if (currWall === wall) {
          const nextWallSv = walls[this.wallIndex(index + 1)].startVertex();
          walls[this.wallIndex(index - 1)].endVertex(nextWallSv);
          walls.splice(index, 1);
          return currWall;
        }
      }
      return null;
    }

    this.addVertex = (vertex, wall) => {
      vertex = new Vertex2d(vertex);
      let wallIndex = this.wallIndex(wall);
      if (wallIndex === -1) {
        wall = walls[walls.length - 1];
        wallIndex = this.wallIndex(wall);
      }
      let newWall = new Wall2D(vertex, wall.endVertex());
      wall.endVertex(vertex);

      const tail = [newWall].concat(walls.slice(wallIndex + 1));
      walls = walls.slice(0, wallIndex + 1).concat(tail);
    }

    this.removeVertex = (vertex) => {
      if (!(vertex instanceof Vertex2d)) return undefined;
      const walls = this.walls();
      for (index = 0; index < walls.length; index += 1) {
        const wall = walls[index];
        if (wall.startVertex() === vertex) {
          walls[this.wallIndex(index - 1)].endVertex(walls[this.wallIndex(index + 1)].startVertex());
          return walls.splice(index, 1);
        }
        if (wall.endVertex() === vertex) {
          walls[this.wallIndex(index + 1)].startVertex(walls[this.wallIndex(index - 1)].endVertex());
          return walls.splice(index, 1);
        }
      }
      return null;
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

      return this.removeVertex(item) || this.removeWall(item) ||
              this.removeObject(item) || item.remove();
    }

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
          const xEqual = approximate.eq(intersection.x, vertex.x, 100);
          const yEqual = approximate.eq(intersection.y, vertex.y, 100);
          if (xEqual && yEqual) onLine = true;
          intersections.push(intersection);
        }
      });

      return onLine || intersections.length % 2 === 1;
    }

    this.setHistory = (h) => {
      history = h.clone(this.toJson);
    }

    history = new StateHistory(this.toJson);
    this.history = () => history;

    if (!initialized) this.push({x:1, y:1}, {x:ww, y:0}, {x:ww,y:ww}, {x:0,y:ww});
    this.walls = () => walls;

  }
}

Layout2D.fromJson = (json, history) => {
  const walls = [];
  const vertexMap = {};
  json.walls.forEach((wallJson) => walls.push(Wall2D.fromJson(wallJson, vertexMap)));

  const objects = Object.fromJson(json.objects);
  const layout = new Layout2D(walls, objects);
  layout.id(json.id);
  json.snapLocations.forEach((snapLocJson) => {
    const snapLoc1 = Lookup.get(snapLocJson[0].objectId)[snapLocJson[0].location]();
    const snapLoc2 = Lookup.get(snapLocJson[1].objectId)[snapLocJson[1].location]();
    snapLoc2.pairWith(snapLoc1);
  });

  if (history) layout.setHistory(history);
  return layout;
}

new Layout2D();
new Object2d();
new Door2D();
new Window2D();

Layout2D.Wall2D = Wall2D;
Layout2D.Window2D = Window2D;
Layout2D.Object2d = Object2d;
Layout2D.Door2D = Door2D;
module.exports = Layout2D;
