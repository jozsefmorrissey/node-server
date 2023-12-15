
const Test = require('../../../../public/js/utils/test/test').Test;
const Cabinet = require('../../app-src/objects/assembly/assemblies/cabinet.js')
const CabinetLayouts = require('../../app-src/config/cabinet-layouts.js');
const Polygon3D = require('../../app-src/three-d/objects/polygon.js');


/**
  Priority 1)
      Construct CSG(\.(toModel|toBipoly)) object with webWorker.
  Priority 2)
      Reorganize and isolate CSG building code so that web-worker and index
      have very little overlaping code.
      -- files constructed by watch.js

  ./app-src/three-d/
        objects/ should be moved to ~/public/js/utils
              existing folder 3d-modeling should be within a modeling folder under three-d
        models/ should be moved to web-worker
        ThreeDModel.js asynconisly run off of web worker

  ./app-src/objects
      if possible do not use this.

  navigator.hardwareConcurrency - number of availible processors


**/

Test.add('web-worker: toModel',async (ts) => {
  const cabinet = Cabinet.build('base');
  CabinetLayouts.map['test'].build(cabinet);
  let webWorker = new Worker("/cabinet/js/web-worker.js");
  const cabinetClone = Cabinet.fromJson(cabinet.toJson());


  console.log(Polygon3D.toDrawString(cabinetClone.toModel(), 'blue'));
});
