const Test = require('../../../../../public/js/utils/test/test').Test;
const HtmlTest = require('../../../../../public/js/utils/test/html-test');
const Cabinet = require('../../../app-src/objects/assembly/assemblies/cabinet.js');
const CabinetLayouts = require('../../../app-src/config/cabinet-layouts.js');
const Construction = require('../../../app-src/displays/documents/construction')
const Jobs = require('../../../web-worker/external/jobs');

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

const onTestComplete = (parts, ts) => (result) => {
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
//   const job = Construction.Panels(parts, cnt);
//   job.then(onTestComplete(parts, ts));
// });

Test.add('Jobs.Documentation.Parts: diagonal-corner-base', async (ts) => {
  const cabinet = get('3dsb3d', 'diagonal-corner-base', true);
  // const parts = [cabinet.getAssembly('L:full')];
  // parts.concatInPlace(cabinet.getAssembly('R:full'));
  // const parts = [cabinet.getAssembly('B:full')];
  // let parts = [cabinet.getAssembly('tkb')];
  // let parts = [cabinet.getAssembly('dv:full')];

  let parts = cabinet.getParts();

  const title = 'Single Part Doc';
  HtmlTest.register(title, () => 'Loading...');
  const cnt = HtmlTest.container(title);
  const job = Construction.Panels(parts, cnt);
  job.then(onTestComplete(parts, ts));
  // Construction.Parts(cabinet.getParts(), cnt);
});
