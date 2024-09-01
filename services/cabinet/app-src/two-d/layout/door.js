
const OnWall = require('on-wall');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');

class Door2D extends OnWall {
  constructor(json) {
    json ||= {};
    json.width ||= 91.44;
    json.height ||= 198.12;
    json.fromPreviousWall ||= 150;
    json.fromFloor ||= 0;
    super(json);
    let hinge = 0;
    const parentWidth = this.width;
    Object.getSet(this, 'hinge');
    this.toString = () => `${this.id()}:${this.endpoints2D().toString()}:${hinge}`;
    this.remove = () => this.wall().removeDoor(this);
    this.hinge = (val) => val === undefined ? hinge :
      hinge = ((typeof val) === 'number' ? val : hinge + 1) % 7;
    this.line = () => new Line2d(this[0], this[1]);
  }
}

Door2D.fromJson = (json) => {
  const inst = OnWall.fromJson(json);
  inst.hinge(json.hinge);
  return inst;
}

new Door2D();
module.exports = Door2D;
