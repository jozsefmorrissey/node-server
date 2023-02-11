
const OnWall = require('./on-wall');
const HoverMap2d = require('../../../../../public/js/utils/canvas/two-d/hover-map.js');

class Window2D extends OnWall {
  constructor(wall, fromPreviousWall, fromFloor, height, width) {
    width = width || 81.28;
    height = height || 91.44;
    fromFloor = fromFloor || 101.6;
    fromPreviousWall = fromPreviousWall || 20;
    super(wall, fromPreviousWall, fromFloor, height, width);
    const instance = this;
    this.remove = () => this.wall().removeWindow(this);
    this.toString = () => `${this.id()}:${this.endpoints2D().toString()}`;

    this.hovering = new HoverMap2d(this.toLine, 5).hovering;
  }
}

new Window2D();
module.exports = Window2D;
