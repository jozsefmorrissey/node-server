// require('../../../public/js/utils/utils.js');
// require('../app-src/objects/assembly/init-assem.js');
// require('../app-src/objects/joint/init.js');
// require('../app-src/config/properties.js');
// const Cabinet = require('../../app-src/objects/assembly/assemblies/cabinet.js')
// const CabinetLayouts = require('../../app-src/config/cabinet-layouts.js');
// const Polygon3D = require('../three-d/objects/polygon.js');

const { RenderingResponse } = require("../app-src/web-worker-client");


// const cabinet = Cabinet.build('base');
// CabinetLayouts.map['test'].build(cabinet);
// const cabinetClone = Cabinet.fromJson(cabinet.toJson());

// const model = cabinetClone.toModel();
// console.log(Polygon3D.toDrawString(model, 'blue'));
// // console.log('hello from web-worker');


onmessage = (messageFromMain) => {
    postMessage(new RenderingResponse(messageFromMain.data.taskId, `response for request: ${messageFromMain.data.body}`));
};