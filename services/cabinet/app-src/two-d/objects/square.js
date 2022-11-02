
const Vertex2d = require('vertex');

class Square2d {
  constructor(center, height, width, radians) {
    width = width === undefined ? 121.92 : width;
    height = height === undefined ? 60.96 : height;
    radians = radians === undefined ? 0 : radians;
    const uniqueId = String.random();
    const instance = this;
    Object.getSet(this, {center: new Vertex2d(center), height, width, radians});
    if ((typeof center) === 'function') this.center = center;
    const startPoint = new Vertex2d(null);


    this.radians = (newValue) => {
      if (newValue !== undefined && !Number.isNaN(Number.parseFloat(newValue))) {
        radians = newValue;
      }
      return radians;
    };
    this.startPoint = () => {
      startPoint.point({x: this.center().x() - width / 2, y: this.center().y() - height / 2});
      return startPoint;
    }
    this.angle = (value) => {
      if (value !== undefined) this.radians(Math.toRadians(value));
      return Math.toDegrees(this.radians());
    }

    this.x = (val) => {
      if (val !== undefined) this.center().x(val);
      return this.center().x();
    }
    this.y = (val) => {
      if (val !== undefined) this.center().y(val);
      return this.center().y();
    }
    this.minDem = () => this.width() > this.height() ? this.width() : this.height();
    this.maxDem = () => this.width() > this.height() ? this.width() : this.height();

    this.shorterSideLength = () => this.height() < this.width() ? this.height() : this.width();
    this.move = (position, theta) => {
      const center = position.center instanceof Vertex2d ? position.center.point() : position.center;
      if (position.maxX !== undefined) center.x = position.maxX - this.offsetX();
      if (position.maxY !== undefined) center.y = position.maxY - this.offsetY();
      if (position.minX !== undefined) center.x = position.minX + this.offsetX();
      if (position.minY !== undefined) center.y = position.minY + this.offsetY();
      this.radians(position.theta);
      this.center().point(center);
      return true;
    };

    this.offsetX = (negitive) => negitive ? this.width() / -2 : this.width() / 2;
    this.offsetY = (negitive) => negitive ? this.height() / -2 : this.height() / 2;

    this.toString = () => `Square2d(${uniqueId}): ${this.width()} X ${this.height()}] @ ${this.center()}`
  }
}

new Square2d();

module.exports = Square2d;
