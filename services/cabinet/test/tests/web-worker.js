
const Test = require('../../../../public/js/utils/test/test').Test;
const Cabinet = require('../../app-src/objects/assembly/assemblies/cabinet.js')
const CabinetLayouts = require('../../app-src/config/cabinet-layouts.js');
const Polygon3D = require('../../app-src/three-d/objects/polygon.js');


/**
  Priority 1)
      Construct CSG(.toModel) object with webWorker.
  Priority 2)
      Reorganize and isolate CSG building code so that web-worker and index
      have very little code overlap.
      -- files constructed by watch.js
**/

Test.add('web-worker: toModel',async (ts) => {
  const cabinet = Cabinet.build('base');
  CabinetLayouts.map['test'].build(cabinet);
  // let webWorker = new Worker("/cabinet/js/web-worker.js");
  const cabinetClone = Cabinet.fromJson(cabinet.toJson());


  console.log(Polygon3D.toDrawString(cabinetClone.toModel(), 'blue'));
});
