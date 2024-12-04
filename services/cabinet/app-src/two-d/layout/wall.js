
const Lookup = require('../../../../../public/js/utils/object/lookup.js');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');
const OnWall = require('./on-wall');
const Door2D = require('./door');
const Window2D = require('./window');
const Corner2d = require('./corner');
const Polygon3D = require('../../three-d/objects/polygon.js');

function modifyVertex(vertex) {
  return (props) => {
      console.log('DummyFuncNotIntendedToBeCalled');
  }
}

class Wall2D extends Line2d {
  constructor(startVertex, endVertex, height, windows, doors) {
    super(startVertex, endVertex);
    this[0].modificationFunction(modifyVertex(this[0]));
    this[1].modificationFunction(modifyVertex(this[1]));
    Lookup.convert(this);
    windows = windows || [];
    windows.forEach((win) => win.setWall(this));
    doors = doors || [];
    doors.forEach((door) => door.setWall(this));
    const wall = this;
    let _color = "#e1ddc1";

    height = height || 243.84;
    // this.copy = () => new Wall2D(this.length(), this.radians());
    this.windows = () => windows;
    this.height = () => height;
    this.color = (color) => color !== undefined ? (_color = color) : _color;
    this.addWindow = (fromPreviousWall) => windows.push(new Window2D({wall: this, fromPreviousWall}));
    this.doors = () => doors;
    this.addDoor = (fromPreviousWall) => doors.push(new Door2D({wall: this, fromPreviousWall}));
    this.vertices = () => {
      const verts = [this[0]];
      const doorsAndWindows = doors.concat(windows);
      doorsAndWindows.sort(OnWall.sort);
      doorsAndWindows.forEach((onWall) => {
        const endpoints = onWall.endpoints2D();
        verts.push(endpoints.start);
        verts.push(endpoints.end);
      });
      verts.push(this[1]);
      return verts;
    }

    this.poly = () => Polygon3D.from2DLine(this, 0, this.height());

    this.poly.csg = () => {
      let wallCSG = this.poly().csg();
      const curbCSG = CSG.Polygon.Enclosed(Polygon3D.from2DLine(this, 0, 6*2.54).vertices());
      wallCSG.polygons.concatInPlace(curbCSG.polygons)
      wallCSG.setColor(this.color(), true);
      this.doors().forEach(d => wallCSG = wallCSG.subtract(d.csg()));
      return wallCSG;
    }

    this.remove = () => {
        const prevWall = this[0].prevLine();
        const nextLine = this[1].nextLine();
        const startVertex = this[0];
        nextLine[0] = startVertex;
        startVertex.nextLine(nextLine);
    }

    this.removeDoor = (door) => doors.splice(doors.indexOf(door), 1);
    this.removeWindow = (window) => windows.splice(windows.indexOf(window), 1);
    this.hash = () => JSON.stringify(Wall2D.toJson(this)).hash();
    this.clone = () => {
      const sv = this[0].clone();
      const ev = this[1].clone();
      const height = this.height();
      const windows = this.windows().map(w => w.clone());
      const doors = this.doors().map(d => d.clone());
      return new Wall2D(sv, ev, height, windows, doors);
    }
  }
}

Object.class.register(Wall2D, 'label', 'widows', 'doors', 'height', '0', '1');

Wall2D.fromJson = (json, layout, vertexMap) => {
  vertexMap ||= {};
  json[0].layout = layout;
  const newSv = Corner2d.fromJson(json[0]);
  const svStr = newSv.toString();
  json[1].layout = layout;
  const newEv = Corner2d.fromJson(json[1]);
  const evStr = newEv.toString();
  if (vertexMap[svStr] === undefined) vertexMap[svStr] = newSv;
  if (vertexMap[evStr] === undefined) vertexMap[evStr] = newEv;
  const sv = vertexMap[svStr];
  const ev = vertexMap[evStr];
  const windows = Object.fromJson(json.windows);
  const doors = Object.fromJson(json.doors);
  const inst = new Wall2D(sv, ev, json.height, windows, doors);
  return inst;
}

new Wall2D();
module.exports = Wall2D;
