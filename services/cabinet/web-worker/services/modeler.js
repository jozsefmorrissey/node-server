
const MFC = require('./modeling/modeling-function-configuration.js');
const MTDO = require('./modeling/modeling-data-transfer-object');
const idReg = /^(.*?)_(.*)$/;
class Modeler {
  constructor(modelItterator) {
    let next;
    while(next = modelItterator.nextJob()) {
      next = MTDO.reconnect(next);
      let id = next.assembly.id.replace(idReg, '$1');
      let modelingMethod = next.assembly.modelingMethod;
      console.log('Modeling: ', next.assembly.locationCode);
      let model;
      try {
        if (modelingMethod) {
          const modelFuncs = MFC[id][modelingMethod];
          if (modelFuncs === undefined) {
            throw new Error('Modeling Function is not Defined!');
          }
          if (modelFuncs.model) model = modelFuncs.model(next.assembly);
          else model = modelFuncs.biPolygon(next.assembly).model();
        } else if (next.assembly.position) {
          model = MFC(next.assembly).model();
        }
      } catch (e) {
        console.warn(e);
      }
      console.log(model ? model.toString() : null);
    }
  }
}

module.exports = Modeler;
