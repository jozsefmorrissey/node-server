
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

const onSimpleComplete = (models, ts) => (csgs) => {
  for (let index = 0; index < models; index++) {
    ts.assertTrue(csgs[index] && csgs[index].polygons && csgs[index].polygons.length > 0);
  }
  ts.success();
}

Test.add('Jobs.CSG.Simple', async (ts) => {
  const models = SimpleModel.list().map(n => SimpleModel.get(n));
  new Jobs.CSG.Simple.Model(models)
        .then(onSimpleComplete(models, ts)).queue();
});

const on2DComplete = (objects, ts) => (result) => {
  const modelInfo = result.constructor.name === 'ModelInformation' ? result : null;
  for (let index = 0; index < objects.length; index++) {
    const obj = objects[index];
    if (!modelInfo) {
      ts.assertTrue(result[obj.id()] !== undefined);
    } else {
      ts.assertTrue(modelInfo.threeView(obj.id()) !== undefined);
    }
  }
  ts.success();
}

Test.add('Jobs.Simple.To2D', async (ts) => {
    const models = SimpleModel.list().map(n => SimpleModel.get(n));
    new Jobs.CSG.Simple.To2D(models).then(on2DComplete(models, ts)).queue();
});

Test.add('Jobs.To2D', async (ts) => {
    const objects = SimpleModel.list().map(n => SimpleModel.get(n));
    const allAssemblies = get(true, 'diagonal-corner-base');
    const cabinet = allAssemblies.filter(a => a.partCode() === 'c')[0];
    objects.push(cabinet);
    const gap = 25;

    new Jobs.CSG.To2D(objects, {partsOnly: false, noJoints: true, gap})
            .then(on2DComplete(objects, ts), onFail(ts)).queue();
});
