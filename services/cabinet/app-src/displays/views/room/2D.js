const Canvas = require('../../canvas');

function  render() {
  return 'Room-2D';
}
exports.module = new Canvas.View2D('room-2d', render);
Canvas.register(exports.module)
