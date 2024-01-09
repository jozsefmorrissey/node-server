require('../../../../public/js/utils/utils.js');
// require('../../app-src/objects/assembly/init-assem.js');
// require('../../app-src/objects/joint/init.js');
// require('../../app-src/config/properties.js');
// const Cabinet = require('../../app-src/objects/assembly/assemblies/cabinet.js')
// const CabinetLayouts = require('../../app-src/config/cabinet-layouts.js');
// const Polygon3D = require('../../three-d/objects/polygon.js');

const BiPolygon = require("../../app-src/three-d/objects/bi-polygon");
const { RenderingTask, RenderingResult, AssemblyDto, AssemblyTypes } = require("../shared/web-worker-models");


// const cabinet = Cabinet.build('base');
// CabinetLayouts.map['test'].build(cabinet);
// const cabinetClone = Cabinet.fromJson(cabinet.toJson());

// const model = cabinetClone.toModel();
// console.log(Polygon3D.toDrawString(model, 'blue'));
// // console.log('hello from web-worker');


/**
 * @param {MessageEvent<RenderingTask>} messageFromMain
 */
onmessage = (messageFromMain) => {
    const result = handleMessage(messageFromMain.data);
    console.log('[web-worker]', 'message received from main: ', messageFromMain);   // todo(pibe2): for debugging; remove
    postMessage(new RenderingResult(messageFromMain.data.taskId, `response for request: ${JSON.stringify(messageFromMain.data.assemblyDto)}`));
};


/**
 * 
 * @param {AssemblyDto} assemblyDto 
 */
function handleMessage(assemblyDto) {
    if (assemblyDto.type === AssemblyTypes.FRAME) {
        const extent = assemblyDto.extent;
        return BiPolygon.fromVectorObject(extent.x, extent.y, extent.z, assemblyDto.center, assemblyDto.normal, assemblyDto.biPolyNorm);
    }
}
