const Canvas = require('../../canvas');
const ColorManager = require('../../managers/color-manager');
const ThreeView = require('../../three-view');
const du = require('../../../../../../public/js/utils/dom-utils.js');

const threeView = new ThreeView(du.id('disp-canvas-p2d'));

function  render() {
  return 'Object:2D';
}
exports.module = new Canvas.View2D('object-2d', render);
Canvas.register(exports.module)
