
const Vertex2d = require('vertex');
const approximate = require('../../../../../public/js/utils/approximate.js');

class Square2d {
  constructor(center, height, width, radians) {
    center = new Vertex2d(center);
    width = width === undefined ? 121.92 : width;
    height = height === undefined ? 60.96 : height;
    radians = radians === undefined ? 0 : radians;
    const instance = this;
    Object.getSet(this, {center, height, width, radians});
    const startPoint = new Vertex2d(null);

    const getterHeight = this.height;
    this.height = (v) => {
      notify(getterHeight(), v);
      return getterHeight(v);
    }
    const getterWidth = this.width;
    this.width = (v) => notify(getterWidth(), v) || getterWidth(v);

    const changeFuncs = [];
    this.onChange = (func) => {
      if ((typeof func) === 'function') {
        changeFuncs.push(func);
      }
    }

    let lastNotificationId = 0;
    function notify(currentValue, newValue) {
      if (changeFuncs.length === 0 || (typeof newValue) !== 'number') return;
      if (newValue !== currentValue) {
        const id = ++lastNotificationId;
        setTimeout(() => {
          if (id === lastNotificationId)
            for (let i = 0; i < changeFuncs.length; i++) changeFuncs[i](instance);
        }, 100);
      }
    }

    this.radians = (newValue) => {
      if (newValue !== undefined && !Number.isNaN(Number.parseFloat(newValue))) {
        notify(radians, newValue);
        radians = approximate(newValue);
      }
      return radians;
    };
    this.startPoint = () => {
      startPoint.point({x: center.x() - width / 2, y: center.y() - height / 2});
      return startPoint;
    }
    this.angle = (value) => {
      if (value !== undefined) this.radians(toRadians(value));
      return Math.toDegrees(this.radians());
    }

    this.x = (val) => notify(this.center().x(), val) || this.center().x(val);
    this.y = (val) => notify(this.center().y(), val) || this.center().y(val);
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
      this.x(center.x);
      this.y(center.y);
      this.center().point(center);
      return true;
    };

    function centerMethod(widthMultiplier, heightMultiplier, position) {
      const center = instance.center();
      const rads = instance.radians();
      const offsetX = instance.width() * widthMultiplier * Math.cos(rads) -
                        instance.height() * heightMultiplier * Math.sin(rads);
      const offsetY = instance.height() * heightMultiplier * Math.cos(rads) +
                        instance.width() * widthMultiplier * Math.sin(rads);

      if (position !== undefined) {
        const posCenter = new Vertex2d(position.center);
        return new Vertex2d({x: posCenter.x() + offsetX, y: posCenter.y() + offsetY});
      }
      const backLeftLocation = {x: center.x() - offsetX , y: center.y() - offsetY};
      return new Vertex2d(backLeftLocation);
    }


    this.frontCenter = (position) => centerMethod(0, -.5, position);
    this.backCenter = (position) => centerMethod(0, .5, position);
    this.leftCenter = (position) => centerMethod(.5, 0, position);
    this.rightCenter = (position) => centerMethod(-.5, 0, position);

    this.backLeft = (position) => centerMethod(.5, .5, position);
    this.backRight = (position) => centerMethod(-.5, .5, position);
    this.frontLeft = (position) =>  centerMethod(.5, -.5, position);
    this.frontRight = (position) => centerMethod(-.5, -.5, position);

    this.offsetX = (negitive) => negitive ? this.width() / -2 : this.width() / 2;
    this.offsetY = (negitive) => negitive ? this.height() / -2 : this.height() / 2;

    this.toString = () => `[${this.frontLeft()} - ${this.frontRight()}]\n[${this.backLeft()} - ${this.backRight()}]`
  }
}

new Square2d();

module.exports = Square2d;
