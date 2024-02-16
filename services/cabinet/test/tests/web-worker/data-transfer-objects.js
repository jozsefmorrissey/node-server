
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

function get(layout, type, cabinetOnly) {
  const cabinet = Cabinet.build(type || 'base');
  if (layout !== true || (typeof layout) === 'string')
    CabinetLayouts.map[layout || 'test'].build(cabinet);
  cabinet.updateOpenings(true);
  return cabinetOnly ? cabinet : cabinet.allAssemblies();
}

Test.add('DTO & RTO', (ts) => {
  const all = get();
  const dtos = DTO(all);
  const reconnected = RTO(dtos);

  ts.assertEquals(reconnected.length + dtos.length, all.length *2, 'Incorrect Number of objects returned by conversion');

  const firstA = all[0];
  const firstR = reconnected[0];
  const center = firstR.position.current.center.object();
  const normals = firstR.position.current.normals;
  ts.assertTrue(center.equals(firstA.position().center()), 'Vertex3D conversion contains Error/s');
  ts.assertTrue(normals instanceof Object, 'plane js Object conversion contains Error/s');
  const xVectEq = firstA.position().normals().x.equals(normals.x);
  const yVectEq = firstA.position().normals().y.equals(normals.y);
  const zVectEq = firstA.position().normals().z.equals(normals.z);
  ts.assertTrue(xVectEq && yVectEq && zVectEq, 'Vector3D conversion contains Error/s');

  const lastA = all[all.length - 1];
  const lastR = reconnected[all.length - 1];
  const innerPoly = lastR.coordinates.inner.object();
  const outerPoly = lastR.coordinates.outer.object();

  ts.assertTrue(innerPoly.equals(lastA.sectionProperties().innerPoly()))
  ts.assertTrue(outerPoly.equals(lastA.sectionProperties().outerPoly()))

  const sectPropsIndex = all.findIndex(sp => sp.constructor.name === 'SectionProperties');
  const sectionProps = all[sectPropsIndex];
  const reconnectedSP = reconnected[sectPropsIndex];

  ts.assertTrue(sectionProps.top().id().equals(reconnectedSP.top().id), 'Id extraction, maping, or reconnection contains Error/s');
  ts.assertTrue(sectionProps.bottom().id().equals(reconnectedSP.bottom().id), 'Id extraction, maping, or reconnection contains Error/s');
  ts.assertTrue(sectionProps.left().id().equals(reconnectedSP.left().id), 'Id extraction, maping, or reconnection contains Error/s');
  ts.assertTrue(sectionProps.right().id().equals(reconnectedSP.right().id), 'Id extraction, maping, or reconnection contains Error/s');

  ts.success();
});
