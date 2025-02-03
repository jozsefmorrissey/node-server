
const Vertex2d = require('./vertex');
const Line2d = require('./line');

// equation: (x^2 / rx^2) + (y^2 / ry^2) = 1
class Ellipse2d {
  constructor(rx, ry, center, from, to, rotation) {
    if (center === undefined) center = ry;
    from ||= 0;
    to ||= 360;
    center = new Vertex2d(center);
    rotation ||= 0;
    ry ||= rx;
    this.center = () => center;
    this.rx = () => rx;
    this.ry = () => ry;
    this.radius = () => ({x: rx, y: ry});
    this.rotation = () => rotation;
    this.rotation.radians = () => (rotation*Math.PI/180);
    this.from = () => from;
    this.from.radians = () => (from*Math.PI/180);
    this.radius.max = () => Math.max(rx, ry);
    this.to = () => to;
    this.to.radians = () => (to*Math.PI/180);

    this.axisPoints = () => {
      const points = [[rx,0],[-rx,0],[0,ry],[0,-ry]];
      return points.map(p => new Vertex2d(p).translate(center.x, center.y)
                        .rotate(Math.toRadians(rotation), center));
    }

    this.clone = () => new Ellipse(rx, ry, center.clone(), from, to,  rotation);

    this.scale = (scale, doNotModify) => {
      if (doNotModify) return this.clone().scale(scale);
      rx = rx * scale;
      ry = ry * scale;
      center.scale(scale);
      return this;
    }

    this.within = (vertex) => {
      const cx = this.center().x; const cy = this.center().y;
      const x = vertex.x; const y = vertex.y;
      const rot = rotation;
      const rotatedX = (x - cx) * Math.cos(rot) + (y - cy) * Math.sin(rot);
      const rotatedY = -(x - cx) * Math.sin(rot) + (y - cy) * Math.cos(rot);
      return ((rotatedX * rotatedX) / (rx * rx) + (rotatedY * rotatedY) / (ry * ry) <= 1);
    }

    this.intersection = {}
    this.intersection.line = (line) => Ellipse2d.lineIntersections(this, line);

    this.connect = (obj) => {
      if (obj instanceof Line2d) return this.connect.line(obj);
      return this.connect.vertex(obj);
    };
    this.connect.vertex = (vertex) => {

    }



    const closest = (point, min, theta, line, offset) => {
      if (offset) point = point.translate(line.vector.unit(offset), true);
      const perp = Line2d.startAndTheta(point, theta, 100);
      const intersections = this.intersection.line(perp);
      if (intersections.length) {
        const curr = intersections.map(vertex => ({vertex, dist: point.distance(vertex), point}))
                        .min(distObj => distObj.dist);
        if (!min || min.dist > curr.dist) min = curr;
      }
      return min;
    }
    this.connect.line = (line, segment, tol) => {
      tol ||= .0001;
      let centerConn = line.connect(this.center());
      let theta = centerConn.radians();
      let offset = this.radius.max();
      let point = centerConn[1];
      let min = closest(point, null, theta);
      let minLeft;
      let minRight;
      while (offset > tol) {
        minLeft = closest(point, min, theta, line, offset);
        minRight = closest(point, min, theta, line, -offset);
        if (minLeft) min = [minLeft,minRight].min(m => m.dist);
        offset /= 2;
      }
      return new Line2d(min.vertex, min.point);
    }

    this.distance = (obj) => {
      if (obj instanceof Line2d) return this.distance.line(obj);
      return this.distance.vertex(obj);
    };
    this.distance.line = (line, segment) => line.connect(line, segment).length();

    this.toString = () => {
      const vertStr = `[${this.rx()},${this.ry()}]`;
      const centerStr = Vertex2d.origin.equals(this.center()) ?  '' : this.center();
      const fromToStr = this.from() === 0 && this.to() === 360 ? '' :  `${this.from()}=>${this.to()}`;
      const rotStr = this.rotation() ? `@${this.rotation()}` : '';
      return `${vertStr}r${centerStr}${fromToStr}${rotStr}`;
    }
    this.hash = () => this.toString(.00000000000001).hash();
  }
}

const mrmls = Measurement.regex.matchless().source;
const vrmls = Vertex2d.regex.matchless().source;
const nrs = Number.regex.source;
// Formats:
//        [[radiusX], [radiusY]]r([centerX],[centerY])[fromDegree]=>[toDegree]@[degreesOfRotation]
//        [radius]r([centerX],[centerY])[fromDegree]=>[toDegree]@[degreesOfRotation]
Ellipse2d.regex = new RegExp(`(?:\\[\\s*(${mrmls}),\\s*(${mrmls})\\s*\\]|(\\[${mrmls}\\]))r(${vrmls}|)(?:(${nrs})=>(${nrs})|)(?:@(${nrs})|)`);
Ellipse2d.fromString = (string, unit) => {
  const match = string.match(Ellipse2d.regex);
  if (!match) return null;
  unit = unit ? (unit === true ? Measurement.unit.BASE : unit) : Measurement.unit();
  return new Ellipse2d(Measurement.decimal(match[1] || match[3], unit),
                      Measurement.decimal(match[2] || match[3], unit),
                      match[4] ? Vertex2d.fromString(match[4], unit) : null,
                      Number.parseFloat(match[5]),
                      Number.parseFloat(match[6]),
                      Number.parseFloat(match[7]));
}

Ellipse2d.lineIntersections = (ellipse, line) => {
  const cent = ellipse.center();
  let h = cent.x; let k = cent.y;
  let rx = ellipse.rx(); let ry = ellipse.ry();
  line = line.translate(new Line2d([[h,k], new Vertex2d(0,0)]), true);
  const rads = ellipse.rotation.radians();
  line = line.rotate(-rads, new Vertex2d(), true);
  let x1 = line[0].x; let y1 = line[0].y;
  let x2 = line[1].x; let y2 = line[1].y;

  // Calculate the quadratic coefficients
  const A = (x2 - x1) ** 2 / rx ** 2 + (y2 - y1) ** 2 / ry ** 2;
  const B = 2 * (x1 * (x2 - x1) / rx ** 2 + y1 * (y2 - y1) / ry ** 2);
  const C = x1 ** 2 / rx ** 2 + y1 ** 2 / ry ** 2 - 1;
  const discriminant = B ** 2 - 4 * A * C;

  if (discriminant < 0) {
    return [];
  } else if (discriminant === 0) {
    const t = -B / (2 * A);
    return [new Vertex2d({ x: x1 + t * (x2 - x1) + h, y: y1 + t * (y2 - y1) + k }).rotate(rads,cent)];
  } else {
    const t1 = (-B + Math.sqrt(discriminant)) / (2 * A);
    const t2 = (-B - Math.sqrt(discriminant)) / (2 * A);
    return [
      new Vertex2d({ x: x1 + t1 * (x2 - x1) + h, y: y1 + t1 * (y2 - y1) + k }).rotate(rads,cent),
      new Vertex2d({ x: x1 + t2 * (x2 - x1) + h, y: y1 + t2 * (y2 - y1) + k }).rotate(rads,cent)
    ];
  }
}

module.exports = Ellipse2d;
