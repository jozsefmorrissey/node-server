const Test = require('../../../../public/js/utils/test/test').Test;
const Cabinet = require('../../app-src/objects/assembly/assemblies/cabinet.js')
const CabinetLayouts = require('../../app-src/config/cabinet-layouts.js');
const Polygon3D = require('../../app-src/three-d/objects/polygon.js');
const Panel = require('../../app-src/objects/assembly/assemblies/panel.js');
const Frame = require('../../app-src/objects/assembly/assemblies/frame.js');



function get(dontApplyTestConfig) {
  const cabinet = Cabinet.build('base');
  if (!dontApplyTestConfig) CabinetLayouts.map['test'].build(cabinet);
  cabinet.updateOpenings(true)
  return cabinet.allAssemblies();
}

const MDTO = require('../../web-worker/services/modeling/modeling-data-transfer-object.js');
Test.add('MDTO', (ts) => {
  const all = get();
  const dtos = MDTO.to(all);
  const reconnected = MDTO.reconnect(dtos);

  ts.assertEquals(reconnected.length + dtos.length, all.length *2, 'Incorrect Number of objects returned by conversion');

  const firstA = all[0];
  const firstR = reconnected[0];
  const center = firstR.position.current.center.object();
  const normals = firstR.position.current.normals;
  ts.assertTrue(center.equals(firstA.position().center()), 'Vertex3D conversion contains Error/s');
  ts.assertTrue(normals instanceof Object, 'plane js Object conversion contains Error/s');
  const xVectEq = firstA.position().normals().x.equals(normals.x);
  const yVectEq = firstA.position().normals().x.equals(normals.x);
  const zVectEq = firstA.position().normals().x.equals(normals.x);
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
    ts.assertTrue(modelInfo[partId] !== undefined, msg);
    const model = modelInfo[partId].model;
    ts.assertTrue(model !== undefined, msg);
    ts.assertTrue(Array.isArray(model.polygons), msg);
    ts.assertTrue(model.polygons.length > 0, msg);
  }
}

const onComplete = (ts, parts, snapShot) => (modelInfo) => {
  ts.assertEquals(modelInfo.percentBuilt(), 1);
  parts.forEach(p => {
    if (snapShot) {
      const jModelObj = modelInfo.modelInfo(p.id()).joinedModel;
      ts.assertTrue(Object.keys(jModelObj).length > 1);
    } else {
      const model = modelInfo.modelInfo(p.id()).model;
      ts.assertTrue(Array.isArray(model.polygons));
      ts.assertTrue(model.polygons.length > 0);
    }
  });
  ts.success();
}

const CsgBuildTask = require('../../web-worker/external/tasks');
const ModelInfo = require('../../web-worker/services/model-information.js');
// Test.add('CsgBuildTask base', (ts) => {
//   const allAssemblies = get(true);
//   const parts = allAssemblies.filter(a => a.part() && a.included());
//   new CsgBuildTask(parts, onComplete(ts, parts)).queue();
// });

// Test.add('CsgBuildTask base:layout(test)', (ts) => {
//   const allAssemblies = get();
//   const parts = allAssemblies.filter(a => a.part() && a.included());
//   new CsgBuildTask(parts, onComplete(ts, parts)).queue();
// });
//
// Test.add('CsgBuildTask base:R:full', (ts) => {
//   const allAssemblies = get();
//   const panel = allAssemblies.filter(a => a.partCode() === 'R:full')[0];
//   const parts = [panel];
//   new CsgBuildTask(parts, onComplete(ts, parts)).queue();
// });
//
//
// Test.add('CsgBuildTask base:layout(c)', (ts) => {
//   const allAssemblies = get();
//   const cabinet = allAssemblies.filter(a => a.partCode() === 'c')[0];
//   const parts = [cabinet];
//   new CsgBuildTask(parts, onComplete(ts, parts, {doNotJoin: true})).queue();
// });
//
// Test.add('CsgBuildTask base:layout(WW)', async (ts) => {
//   const allAssemblies = get();
//   const rightPanel = allAssemblies.filter(a => a.partCode() === 'R:full')[0];
//   const leftPanel = allAssemblies.filter(a => a.partCode() === 'L:full')[0];
//   const relatedInfo = ModelInfo.related(rightPanel);
//   let startTime = new Date().getTime();
//   let leftTime, rightTime, leftTime2;
//   const msg = 'Right and Left Itterators are not synconised';
//
//   const leftComplete2 = () => {
//     leftTime2 = new Date().getTime();
//     const completionRatio = (leftTime2 - leftTime) / (leftTime2 - startTime);
//     ensureRendered([rightPanel, leftPanel], relatedInfo, ts, msg);
//     ts.assertTrue(completionRatio < .2, 'ModelInfo.related object not reflecting changes');
//     ts.success();
//   };
//
//   const left2Builder = async () => {
//     new CsgBuildTask(leftPanel, leftComplete2).queue();
//   }
//
//   const leftComplete = () => {
//     leftTime = new Date().getTime();
//     const completionRatio = (leftTime - rightTime) / (leftTime - startTime);
//     ensureRendered([rightPanel, leftPanel], relatedInfo, ts, msg);
//     ts.assertTrue(completionRatio < .5, 'ModelInfo.related object not reflecting changes');
//     left2Builder();
//   };
//
//   const leftBuilder = async () => {
//     new CsgBuildTask(leftPanel, leftComplete).queue();
//   }
//
//   const rightComplete = () => {
//     rightTime = new Date().getTime();
//     ensureRendered([rightPanel], relatedInfo, ts, msg);
//     leftBuilder();
//   };
//
//   new CsgBuildTask(rightPanel, rightComplete).queue();
// });

Test.add('CsgBuildTask base:layout(test)', (ts) => {
  const allAssemblies = get();
  const panelR = allAssemblies.filter(a => a.partCode() === 'R:full')[0];
  const panelL = allAssemblies.filter(a => a.partCode() === 'L:full')[0];

  const parts = [panelR, panelL];
  new CsgBuildTask(parts, onComplete(ts, parts, true), {snapShot: true}).queue();
});
