
const Test = require('../../../../../public/js/utils/test/test').Test;
const Cabinet = require('../../../app-src/objects/assembly/assemblies/cabinet.js');
const Room = require('../../../app-src/objects/room');
const CabinetLayouts = require('../../../app-src/config/cabinet-layouts.js');
const Jobs = require('../../../web-worker/external/jobs');

const Vertex2d = require('../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Line2d = require('../../../../../public/js/utils/canvas/two-d/objects/line.js');

const {Vector3D, Vertex3D, Line3D, Polygon3D, Plane, BiPolygon} =
      require('../../../../../public/js/utils/canvas/three-d/lib');

const DTO = require('../../../web-worker/external/data-transfer-object.js');
const RTO = require('../../../web-worker/shared/reconnect-transfer-object');

function get(layout, type, cabinetOnly) {
  const cabinet = Cabinet.build(type || 'base');
  if (layout !== true || (typeof layout) === 'string')
    CabinetLayouts.map[layout || 'test'].build(cabinet);
  cabinet.updateOpenings(true);
  return cabinetOnly ? cabinet : cabinet.allAssemblies();
}

Test.add('DTO & RTO: math objects', (ts) => {
  const objs = [new Vertex2d([1,1]),
                new Line2d([0,0], [1,1]),
                new Vector3D([1,1,1]),
                new Vertex3D([1,1,1]),
                new Line3D([0,0,0], [1,1,1]),
                new Polygon3D([[0,0,0], [0,1,0], [1,1,0], [1,0,0]]),
                new Plane([0,0,0], [0,1,0], [1,1,0], [1,0,0]),
                new BiPolygon(new Polygon3D([[0,0,0], [0,1,0], [1,1,0], [1,0,0]]),
                                        new Polygon3D([[0,0,2], [0,1,2], [1,1,2], [1,0,2]]))];
  objs.forEach(obj => {
    const dto = DTO(obj);
    const rto = RTO(dto);
    ts.assertEquals(obj.constructor, rto.constructor);
    ts.assertTrue(rto.equals(obj));
  });
  ts.success();
});

Test.add('DTO & RTO', (ts) => {
  const all = get();
  const dtos = DTO(all);
  Object.fromJson(dtos[141]);
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
