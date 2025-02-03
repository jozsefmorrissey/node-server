const Canvas = require('../../canvas');
const Jobs = require('../../../../web-worker/external/jobs.js');
const ColorManager = require('../../managers/color-manager');
const $t = require('../../../../../../public/js/utils/$t.js');

const template = new $t('room/3D');
const roomColorManager = new ColorManager('room-color-cnt', 'name');

function render(managementCall) {
  new Jobs.CSG.Room.Simple(Global.room()).then((result, job) => {
    const room = Global.room();
    const layout = room.layout();
    layout.modelInformation(result);
    let csg = layout.csg();
    Canvas.render3Dmodel(csg, room);
    const layoutObjects = layout.walls().concat(layout.ceiling(),layout.floor(),layout.counterTop());
    const objects = room.groups.map(g => g.objects).concatElements();
    if (!managementCall) {
      roomColorManager.map(objects.concat(layoutObjects));
      roomColorManager.update();
    }
  }).queue();
  return template.render({room: Global.room()});
}

roomColorManager.on.change(() => render.lastCall(300, true));
exports.module = new Canvas.View3D('room-3d', render);
Canvas.register(exports.module)
