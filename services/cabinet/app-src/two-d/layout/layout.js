
const approximate = require('../../../../../public/js/utils/approximate.js').new(1);
const Lookup = require('../../../../../public/js/utils/object/lookup.js');
const StateHistory = require('../../../../../public/js/utils/services/state-history');
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Polygon2d = require('../../../../../public/js/utils/canvas/two-d/objects/polygon.js');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Circle2d = require('../../../../../public/js/utils/canvas/two-d/objects/circle.js');
const CustomEvent = require('../../../../../public/js/utils/custom-event.js');
const Property = require('../../config/property.js');
const Measurement = require('../../../../../public/js/utils/measurement.js');
const IMPERIAL_US = Measurement.units()[1];
const Wall2D = require('./wall');
const Corner2d = require('./corner');
const Window2D = require('./window');
const Object3D = require('../../three-d/layout/object.js');
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
  constructor(wallJson) {
    super();
    let walls = [];
    const vertexMap = {};
    Array.isArray(wallJson) && wallJson.forEach((wallJson) => walls.push(Wall2D.fromJson(wallJson, this, vertexMap)));
    let history;
    const addEvent = new CustomEvent('add');
    const removeEvent = new CustomEvent('remove');
    const stateChangeEvent = new CustomEvent('stateChange');
    this.onAdd = (func) => addEvent.on(func);
    this.onRemove = (func) => removeEvent.on(func);
    this.onStateChange = (func) => stateChangeEvent.on(func);

    Object.getSet(this, {objects: [], walls});
    const initialized = walls.length > 0;
    const instance = this;

    this.startLine = () => this.walls()[0];
    this.endLine = () => this.walls()[this.walls().length - 1];

    this.hash = () => {
      let hash = 1;
      const walls = this.walls();
      for(let index = 0; index < walls.length; index++) {
        hash *= walls[index].hash();
      }
      const objects = this.activeObjects();
      for(let index = 0; index < objects.length; index++) {
        hash *= objects[index].hash();
      }
      return hash;
    }

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

    this.cornerIndex = (cornerOrIndex) => {
      if (cornerOrIndex instanceof Corner2d) {
        for (let index = 0; index < walls.length; index += 1) {
          if (walls[index].startVertex() === cornerOrIndex) return index;
        }
        return -1;
      } else {
        while(cornerOrIndex < 0) cornerOrIndex += walls.length;
        return cornerOrIndex % walls.length;
      }
    }

    function relitiveWall(wallOcorner, i) {
      let position
      if (wallOcorner instanceof Corner2d) {
        if (i === 0) return null;
        position = instance.cornerIndex(wallOcorner);
        if (i >= 0) i--;
      } else position = instance.wallIndex(wallOcorner);

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
      const objs = this.objects().filter(o => o.shouldSave());
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
        const snapLocs = obj.snap2d.top().snapLocations.paired();
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

    this.isFreeCorner = (corner) => corner === this.walls()[0].startVertex();
    this.straightenUp = () => this.walls()[0].startVertex().straightenUp();

    let ceilingHeight = new Property('ceilh', 'Heigth from the floor to the ceiling', {value: 96, notMetric: IMPERIAL_US});
    this.ceilingHeight = (height) => {
      if (height) {
        ceilingHeight.value(height, true);
      }
      return ceilingHeight.value();
    }

    let baseHeight = new Property('baseh', 'Default height for a base cabinet', {value: 34, notMetric: IMPERIAL_US});
    this.baseHeight = (height) => {
      if (height) {
        baseHeight.value(height, true);
      }
      return baseHeight.value();
    }

    let wallHeight = new Property('baseh', 'Default height for a base cabinet', {value: 34, notMetric: IMPERIAL_US});
    this.wallHeight = (height) => {
      if (height) {
        wallHeight.value(height, true);
      }
      return wallHeight.value();
    }

    let baseDepth = new Property('based', 'Default depth for a base cabinet', {value: 24, notMetric: IMPERIAL_US});
    this.baseDepth = (depth) => {
      if (depth) {
        baseDepth.value(depth, true);
      }
      return baseDepth.value();
    }

    let wallDepth = new Property('walld', 'Default depth for a wall cabinet', {value: 12, notMetric: IMPERIAL_US});
    this.wallDepth = (depth) => {
      if (depth) {
        wallDepth.value(depth, true);
      }
      return wallDepth.value();
    }

    let counterHeight = new Property('counterh', 'Distance from baseh to wallHeight', {value: 18, notMetric: IMPERIAL_US});
    this.counterHeight = (height) => {
      if (height) {
        counterHeight.value(height, true);
      }
      return counterHeight.value();
    }

    this.wallElevation = () => this.baseHeight() + this.counterHeight();

    this.push = (...points) => {
      points = points.map(p => new Corner2d(this, p));
      if (this.startLine() === undefined) {
        const walls = this.walls();
        if (points.length < 3) throw Error('Layout must be initialized with atleast three vertices');
        walls[0] = new Wall2D(points[0], points[1]);
      }
      for (let index = 1; index < points.length; index += 1) {
        const endLine = this.endLine();
        const startV = endLine.endVertex();
        const endV = points[(index + 1) % points.length];
        const currWall = new Wall2D(startV, endV);
        walls.push(currWall);
      }
    }

    this.addObject = (id, payload, name) => {
      const obj = Object3D.new(payload, this);
      obj.id(id);
      if (obj.center().equals(0,0,0)) {
        const center = Vertex2d.center.apply(null, this.vertices())
        obj.bridge.top().center(center);
        obj.bridge.top().fromFloor(0);
      }
      this.objects().push(obj);
      // history.newState();
      addEvent.trigger(undefined, payload);
      return obj;
    }

    this.removeObject = (obj) => {
      for (index = 0; index < this.objects().length; index += 1) {
        if (this.objects()[index] === obj) {
          const obj = this.objects().splice(index, 1);
          removeEvent.trigger(undefined, obj.payload());
          return obj;
        }
      }
      return null;
    }

    this.removeByPayload = (payload) => {
      for (index = 0; index < this.objects().length; index += 1) {
        if (this.objects()[index].payload() === payload) {
          const obj = this.objects().splice(index, 1);
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
      this.objects().forEach((obj) => idMap[obj.id()] = obj);
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
      vertex = new Corner2d(this, vertex);
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
    this.center = () => Vertex2d.center(...this.vertices());

    this.within = (vertex, doNotCall) => {
      return Polygon2d.isWithin(vertex, this.walls());
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

    function inRange(min1, max1, min2, max2) {
      const minWithin = (min1 <= min2 && max1 >= min2);
      const maxWithin = minWithin || (max1 <= max2 && max1 >= min2);
      const oneWithin = maxWithin || (max1 < max2 && min1 > min2);
      return oneWithin;
    }

    this.levels = () => {
      const objs = instance.objects().sortByAttr('height');

      const levelList = [];
      for (let index = 0; index < objs.length; index++) {
        const obj = objs[index];
        const bridge = obj.bridge.top();
        const heightLoc = {min: bridge.fromFloor(), max: bridge.fromFloor() + obj.height()};
        let found = false;
        for (let lIndex = 0; lIndex < levelList.length; lIndex++) {
          const levelObj = levelList[lIndex];
          const loc = levelObj.heightLoc;
          if (inRange(loc.min, loc.max, heightLoc.min, heightLoc.max)) {
            found = true;
            levelObj.objects.push(obj);
          }
        }
        if (!found) {
          levelList.push({heightLoc, objects: [obj]});
        }
      }
      const sorted = levelList.sortByAttr('heightLoc.min');
      return sorted.map(o => o.objects);
    }

    let savedIndex = 0;
    this.nextLevel = () => this.level(savedIndex);
    this.prevLevel = () => this.level(savedIndex - 2);
    this.level = (index) => {
      if (Number.isFinite(index)) savedIndex = index + 1;
      const levels = this.levels();
      const modIndex = Math.mod(savedIndex, levels.length + 2) - 1;
      console.log.subtle(500,savedIndex,modIndex);
      if (modIndex === -1) return [];
      if (modIndex === levels.length) return this.objects();
      return levels[modIndex];
    }
    this.activeObjects = () => this.level() || this.objects();

    // if (!initialized) this.push({x:0, y:0}, {x:ww, y:0}, {x:ww,y:ww}, {x:0,y:ww});
    if (!initialized) this.push({x:1, y:1}, {x:ww+1, y:0}, {x:ww + 1,y:ww + 1}, {x:1,y:ww});
    // if (!initialized) this.push({x:-250, y:-250}, {x:250, y:-250}, {x:250,y:250}, {x:-250,y:250});
    this.walls = () => walls;

    // history = new StateHistory(this.toJson, this.fromJson);
    this.history = () => history;

    this.toDrawString = () => {
      return Line2d.toDrawString(this.walls());
    }
  }
}

// Needs to be internal!!!!
Layout2D.fromJson = (json) => {
  const walls = [];
  const layout = new Layout2D(json.walls);
  layout.id(json.id);

  const objects = [];
  json.objects.forEach((o) => {
    const center = Vertex2d.fromJson(o.center);
    let obj = Object3D.get(o.id);
    if (obj === undefined) {
      obj = new Object3D(layout);
      obj.fromJson(o);
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
