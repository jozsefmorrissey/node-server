const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const OnWall = require('./on-wall');
const Door2D = require('./door');
const Window2D = require('./window');
const HoverMap2d = require('../../../../../public/js/utils/canvas/two-d/hover-map')

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
    this.vertices = () => {
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

    const hoveringStart = new HoverMap2d(() => this.startVertex(), 24).hovering;
    const hoveringEnd = new HoverMap2d(() => this.endVertex(), 24).hovering;
    const hoveringWall = new HoverMap2d(() => this, 10).hovering;
    this.hovering = (v) => {
      if (hoveringStart(v)) return this.startVertex();
      if (hoveringEnd(v)) return this.endVertex();
      for (let index = 0; index < windows.length; index++) {
        if (windows[index].hovering(v)) return windows[index];
      }
      for (let index = 0; index < doors.length; index++) {
        if (doors[index].hovering(v)) return doors[index];
      }
      return hoveringWall(v) && this;
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

new Wall2D();
module.exports = Wall2D;
