const Canvas = require('../../canvas');
const ColorManager = require('../../managers/color-manager');
const ThreeView = require('../../three-view');
const du = require('../../../../../../public/js/utils/dom-utils.js');
const $t = require('../../../../../../public/js/utils/$t');
const OpeningSketch = require('../../opening-sketch.js');
const Jobs = require('../../../../web-worker/external/jobs.js');

const template = new $t('views/object/layout');

let sketch;
function  render() {
  sketch ||= new OpeningSketch('#object-layout canvas');
  sketch.cabinet(Global.cabinet());
  const settings = sketch.settings();
  return template.render({settings});
}

du.on.match('change', '.object-layout-settings-cnt input', (elem) => {
  sketch.settings()[elem.name](elem.checked);
  sketch.once && sketch.once();
});

exports.module = new Canvas.View2D('object-layout', render);
Canvas.register(exports.module)
