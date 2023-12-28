
const Test = require('../../../../public/js/utils/test/test').Test;
const Cabinet = require('../../app-src/objects/assembly/assemblies/cabinet.js')
const CabinetLayouts = require('../../app-src/config/cabinet-layouts.js');
const Polygon3D = require('../../app-src/three-d/objects/polygon.js');


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

Test.add('web-worker: toModel',async (ts) => {
  const cabinet = Cabinet.build('base');
  CabinetLayouts.map['test'].build(cabinet);
  let webWorker = new Worker("/cabinet/js/web-worker.js");
  const cabinetClone = Cabinet.fromJson(cabinet.toJson());


  console.log(Polygon3D.toDrawString(cabinetClone.toModel(), 'blue'));
});
