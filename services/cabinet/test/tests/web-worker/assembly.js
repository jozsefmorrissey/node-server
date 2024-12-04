const Test = require('../../../../../public/js/utils/test/test').Test;
const Cabinet = require('../../../app-src/objects/assembly/assemblies/cabinet.js');
const CabinetLayouts = require('../../../app-src/config/cabinet-layouts.js');
const Jobs = require('../../../web-worker/external/jobs');
const ModelInfo = require('../../../web-worker/external/model-information.js');


function get(layout, type, cabinetOnly) {
  const cabinet = Cabinet.build(type || 'base');
  if (layout === '') return cabinet;
  if (layout !== true || (typeof layout) === 'string')
    CabinetLayouts.map[layout || 'test'].build(cabinet);
  cabinet.updateOpenings(true);
  return cabinetOnly ? cabinet : cabinet.allAssemblies();
}

function ensureRendered(assems, modelInfo, ts, msg) {
  for (let index = 0; index < assems.length; index++) {
    msg ||= `Faild to create model for: ${assems[index].locationCode()}`;
    const partId = assems[index].id();
    const model = modelInfo.model[partId];
    ts.assertTrue(model !== undefined, msg);
    ts.assertTrue(Array.isArray(model.polygons), msg);
    ts.assertTrue(model.polygons.length > 0, msg);
  }
}

const onComplete = (ts, parts, intersections) => (csg, job) => {
  ts.assertTrue(csg instanceof CSG && csg.polygons.length > 0);
  console.log(csg.toDrawString());
  ts.success();
}

const onFail = (ts) => (error) => {
  ts.fail(error);
}


Test.add('Jobs.CSG.Assembly base:layout(test)', async (ts, allAssemblies) => {
  throw new Error('Job Structure has changed suggnificantly all test are likely invalid');
  const parts = allAssemblies.filter(a => a.part() && a.included());
  new Jobs.CSG.Assembly(parts).then(onComplete(ts, parts), onFail(ts)).queue();
}, async () => get());

Test.add('Jobs.CSG.Assembly dcb', async (ts, cabinet) => {
  throw new Error('Job Structure has changed suggnificantly all test are likely invalid');
  new Jobs.CSG.Assembly(cabinet)
        .then(onComplete(ts, [cabinet]), onFail(ts)).queue();
}, async () => get("", 'diagonal-corner-base'));

Test.add('Jobs.CSG.Assembly base:layout(test)', async (ts, allAssemblies) => {
  throw new Error('Job Structure has changed suggnificantly all test are likely invalid');
  const cabinet = allAssemblies[0].getRoot();
  new Jobs.CSG.Assembly(cabinet)
        .then(onComplete(ts, [cabinet]), onFail(ts)).queue();
}, async () => get());

Test.add('Jobs.CSG.Assembly base:layout(c)', async (ts, allAssemblies) => {
  throw new Error('Job Structure has changed suggnificantly all test are likely invalid');
  const cabinet = allAssemblies.filter(a => a.partCode() === 'c')[0];
  const parts = [cabinet];
  new Jobs.CSG.Assembly(parts, {partsOnly: false})
  .then(onComplete(ts, parts), onFail(ts)).queue();
}, async () => get());

Test.add('Jobs.CSG.Assembly diagonal-corner-base:test-cabinet', async (ts, allAssemblies) => {
  throw new Error('Job Structure has changed suggnificantly all test are likely invalid');
  const cabinet = allAssemblies.filter(a => a.partCode() === 'c')[0];
  const parts = cabinet.getParts();
  new Jobs.CSG.Assembly(parts).then(onComplete(ts, parts), onFail).queue();
}, async () => get(true, 'diagonal-corner-base'));

Test.add('Jobs.CSG.Assembly diagonal-corner-base:layout(3dsb3d)', async (ts, allAssemblies) => {
  throw new Error('Job Structure has changed suggnificantly all test are likely invalid');
  const cabinet = allAssemblies.filter(a => a.partCode() === 'c')[0];
  new Jobs.CSG.Assembly(cabinet)
        .then(onComplete(ts, [cabinet]), onFail(ts)).queue();
}, async () => get("3dsb3d", 'diagonal-corner-base'));

const on2DComplete = (objects, ts) => (result, job) => {
  for (let index = 0; index < objects.length; index++) {
    ts.assertTrue(result[objects[index].id()] !== undefined);
  }
  ts.success();
}

Test.add('Jobs.CSG.Assembly', async (ts, cabinet) => {
  throw new Error('Job Structure has changed suggnificantly all test are likely invalid');
  const gap = 25;

  new Jobs.CSG.Assembly(cabinet, {gap})
          .then(on2DComplete(cabinet, ts), onFail(ts)).queue();
}, async () => get('', 'diagonal-corner-base'));
