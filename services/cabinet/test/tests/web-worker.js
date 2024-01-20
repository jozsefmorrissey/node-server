const Test = require('../../../../public/js/utils/test/test').Test;
const Cabinet = require('../../app-src/objects/assembly/assemblies/cabinet.js')
const CabinetLayouts = require('../../app-src/config/cabinet-layouts.js');
const Polygon3D = require('../../app-src/three-d/objects/polygon.js');
const Panel = require('../../app-src/objects/assembly/assemblies/panel.js');
const Frame = require('../../app-src/objects/assembly/assemblies/frame.js');
const { RenderingExecutor } = require('../../web-worker/external/web-worker-client.js');


/**
  Priority 1)
      Construct CSG(\.(toModel|toBipoly)) object with webWorker.
  Priority 2)
      Reorganize and isolate CSG building code so that web-worker-bundle and index
      have very little overlaping code.
      -- files constructed by watch.js
      -- app-src/objects/assemblies user data model.

  ./app-src/three-d/
        layout/ stays in cabinet
        objects/ should be moved to ~/public/js/utils/canvas/
              existing folder 3d-modeling should be within a modeling folder under three-d
        models/ should be moved to web-worker
        ThreeDModel.js asynconisly run off of web worker

  ./app-src/objects
      if possible do not use this.

  navigator.hardwareConcurrency - number of availible processors

  (any part).subassemblies.R.position().current()  - decimal values
        if all demensions === 0 look for a complex toModel or biPolygon
  (any part).subassemblies.R.position().configuration() - formulas
  (any part).getJoints - returns {male: [], female: []}
  Joint.apply - to apply joints

  section-properties
    coverage - calclates drawerFront\door offset information
    dividerOffsetInfo - calculates divider position information
    coverInfo - calculates drawerFront\door biPolygon;
    dividerInfo - calculates divider biPolygon


---

  * pull out the toBipolygon and toModel out of the assembly objects and run in the webworker
  * webwork entry point is webworker/init.js -- shoudn't need to reference assembly objects ... probably
  * don't necessarily need to reuse the toJson(), may be better to create model classes as needed
  *
  * cabinet.subassemblies.R.position
---

**/


//toModel([]);
//position.current();

function get(filter, dontApplyTestConfig) {
  if (filter === undefined) filter = /.*/;
  if (filter instanceof RegExp) {
    const reg = filter;
    filter = sa => sa.constructor.name.match(reg);
  }
  const cabinet = Cabinet.build('base');
  if (!dontApplyTestConfig) CabinetLayouts.map['test'].build(cabinet);
  cabinet.updateOpenings(true)
  return cabinet.allAssemblies().filter(filter);
}

const MDTO = require('../../web-worker/services/modeling/modeling-data-transfer-object.js');
Test.add('MDTO', (ts) => {
  const all = get(/.*/);
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

function ensureRendered(assems, modelInfo, ts) {
  for (let index = 0; index < assems.length; index++) {
    const partId = assems[index].id();
    const model = modelInfo[partId].model;
    const msg = `Faild to create model for: ${assems[index].locationCode()}`;
    ts.assertTrue(model !== undefined, msg);
    ts.assertTrue(Array.isArray(model.polygons), msg);
    ts.assertTrue(model.polygons.length > 0, msg);
  }
}

const ModelItterator = require('../../web-worker/services/model-itterator.js');
const Modeler = require('../../web-worker/services/modeler.js');
// Test.add('Modeler base', (ts) => {
//   const allAssemblies = get(undefined, true);
//   const panel = allAssemblies.filter(a => a.partCode() === 'R')[0];
//   const modelItt = new ModelItterator(allAssemblies, panel);
//   const modeler = new Modeler(modelItt);
//
//   ts.assertEquals(modelItt.percentBuilt(), 1);
//   const modelInfo = modelItt.modelInfo();
//   const parts = allAssemblies.filter(a => a.part());
//   parts.forEach(p => {
//     const model = modelInfo[p.id()].model;
//     ts.assertTrue(Array.isArray(model.polygons));
//     ts.assertTrue(model.polygons.length > 0);
//   });
//   // console.log(modelItt.models().toString());
//   ts.success();
// });

Test.add('Modeler base:layout(test)', (ts) => {
  const allAssemblies = get();
  const panel = allAssemblies.filter(a => a.partCode() === 'R')[0];
  const start = new Date().getTime();
  const modelItt = new ModelItterator(allAssemblies);
  const end = new Date().getTime();
  const modeler = new Modeler(modelItt);

  const modelInfo = modelItt.modelInfo();
  console.log(modelItt.models().toString(.0001));
  ts.assertEquals(modelItt.percentBuilt(), 1);
  const parts = allAssemblies.filter(a => a.part() && a.included());
  ensureRendered(parts, modelInfo, ts);
  ts.success();
});

// d('Modeler base:layout(R:p)', (ts) => {
//   const allAssemblies = get();
//   const panel = allAssemblies.filter(a => a.partCode() === 'R:p')[0];
//   const start = new Date().getTime();
//   const modelItt = new ModelItterator(allAssemblies, [panel]);
//   const end = new Date().getTime();
//   const modeler = new Modeler(modelItt);
//
//   const modelInfo = modelItt.modelInfo();
//   console.log(modelItt.models().toString(.0001));
//   ts.assertEquals(modelItt.percentBuilt(), 1);
//   const parts = allAssemblies.filter(a => a.part() && a.included());
//   ensureRendered(parts, ts);
//   ts.success();
// });



let webWorker;
let renderingExecutor;


                          // Test.add('webworker: setup', async (ts) => {
                          //   webWorker = new Worker('/cabinet/js/web-worker-bundle.js');
                          //   renderingExecutor = new RenderingExecutor(webWorker);
                          //   ts.success();
                          // });
                          //
                          //
                          // Test.add('web-worker: toBiPolygon(Panel)', async (ts) => {
                          //   // const frame = new Frame('f', 'Frame', '0,0,0', '4, 196, .75');
                          //   const panel = new Panel('p', 'Panel', '0,0,0', '24, 10, .75');
                          //
                          //   const expected = panel.toBiPolygon();
                          //   const actual = await renderingExecutor.panelToBiPolygon(panel);
                          //   ts.assertTrue(Object.equals(expected, actual));
                          //   ts.success();
                          // });

// Test.add('web-worker: toModel(Panel)', async (ts) => {
//   const panel = new Panel('p', 'Panel', '0,0,0', '24, 10, .75');

//   const expected = panel.toModel();
//   const actual = await renderingExecutor.panelToModel(panel);
//   ts.assertTrue(Object.equals(expected, actual));
//   ts.success();

//   // const regularModel = frame.toModel();
//   // const info = frame.wwinfo();
//   // const wwModel = webWorker(info);
//   // Object.equals(regularModel, wwModel);

//   // console.log(Polygon3D.toDrawString(cabinetClone.toModel(), 'blue'));
// });




// Test.add('web-worker: toModel(sectionProperties)', async (ts) => {
//   // In /sections
//   const cabinet = Cabinet.build('base');
// });
//
//
//
// /**
//   Frame
//   Panel
//     infoObj: position.current();
//     functions to move
//       position.toModel
//       position.toBiPolygon
// **/
// Test.add('web-worker: toModel(Frame,Panel)', async (ts) => {
//   testCSGvsExistingObjects(get(/^Frame|Panel$/), ts);
//   ts.success();
// });
//
//
// /**
//   Handle (pull.js) feel free to rename
//     infoObj: {location, count, index, centerToCenter);}
//     functions to move
//       toModel
//       baseCenter
// **/
// Test.add('web-worker: toModel(Handle)', async (ts) => {
//   testCSGvsExistingObjects(get('Handle'), ts);
//   ts.success();
// });
//
//
// /**
//   Divider
//     infoObj: {
//       includeJoints, type
//     }
//
//     funcions to move
//       toModel
//       toBiPolygon
//       build
//       buildPolyCutter
//       builders
// **/
// Test.add('web-worker: toModel(Divider)', async (ts) => {
//   testCSGvsExistingObjects(get(/^Divider$/), ts);
//   ts.success();
// });
//
//
// /** SectionProperties and children
//       Classes in order of complexity
//         DivideSection // Remove its not used anymore
//         FalseFrontSection
//         DualDoorSection
//         DoorSection
//         DividerSection
//
//         DrawerFront
//         DrawerBox
//         Door
//
//         DrawerSection(infoObj: {propConfig('Guides')})
//         PanelSection (joints should be done before migration)
//
//       infoObj: { // All found in sectionProperties
//         top(), bottom(), left(), right()
//           {depth, thickness, width, height, rotation, position}
//         dividerReveal()
//         pattern()
//         vertical()
//         verticalDivisions()
//         dividerCount()
//         sectionCount()
//         coordinates()
//         innerDepth()
//         divideRight()
//         outerPoly()
//         innerPoly()
//         rotation()
//         this.propertyConfig(): {isReveal, isInset, reveal, Inset, overlay}
//         divider; {position, maxWidth, panelThickness}
//       }
//
//       functions to be moved
//         SectionProperties
//           converage()
//           coverInfo()
//           polyInformation()
//           drawerDepth()
//           dividerLayout()
//           perpendicularDistance()
//           dividerOffsetInfo()
//           outerCenter()
//           innerCenter()
//           outerLength()
//           innerLength()
//           outerWidth()
//           innerWidth()
//           normal()
//           dividerInfo()
//         SpaceSection
//           coverable()
//           pattern()
//         DrawerSection
//           getFrontPoly()
//           drawerDepth()
//
// **/
// function testWWvsExistingFunctions(funcName, sections, ts, ...args) {
//   if (sections.length === 0) ts.failed('Where th sections at?');
//   sections.forEach(sp => {
//     // args shouldn't be neccissary but there it is.
//     const original = sp[funcName](...args);
//     const info = object.wwinfo([]);
//     const result = webWorkerFunctionCall(info);
//     ts.assertTrue(Object.equals(original, result));
//   })
//
// }
// Test.add('web-worker: toModel(SectionProperties)', async (ts) => {
//   const sections = get('SectionProperties');
//   testWWvsExistingFunctions('converage', sections, ts);
//   testWWvsExistingFunctions('coverInfo', sections, ts);
//   testWWvsExistingFunctions('polyInformation', sections, ts);
//   testWWvsExistingFunctions('drawerDepth', sections, ts);
//   testWWvsExistingFunctions('dividerLayout', sections, ts);
//   testWWvsExistingFunctions('perpendicularDistance', sections, ts);
//   testWWvsExistingFunctions('dividerOffsetInfo', sections, ts);
//   testWWvsExistingFunctions('outerCenter', sections, ts);
//   testWWvsExistingFunctions('innerCenter', sections, ts);
//   testWWvsExistingFunctions('outerLength', sections, ts);
//   testWWvsExistingFunctions('innerLength', sections, ts);
//   testWWvsExistingFunctions('outerWidth', sections, ts);
//   testWWvsExistingFunctions('innerWidth', sections, ts);
//   testWWvsExistingFunctions('normal', sections, ts);
//   testWWvsExistingFunctions('dividerInfo', sections, ts);
//   ts.success();
// });
//
// // The test cabinet does not currently have any spaceSections to add one
// // Search for 'new CabinetLayout('test',' It should be obviose how to change a section.
// Test.add('web-worker: toModel(SpaceSection)', async (ts) => {
//   const sections = get('SpaceSection');
//   testWWvsExistingFunctions('coverable', sections, ts);
//   testWWvsExistingFunctions('pattern', sections, ts);
//
//   ts.success();
// });
//
// Test.add('web-worker: toModel(DrawerSection)', async (ts) => {
//   const sections = get('DrawerSection');
//   testWWvsExistingFunctions('dividerInfo', sections, ts);
//
//   ts.success();
// });
//
//
// /**
//   ToeKick
//     infoObj:
//       openings are the root sectionProperties, cabinets can have multiple
//       and if autoToeKicks are enabled one is genrated using each opening
//       cabinet.value('tkh')
//       cabinet.value('tkd')
//       cabinet.value('tkbw')
//       cabinet.value('B.t') // This is referencing the thickness of part w/partCode B
//
//     functions to be moved
//       toModel()
//       toBiPolygon()
//       corners()
//       buildOffset()
//       buildToeKick()
//       addExtraSupports() // Needs fixed but should be relocated
//       buildSupports() // Needs fixed but should be relocated
//       sidePoly()
//       openingToeKick()
//
// **/
//
// // The AutoToekick is not currently accessible outside of the Cabinet object.
// Test.add('web-worker: toModel(AutoToekick)', async (ts) => {
//   const sections = get(/AutoToekick/);
//   testWWvsExistingFunctions('dividerInfo', sections, ts);
//
//   ts.success();
// });
//
//
// /**
//   Cutter infoObj: {config}
//
//   CutterReference(infoObj: {reference})
//
//   // should probably have a conversation with me before trying to tackle these
//   CutterModel
//   CutterPoly
// **/
//
// Test.add('web-worker: toModel(Cutter)', async (ts) => {
//   testCSGvsExistingObjects(get(/Cutter/), ts);
//   ts.success();
// });
//
// Test.add('web-worker: toModel(CutterReference)', async (ts) => {
//   testCSGvsExistingObjects(get(/CutterReference/), ts);
//   ts.success();
// });
//
// Test.add('web-worker: toModel(CutterModel)', async (ts) => {
//   testCSGvsExistingObjects(get(/CutterModel/), ts);
//   ts.success();
// });
//
// Test.add('web-worker: toModel(CutterPoly)', async (ts) => {
//   testCSGvsExistingObjects(get(/CutterPoly/), ts);
//   ts.success();
// });
//
//
// /**
//   Void
//     infoObj: {includedSides, config, jointSet}
//
//     functions to be moved
//       toBipoly()
//       toModel()
//       abyssModel()
// **/
// Test.add('web-worker: toModel(Void)', async (ts) => {
//   const sections = get(/Void/);
//   testWWvsExistingFunctions('dividerInfo', sections, ts);
//
//   ts.success();
// });
//
//
// /**
//   Cabinet
//     infoObj: {
//       children: subassemblies.map(sa => sa.infoObj()).concat(toeKick.infoObj())
//       Position
//     }
// **/
// Test.add('web-worker: toModel(sectionProperties)', async (ts) => {
//   const cabinet = Cabinet.build('base');
//   CabinetLayouts.map['test'].build(cabinet);

//   testCSGvsExisting(cabinet);
// });


// Test.add('webworker: tear down', async (ts) => {
//   webWorker.terminate();
//   ts.success();
// });



// function testCSGvsExisting(object, ts) {
//   const regularModel = object.toModel([]);
//   const info = object.wwinfo([]);
//   const wwModel = webWorker(info);
//   // console.log(JSON.stringify(regularModel, null, 2));
//   // console.log(JSON.stringify(wwModel, null, 2));
//   //console.log(Polygon3D.toDrawString(cabinetClone.toModel(), 'blue'));
//   ts.assertTrue(Object.equals(regularModel, wwModel));
// }
//
// function testCSGvsExistingObjects(objects, ts) {
//   if (objects.length === 0) ts.failed('YO! where da objs @');
//   objects.forEach(obj => testCSGvsExisting(obj, ts));
// }
