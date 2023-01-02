
const Lookup = require('../../../../../public/js/utils/object/lookup.js');
const Vertex2d = require('../objects/vertex.js');

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


module.exports = OnWall;
