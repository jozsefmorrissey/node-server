const Test = require('../../../../../public/js/utils/test/test').Test;
const Cabinet = require('../../../app-src/objects/assembly/assemblies/cabinet.js');
const Room = require('../../../app-src/objects/room');
const CabinetLayouts = require('../../../app-src/config/cabinet-layouts.js');
const Polygon3D = require('../../../app-src/three-d/objects/polygon.js');
const Vector3D = require('../../../app-src/three-d/objects/vector.js');
const Vertex3D = require('../../../app-src/three-d/objects/vertex.js');
const Panel = require('../../../app-src/objects/assembly/assemblies/panel.js');
const Frame = require('../../../app-src/objects/assembly/assemblies/frame.js');
const Jobs = require('../../../web-worker/external/jobs');
const ModelInfo = require('../../../web-worker/external/model-information.js');
const SimpleModel = require('../../../app-src/objects/simple/simple.js');
const DTO = require('../../../web-worker/external/data-transfer-object.js');
const RTO = require('../../../web-worker/services/modeling/reconnect-transfer-object');

const onFail = (ts) => (error) => {
  ts.fail(error);
}

function get(layout, type, cabinetOnly) {
  const cabinet = Cabinet.build(type || 'base');
  if (layout !== true || (typeof layout) === 'string')
    CabinetLayouts.map[layout || 'test'].build(cabinet);
  cabinet.updateOpenings(true);
  return cabinetOnly ? cabinet : cabinet.allAssemblies();
}

const onRoomComplete = (ts) => (csg, roomJob) => {
  ts.assertTrue(csg && csg.polygons && csg.polygons.length > 0);
  const modelInfo = roomJob.task().tasks()[0].tasks()[0].modelInfo();
  const cabinets = [];
  roomJob.room().groups.forEach(g => cabinets.concatInPlace(g.objects));
  for (let index = 0; index < cabinets.length; index++) {
    const cab = cabinets[index];
    let modelInfo = ModelInfo.related(cab);
    let model = ModelInfo.related(cab).model[cab.id()];
    ts.assertTrue(model && model.polygons && model.polygons.length > 0);
  }
  ts.success();
}

function initializeRoom(cabinetCount) {
  const i = Vector3D.i;
  const k = Vector3D.k;
  const ik = i.add(k).unit();
  const ink = k.minus(i).unit();
  const cardinalVectors = [
    i,ik,k,ink,i.inverse(),ik.inverse(),k.inverse(),ink.inverse()
  ];

  const room = new Room();
  room.addGroup();
  room.groups[0].objects.push(get("3dsb3d", 'diagonal-corner-base', true));
  for (let index = 0; index < cabinetCount; index++) {
    const cabinet = get(null, null, true);
    const newCenter = new Vertex3D();
    const scaleBy = cabinet.width()*1.5*(Math.floor((index)/8)+1);
    const vector = cardinalVectors[index % cardinalVectors.length];
    newCenter.translate(vector.scale(scaleBy));
    const rowRotOffset = index > 8 ? 22.5 : 0;
    cabinet.position().setRotation('y', 360 - (45 * index));
    cabinet.position().setCenter(newCenter);
    room.groups[0].objects.push(cabinet);
  }
  return room;
}

Test.add('Jobs.CSG.Room.Simple', async (ts, room) => {
  new Jobs.CSG.Room.Simple(room).then(onRoomComplete(ts), onFail(ts)).queue();
}, async () => initializeRoom(8));
