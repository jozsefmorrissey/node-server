require('../../../../public/js/utils/utils.js');
// require('../../app-src/objects/assembly/init-assem.js');
// require('../../app-src/objects/joint/init.js');
// require('../../app-src/config/properties.js');
// const Cabinet = require('../../app-src/objects/assembly/assemblies/cabinet.js')
// const CabinetLayouts = require('../../app-src/config/cabinet-layouts.js');
// const Polygon3D = require('../../three-d/objects/polygon.js');

const BiPolygon = require("../../app-src/three-d/objects/bi-polygon");
const { RenderingTask, RenderingResult, AssemblyDto, AssemblyTypes, DtoUtil, BiPolygonDto } = require("../shared/web-worker-models");


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
    const result = handleMessage(messageFromMain.data.assemblyDto);
    console.log('[worker] result: ', result);
    postMessage(new RenderingResult(messageFromMain.data.taskId, result));
};


/**
 * 
 * @param {AssemblyDto} assemblyDto 
 * @returns {BiPolygonDto}
 */
function handleMessage(assemblyDto) {
    console.log(assemblyDto);
    switch (assemblyDto.type) {
        case (AssemblyTypes.FRAME):
        case (AssemblyTypes.PANEL): {
            const extent = assemblyDto.extent;
            const vectorBasis = assemblyDto.normals;
            const biPoly = BiPolygon.fromVectorObject(
                extent.x, extent.y, extent.z,
                DtoUtil.toVertex3d(assemblyDto.center),
                {
                    x: DtoUtil.toVector3d(vectorBasis.i),
                    y: DtoUtil.toVector3d(vectorBasis.j),
                    z: DtoUtil.toVector3d(vectorBasis.k)
                },
                DtoUtil.toVector3d(assemblyDto.biPolyNorm)
            );
            return DtoUtil.toBiPolygonDto(biPoly);
        }
        default:
            throw new Error(`Unsupported assembly type ${assemblyDto.type}`);
    }
}
