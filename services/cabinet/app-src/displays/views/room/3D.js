const Canvas = require('../../canvas');
const Jobs = require('../../../../web-worker/external/jobs.js');
const ColorManager = require('../../managers/color-manager');
const $t = require('../../../../../../public/js/utils/$t.js');

const template = new $t('room/3D');
const roomColorManager = new ColorManager('room-color-cnt', 'name');

function render(managementCall) {
  const ctid = String.random();
  const ct = CompTime('Room 3D Render', ctid);
  new Jobs.CSG.Room.Simple(Global.room()).then((result, job) => {
    if (Canvas.view().id() !== 'room-3d') return;
    const room = Global.room();
    const layout = room.layout();
    layout.modelInformation(result);
    let csg = layout.csg();
    csg.add(ColorManager.positionAndColor(layout.modelInformation().modelIdMap));
    Canvas.render3Dmodel(csg, room);
    const layoutObjects = layout.walls().concat(layout.ceiling(),layout.floor(),layout.counterTop());
    const objects = room.groups.map(g => g.objects).concatElements();
    if (!managementCall) {
      const handles = objects.map(o => o.getAssemblies ? o.getAssemblies(/^h[0-9]*$/) : []).concatElements();
      roomColorManager.map(objects.concat(layoutObjects).concat(handles));
      roomColorManager.update();
    }
    ct.end(ctid);
  }).queue();
  return template.render({room: Global.room()});
}

roomColorManager.on.change(() => render.lastCall(300, true));
exports.module = new Canvas.View3D('room-3d', render);
Canvas.register(exports.module)
