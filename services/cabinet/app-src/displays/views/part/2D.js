const Canvas = require('../../canvas');
const TwoDLayout = require('../../../displays/two-d-layout');

function  render() {
  if (TwoDLayout.panZoom) TwoDLayout.panZoom.once();
  return '<div id="model-controller">part-2d</div>'
}
exports.module = new Canvas.View2D('part-2d', render);
Canvas.register(exports.module)
