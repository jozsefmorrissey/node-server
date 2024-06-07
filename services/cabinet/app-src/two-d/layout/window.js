
const OnWall = require('./on-wall');

class Window2D extends OnWall {
  constructor(json) {
    json ||= {};
    json.width ||= 81.28;
    json.height ||= 91.44;
    json.fromPreviousWall ||= 20;
    json.fromFloor ||= 101.6;
    super(json);
    const instance = this;
    this.remove = () => this.wall().removeWindow(this);
    this.toString = () => `${this.id()}:${this.endpoints2D().toString()}`;
  }
}

new Window2D();
module.exports = Window2D;
