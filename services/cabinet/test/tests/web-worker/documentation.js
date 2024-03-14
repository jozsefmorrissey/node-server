const Test = require('../../../../../public/js/utils/test/test').Test;
const HtmlTest = require('../../../../../public/js/utils/test/html-test');
const Order = require('../../../app-src/objects/order.js');
const Room = require('../../../app-src/objects/room.js');
const Cabinet = require('../../../app-src/objects/assembly/assemblies/cabinet.js');
const CabinetLayouts = require('../../../app-src/config/cabinet-layouts.js');
const Construction = require('../../../app-src/displays/documents/construction')
const Jobs = require('../../../web-worker/external/jobs');
const DocDisplay = require('../../../app-src/displays/documents/documents.js');
const Global = require('../../../app-src/services/global.js');

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

function testOrder() {
  if (Global.order() && Global.room()) return Global.order();
  let diagonal = get('3dsb3d', 'diagonal-corner-base', true);
  let base = get('test', null, true);
  let ddWall = get('DD', 'wall', true);
  let ddddWall = get('DDDD', 'wall', true);
  console.log(Order.fromJson(require('../test-order.json')));

  const order = new Order('testOrder');
  const room = order.addRoom('bar');

  const wallGroup = room.groups[0];
  wallGroup.name('wall');
  wallGroup.addObject(ddWall);
  wallGroup.addObject(ddddWall);
  wallGroup.addObject(get('3d', 'wall', true));
  wallGroup.addObject(get('3d', 'wall', true));
  wallGroup.addObject(get('DD', 'wall', true));
  wallGroup.addObject(get('DD', 'wall', true));
  wallGroup.addObject(get('DD', 'wall', true));
  wallGroup.addObject(get('DD', 'wall', true));
  wallGroup.addObject(get('DD', 'wall', true));
  wallGroup.addObject(get('DD', 'wall', true));
  wallGroup.addObject(get('DD', 'wall', true));
  wallGroup.addObject(get('DD', 'wall', true));
  wallGroup.addObject(get('DD', 'wall', true));
  wallGroup.addObject(get('DD', 'wall', true));

  const baseGroup = room.addGroup('base');
  baseGroup.addObject(base);
  baseGroup.addObject(diagonal);
  Global.order(order);
  return order;
}

const onSingleComplete = (part, ts) => (map, job) => {
  console.log(ts.time());
  console.log(map, job);
}

// Test.add('Jobs.Documentation.Parts', async (ts) => {
//   const cabinet = get(true, null, true);
//   const parts = [cabinet.getAssembly('L:full')];
//   new Jobs.Documentation.Parts(parts)
//         .then(onSingleComplete(parts[0], ts), onFail(ts)).queue();
// });

const onTestComplete = (parts, ts) => (result, job) => {
  console.log(ts.time());
}

// Test.add('Jobs.Documentation.Parts', async (ts) => {
//   const cabinet = get('test', null, true);
//
//   let parts = cabinet.getParts();
//
//   const title = 'Single Part Doc';
//   HtmlTest.register(title, () => 'Loading...');
//   const cnt = HtmlTest.container(title);
//   const job = Construction.Parts(parts, cnt);
//   job.then(onTestComplete(parts, ts));
// });

// Test.add('Construction.Parts: diagonal-corner-base', async (ts) => {
//   // const cabinet = get('3dsb3d', 'diagonal-corner-base', true);
//   let cabinet = get('test', null, true);
//   let parts = cabinet;
//
//   const title = 'Single Part Doc';
//   HtmlTest.register(title, () => 'Loading...');
//   const cnt = HtmlTest.container(title);
//   const job = Construction.Parts(parts, cnt);
//   job.then(onTestComplete(parts, ts));
// });


// Test.add('Construction.Order', async (ts) => {
//   const order = testOrder();
//
//   const title = 'Order Doc';
//   HtmlTest.register(title, () => 'Loading...');
//   const cnt = HtmlTest.container(title);
//   const job = Construction.Order(order, cnt);
//   job.then(onTestComplete(order, ts));
// });

Test.add('Construction.Order', async (ts) => {
  const order = testOrder();
  const title = 'Documentation Doc';
  HtmlTest.register(title, () => 'Loading...');
  const cnt = HtmlTest.container(title);
  DocDisplay.selected(DocDisplay.TITLES.CUT_LIST.title)
  cnt.innerHTML = DocDisplay.html();

});

module.exports = {testOrder};
