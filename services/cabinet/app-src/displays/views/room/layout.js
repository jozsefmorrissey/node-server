const Canvas = require('../../canvas');
const TwoDLayout = require('../../../displays/two-d-layout');

function  render() {
  if (TwoDLayout.panZoom) TwoDLayout.panZoom.once();
}
exports.module = new Canvas.View2D('room-layout', render);
Canvas.register(exports.module)
