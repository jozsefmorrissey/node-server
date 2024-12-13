const Canvas = require('../canvas');
const ColorManager = require('../managers/color-manager');
const ThreeView = require('../three-view');
const du = require('../../../../../public/js/utils/dom-utils.js');

const threeView = new ThreeView(du.id('disp-canvas-p2d'));

function  render() {
  threeView.update();
}
exports.module = new Canvas.View2D('Parts2D', render, 'disp-canvas-p2d');
Canvas.register(exports.module)
