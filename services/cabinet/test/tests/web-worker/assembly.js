const Test = require('../../../../../public/js/utils/test/test').Test;
const Cabinet = require('../../../app-src/objects/assembly/assemblies/cabinet.js');
const CabinetLayouts = require('../../../app-src/config/cabinet-layouts.js');
const Jobs = require('../../../web-worker/external/jobs');
const ModelInfo = require('../../../web-worker/external/model-information.js');


function get(layout, type, cabinetOnly) {
  const cabinet = Cabinet.build(type || 'base');
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
  const modelInfo = job.modelInfo();
  ts.assertEquals(modelInfo.status().models, 1);
  parts.forEach(p => {
    if (intersections) {
      const intModelObj = modelInfo.intersection(p.id());
      ts.assertTrue(Object.keys(intModelObj).length > 1);
    } else {
      const model = modelInfo.model(p.id());
      ts.assertTrue(Array.isArray(model.polygons));
      ts.assertTrue(model.polygons.length > 0);
    }
  });
  ts.success();
}

const onFail = (ts) => (error) => {
  ts.fail(error);
}

Test.add('Jobs.CSG.Assembly.Join base', async (ts, allAssemblies) => {
  const parts = allAssemblies.filter(a => a.part() && a.included());
  new Jobs.CSG.Assembly.Join(parts).then(onComplete(ts, parts), onFail(ts)).queue();
}, async () => get(true));

Test.add('Jobs.CSG.Assembly.Join base:layout(test)', async (ts, allAssemblies) => {
  const parts = allAssemblies.filter(a => a.part() && a.included());
  new Jobs.CSG.Assembly.Join(parts).then(onComplete(ts, parts), onFail(ts)).queue();
}, async () => get());

Test.add('Jobs.CSG.Cabinet.Simple base:layout(test)', async (ts, allAssemblies) => {
  const cabinet = allAssemblies[0].getRoot();
  new Jobs.CSG.Cabinet.Simple(cabinet)
        .then(onComplete(ts, [cabinet]), onFail(ts)).queue();
}, async () => get());

Test.add('Jobs.CSG.Assembly.Model base:layout(c)', async (ts, allAssemblies) => {
  const cabinet = allAssemblies.filter(a => a.partCode() === 'c')[0];
  const parts = [cabinet];
  new Jobs.CSG.Assembly.Model(parts, {partsOnly: false, noJoints: true})
  .then(onComplete(ts, parts), onFail(ts)).queue();
}, async () => get());

Test.add('Jobs.CSG.Assembly.Join base:R:full', async (ts, allAssemblies) => {
  const panel = allAssemblies.filter(a => a.partCode() === 'R:full')[0];
  const parts = [panel];
  new Jobs.CSG.Assembly.Join(parts).then(onComplete(ts, parts), onFail(ts)).queue();
}, async () => get());

const timedError = 'Timed Test: If debugging this will likely fail\n\tOr ModelInfo.object not reflecting changes from other processes';
Test.add('Jobs.CSG.Assembly.Join seperate calls share information', async (ts, allAssemblies) => {
  const rightPanel = allAssemblies.filter(a => a.partCode() === 'R:full')[0];
  const leftPanel = allAssemblies.filter(a => a.partCode() === 'L:full')[0];
  const relatedInfo = ModelInfo.related(rightPanel);
  let startTime = new Date().getTime();
  let leftTime, rightTime, leftTime2;
  const msg = 'Right and Left Itterators are not synconised';

  const leftComplete2 = () => {
    leftTime2 = new Date().getTime();
    const completionRatio = (leftTime2 - leftTime) / (leftTime2 - startTime);
    ensureRendered([rightPanel, leftPanel], relatedInfo, ts, msg);
    ts.assertTrue(completionRatio < .2, timedError);
    ts.success();
  };

  const left2Builder = async () => {
    new Jobs.CSG.Assembly.Join(leftPanel).then(leftComplete2, onFail(ts)).queue();
  }

  const leftComplete = () => {
    leftTime = new Date().getTime();
    const completionRatio = (leftTime - rightTime) / (leftTime - startTime);
    ensureRendered([rightPanel, leftPanel], relatedInfo, ts, msg);
    ts.assertTrue(completionRatio < .5, timedError);
    left2Builder();
  };

  const leftBuilder = async () => {
    new Jobs.CSG.Assembly.Join(leftPanel).then(leftComplete, onFail(ts)).queue();
  }

  const rightComplete = () => {
    rightTime = new Date().getTime();
    ensureRendered([rightPanel], relatedInfo, ts, msg);
    leftBuilder();
  };

  new Jobs.CSG.Assembly.Join(rightPanel).then(rightComplete, onFail(ts)).queue();
}, async () => get());

Test.add('Jobs.CSG.Assembly.Intersection base:R:full&L:full', async (ts, allAssemblies) => {
  const panelR = allAssemblies.filter(a => a.partCode() === 'R:full')[0];
  const panelL = allAssemblies.filter(a => a.partCode() === 'L:full')[0];

  const parts = [panelR, panelL];
  new Jobs.CSG.Assembly.Intersection(parts).then(onComplete(ts, parts, true), onFail(ts)).queue();
}, async () => get());

Test.add('Jobs.CSG.Assembly.Model diagonal-corner-base:test-cabinet', async (ts, allAssemblies) => {
  const cabinet = allAssemblies.filter(a => a.partCode() === 'c')[0];
  const parts = [cabinet];
  new Jobs.CSG.Assembly.Model(parts).then(onComplete(ts, parts), onFail).queue();
}, async () => get(true, 'diagonal-corner-base'));

Test.add('Jobs.CSG.Cabinet.Simple diagonal-corner-base:layout(3dsb3d)', async (ts, allAssemblies) => {
  const cabinet = allAssemblies.filter(a => a.partCode() === 'c')[0];
  new Jobs.CSG.Cabinet.Simple(cabinet)
        .then(onComplete(ts, [cabinet]), onFail(ts)).queue();
}, async () => get("3dsb3d", 'diagonal-corner-base'));

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

Test.add('Jobs.CSG.Cabinet.To2D', async (ts, allAssemblies) => {
  const cabinet = allAssemblies.filter(a => a.partCode() === 'c')[0];
  const parts = [cabinet];
  const gap = 25;

  new Jobs.CSG.Cabinet.To2D(parts, {gap})
          .then(on2DComplete(parts, ts), onFail(ts)).queue();
}, async () => get(true, 'diagonal-corner-base'));
