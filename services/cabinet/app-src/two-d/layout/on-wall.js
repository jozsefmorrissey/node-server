
const Lookup = require('../../../../../public/js/utils/object/lookup.js');
const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');

class OnWall extends Lookup {
  constructor(json) {
    super();
    json ||= {};
    let wall = json.wall;
    Object.getSet(this, {
        width: json.width,
        height: json.height,
        fromFloor: json.fromFloor,
        fromPreviousWall: json.fromPreviousWall
      }, 'wallId', 'id');
    let start = new Vertex2d();
    let end = new Vertex2d();
    this.wallId = () => wall.id();
    this.endpoints2D = () => {
      const wallStartPoint = wall[0];
      const dist = this.fromPreviousWall();
      const total = dist + this.width();
      const theta = wall.radians();
      const startPoint = {};
      startPoint.x = wallStartPoint.x + dist * Math.cos(theta);
      startPoint.y = wallStartPoint.y + dist * Math.sin(theta);
      start.point(startPoint);

      const endPoint = {};
      endPoint.x = (wallStartPoint.x + total * Math.cos(theta));
      endPoint.y = (wallStartPoint.y + total * Math.sin(theta));
      end.point(endPoint);

      return { start, end, toString: () => `${start.toString()} => ${end.toString()}`};
    }
    let fromPreviousWall = this.fromPreviousWall();
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

    function startVertex() {
      const startpoint = wall[0].point();
      const theta = wall.radians();
      const distLeft = this.fromPreviousWall() + this.width();
      return new Vertex2d({x: startpoint.x + distLeft * Math.cos(theta),
                    y: startpoint.y + distLeft * Math.sin(theta)});
    }
    function endVertex() {
      const startpoint = wall[0].point();
      const theta = wall.radians();
      const distRight = this.fromPreviousWall();
      return new Vertex2d({x: startpoint.x + distRight * Math.cos(theta),
                            y: startpoint.y + distRight * Math.sin(theta)});
    }

    Object.defineProperty(this, '0', {
      get: startVertex,
    });
    Object.defineProperty(this, '1', {
      get: endVertex,
    });

    this.toLine = () => new Line2d(start, end);
    this.prevLine = () => new Line2d(wall[0], start);
    this.nextLine = () => new Line2d(end, wall[1]);
    this.wall = () => wall;
    this.setWall = (w) => wall = w;
    this.move = (center) => {
      const point = wall.closestPointOnLine(center);
      const onLine = wall.closestPointOnLine(point, true);
      let distanceStart = wall[0].distance(point);
      if (!onLine) {
        let distanceEnd = wall[1].distance(point);
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
  const instance = new cxtr(json);
  return instance;
}


module.exports = OnWall;
