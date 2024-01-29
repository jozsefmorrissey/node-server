const Test = require('../../../../public/js/utils/test/test').Test;
const Cabinet = require('../../app-src/objects/assembly/assemblies/cabinet.js')
const CabinetLayouts = require('../../app-src/config/cabinet-layouts.js');
const Polygon3D = require('../../app-src/three-d/objects/polygon.js');
const Panel = require('../../app-src/objects/assembly/assemblies/panel.js');
const Frame = require('../../app-src/objects/assembly/assemblies/frame.js');



function get(layout, type) {
  const cabinet = Cabinet.build(type || 'base');
  if (layout !== true || (typeof layout) === 'string')
    CabinetLayouts.map[layout || 'test'].build(cabinet);
  cabinet.updateOpenings(true)
  return cabinet.allAssemblies();
}

const DTO = require('../../web-worker/external/data-transfer-object.js');
const RTO = require('../../web-worker/services/modeling/reconnect-transfer-object');
Test.add('DTO', (ts) => {
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

const onComplete = (ts, parts, intersections) => (modelInfo) => {
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

const onFail = (ts) => (task) => {
  ts.fail(task.error());
}

const Jobs = require('../../web-worker/external/jobs');
const ModelInfo = require('../../web-worker/external/model-information.js');
Test.add('CsgBuildTask base', (ts) => {
  const allAssemblies = get(true);
  const parts = allAssemblies.filter(a => a.part() && a.included());
  new Jobs.CSG.Join(parts).then(onComplete(ts, parts), ts.fail).queue();
});

Test.add('CsgBuildTask base:layout(test)', (ts) => {
  const allAssemblies = get();
  const parts = allAssemblies.filter(a => a.part() && a.included());
  new Jobs.CSG.Join(parts).then(onComplete(ts, parts), onFail(ts)).queue();
});

Test.add('CsgBuildTask base:R:full', (ts) => {
  const allAssemblies = get();
  const panel = allAssemblies.filter(a => a.partCode() === 'R:full')[0];
  const parts = [panel];
  new Jobs.CSG.Join(parts).then(onComplete(ts, parts), ts.fail).queue();
});

Test.add('CsgBuildTask base:layout(c)', (ts) => {
  const allAssemblies = get();
  const cabinet = allAssemblies.filter(a => a.partCode() === 'c')[0];
  const parts = [cabinet];
  new Jobs.CSG.Model(parts).then(onComplete(ts, parts), ts.fail).queue();
});

Test.add('CsgBuildTask base:layout(WW)', async (ts) => {
  const allAssemblies = get();
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
    ts.assertTrue(completionRatio < .2, 'ModelInfo.related object not reflecting changes');
    ts.success();
  };

  const left2Builder = async () => {
    new Jobs.CSG.Join(leftPanel).then(leftComplete2, ts.fail).queue();
  }

  const leftComplete = () => {
    leftTime = new Date().getTime();
    const completionRatio = (leftTime - rightTime) / (leftTime - startTime);
    ensureRendered([rightPanel, leftPanel], relatedInfo, ts, msg);
    ts.assertTrue(completionRatio < .5, 'ModelInfo.related object not reflecting changes');
    left2Builder();
  };

  const leftBuilder = async () => {
    new Jobs.CSG.Join(leftPanel).then(leftComplete, ts.fail).queue();
  }

  const rightComplete = () => {
    rightTime = new Date().getTime();
    ensureRendered([rightPanel], relatedInfo, ts, msg);
    leftBuilder();
  };

  new Jobs.CSG.Join(rightPanel).then(rightComplete, ts.fail).queue();
});

Test.add('CsgBuildTask base:layout(intersections)', (ts) => {
  const allAssemblies = get();
  const panelR = allAssemblies.filter(a => a.partCode() === 'R:full')[0];
  const panelL = allAssemblies.filter(a => a.partCode() === 'L:full')[0];

  const parts = [panelR, panelL];
  new Jobs.CSG.Intersection(parts).then(onComplete(ts, parts, true), ts.fail).queue();
});

Test.add('CsgBuildTask diagonal-corner-base', (ts) => {
  const allAssemblies = get(true, 'diagonal-corner-base');
  const cabinet = allAssemblies.filter(a => a.partCode() === 'c')[0];
  const parts = [cabinet];
  new Jobs.CSG.Model(parts).then(onComplete(ts, parts), ts.fail).queue();
});

Test.add('CsgBuildTask diagonal-corner-base:layout(3dsb3d)', (ts) => {
  const allAssemblies = get("3dsb3d", 'diagonal-corner-base');
  const cabinet = allAssemblies.filter(a => a.partCode() === 'c')[0];
  const fronts = allAssemblies.filter(a => a.part() && a.partCode().match(/^(d|df|D|ff|Dr|Dl)$/));
  const pulls = allAssemblies.filter(a => a.part() && a.partCode().match(/^(pu)$/));
  const parts = [cabinet].concat(fronts).concat(pulls);
  new Jobs.CSG.Model(parts, false).then(onComplete(ts, parts), ts.fail).queue();
});
