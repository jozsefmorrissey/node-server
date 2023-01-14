
const approximate = require('../../../../../public/js/utils/approximate.js').new(1);
const Lookup = require('../../../../../public/js/utils/object/lookup.js');
const StateHistory = require('../../../../../public/js/utils/services/state-history');
const Vertex2d = require('../objects/vertex.js');
const Line2d = require('../objects/line.js');
const Circle2d = require('../../two-d/objects/circle.js');
const CustomEvent = require('../../../../../public/js/utils/custom-event.js');
const Wall2D = require('./wall');
const Window2D = require('./window');
const Object2d = require('./object');
const Door2D = require('./door');

function withinTolerance(point, map) {
  const t = map.tolerance;
  const start = map.start.point ? map.start.point() : map.start;
  const end = map.end.point ? map.end.point() : map.end;
  const x0 = point.x;
  const y0 = point.y;
  const x1 = start.x > end.x ? end.x : start.x;
  const y1 = start.y > end.y ? end.y : start.y;
  const x2 = start.x < end.x ? end.x : start.x;
  const y2 = start.y < end.y ? end.y : start.y;
  return x0>x1-t && x0 < x2+t && y0>y1-t && y0<y2+t;
}

const ww = 500;
class Layout2D extends Lookup {
  constructor(walls, objects) {
    super();
    let history;
    const addEvent = new CustomEvent('add');
    const removeEvent = new CustomEvent('remove');
    const stateChangeEvent = new CustomEvent('stateChange');
    this.onAdd = (func) => addEvent.on(func);
    this.onRemove = (func) => removeEvent.on(func);
    this.onStateChange = (func) => stateChangeEvent.on(func);

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

    this.addObject = (id, payload, name, polygon) => {
      const center = Vertex2d.center.apply(null, this.vertices())
      const obj = new Object2d(center, this, payload, name, polygon);
      obj.id(id);
      this.objects().push(obj);
      history.newState();
      addEvent.trigger(undefined, payload);
      return obj;
    }

    this.removeObject = (obj) => {
      for (index = 0; index < objects.length; index += 1) {
        if (objects[index] === obj) {
          const obj = objects.splice(index, 1);
          removeEvent.trigger(undefined, obj.payload());
          return obj;
        }
      }
      return null;
    }

    this.removeByPayload = (payload) => {
      for (index = 0; index < objects.length; index += 1) {
        if (objects[index].payload() === payload) {
          const obj = objects.splice(index, 1);
          removeEvent.trigger(undefined, payload);
          return obj;
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
          throw new Error('Cannot Remove any more vertices or walls');

      return this.removeVertex(item) || this.removeWall(item) ||
              this.removeObject(item) || item.remove();
    }

    this.vertices = (target, before, after) => {
      const lines = this.walls();
      if (lines.length === 0) return [];
      const fullList = [];
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        fullList.push(line.startVertex());
      }
      if (target) {
        const vertices = [];
        const index = fullList.indexOf(target);
        if (index === undefined) return null;
        for (let i = before; i < before + after + 1; i += 1)
            vertices.push(fullList[Math.mod(i, fullList.length)]);
        return vertices;
      } else return fullList;

      return vertices;
    }

    this.within = (vertex) => {
      vertex = new Vertex2d(vertex);
      const endpoint = {x: 0, y: 0};
      this.vertices().forEach(v => {
        // TODO: figure out why negating the components causes errors....
        // endpoint.x -= v.x() * 2;
        // endpoint.y -= v.y() * 2;
        endpoint.x += v.x() * 2;
        endpoint.y += v.y() * 2;
      });
      const escapeLine = new Line2d(vertex, endpoint);
      const intersections = [];
      let onLine = false;
      const allIntersections = [];
      this.walls().forEach((wall) => {

        const intersection = wall.findSegmentIntersection(escapeLine, true);
        allIntersections.push(intersection);
        if (intersection) {
          // Todo make more accurate
          const xEqual = approximate.eq(intersection.x(), vertex.x());
          const yEqual = approximate.eq(intersection.y(), vertex.y());
          if (xEqual && yEqual) onLine = true;
          intersections.push(intersection);
        }
      });

      return onLine || intersections.length % 2 === 1;
    }

    this.connected = () => {
      for (let index = 0; index < walls.length; index += 1) {
        const wall = walls[index];
        const prevWall = this.prevWall(wall);
        if (wall.startVertex() !== prevWall.endVertex()) return false;
      }
      return true;
    }

    this.payloads = () => {
      const payloads = [];
      this.objects().forEach((obj) => {
        const center = obj.center();
        const payload = obj.payload();
        payloads.push({center, payload});
      });
      return payloads;
    }

    function filterCompare(list) {
      list = list.map((o) => o.payload());
      return list.filter((o) => o);
    }

    this.fromJson = (json) => {
      const layout = Layout2D.fromJson(json);
      const origWalls = this.walls();
      const newWalls = layout.walls();
      const wallCompare = Array.compare(origWalls, newWalls, true);

      const origObjects = this.objects();
      const newObjects = layout.objects();
      const objCompare = Array.compare(origObjects, newObjects, true);

      if (objCompare || wallCompare) {
        const detail = {layout, objects: {added: [], removed: []}, walls: {added: [], removed: []}};
        if (objCompare) {
          detail.objects.added = filterCompare(objCompare.added);
          detail.objects.removed = filterCompare(objCompare.removed);
        }
        if (wallCompare) {
          detail.walls.added = filterCompare(wallCompare.added);
          detail.walls.removed = filterCompare(wallCompare.removed);
        }
        stateChangeEvent.trigger(undefined, detail);
      }
    }

    // if (!initialized) this.push({x:0, y:0}, {x:ww, y:0}, {x:ww,y:ww}, {x:0,y:ww});
    if (!initialized) this.push({x:1, y:1}, {x:ww+1, y:0}, {x:ww + 1,y:ww + 1}, {x:1,y:ww});
    this.walls = () => walls;

    history = new StateHistory(this.toJson, this.fromJson);
    this.history = () => history;

    this.snapAt = (vertex, excuded) => {
      for (let index = 0; index < objects.length; index++) {
        const obj = objects[index];
        if (excuded !== obj || Array.exists(excuded, obj)) {
          const hovering = obj.topview().hoveringSnap(vertex, excuded);
          if (hovering) return hovering;
        }
      }
    }

    this.atWall = (vertex) => {
      for (let index = 0; index < walls.length; index++) {
        const hovering = walls[index].hovering(vertex);
        if (hovering) return hovering;
      }
    }

    this.at = (vertex) => {
      for (let index = 0; index < objects.length; index++) {
        const hovering = objects[index].topview().hovering(vertex);
        if (hovering) return hovering;
      }
      return this.atWall(vertex);
    }
  }
}

// Needs to be internal!!!!
Layout2D.fromJson = (json) => {
  const walls = [];
  const vertexMap = {};
  json.walls.forEach((wallJson) => walls.push(Wall2D.fromJson(wallJson, vertexMap)));

  const layout = new Layout2D(walls);
  layout.id(json.id);

  const objects = [];
  json.objects.forEach((o) => {
    const center = Vertex2d.fromJson(o.center);
    let obj = Object2d.get(o.id);
    if (obj === undefined) {
      obj = new Object2d(center, layout, undefined, o.name);
      obj.payloadId(o.payloadId);
      obj.id(o.id);
    } else obj.fromJson(o);
    objects.push(obj);
  });
  layout.objects(objects);
  json.snapLocations.forEach((snapLocJson) => {
    const view = snapLocJson.view;
    const obj1 = Lookup.get(snapLocJson[0].objectId);
    const obj2 = Lookup.get(snapLocJson[1].objectId);
    const snapLoc1 = obj1[view]().position[snapLocJson[0].location]();
    const snapLoc2 = obj2[view]().position[snapLocJson[1].location]();
    snapLoc2.pairWith(snapLoc1);
  });

  console.log('isConnected:', layout.connected());
  return layout;
}

const layoutStateChangeEvent = new CustomEvent('layoutStateChange');
Layout2D.onStateChange = layoutStateChangeEvent.on;

new Layout2D();
module.exports = Layout2D;
