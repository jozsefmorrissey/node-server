const { Vector } = require("../../../../public/js/utils/3d-modeling/csg");
const Panel = require("../../app-src/objects/assembly/assemblies/panel");
const Frame = require("../../app-src/objects/assembly/assemblies/frame");
const { VectorDto, AssemblyDto, AssemblyTypes, RenderingTask, RenderingResult, VectorBasisDto } = require("../shared/web-worker-models");



function toVectorDto(v) {
    return new VectorDto(v.x, v.y, v.z);
}

function toVectorBasisDto(normals) {
    console.log('[normals]', normals);
    return new VectorBasisDto(
        new VectorDto(normals.x.i(), normals.x.j(), normals.x.k()),
        new VectorDto(normals.y.i(), normals.y.j(), normals.y.k()),
        new VectorDto(normals.z.i(), normals.z.j(), normals.z.k())
    );
}



class RenderingExecutor {

    /**
     * @param {Worker} webWorker 
     */
    constructor(webWorker) {
        this.taskResolvers = new Map();
        this.webWorker = webWorker;

        /**
         * @param {MessageEvent<RenderingResult>} messageFromWorker 
         */
        webWorker.onmessage = (messageFromWorker) => {
            const taskId = messageFromWorker.data.taskId;
            if (this.taskResolvers.has(taskId)) {
                console.debug(`Received worker's response for task ${taskId}. Resolving.`);
                const [taskResolver, _] = this.taskResolvers.get(taskId);
                taskResolver(messageFromWorker.data.result);
                this.taskResolvers.delete(taskId);
            }
            else {
                console.warn('Cannot find associated task for webworker message. Doing nothing.', messageFromWorker);
            }

            console.log('[main-thread] message received from worker:', messageFromWorker);
        };

    }

    /**
     * @param {AssemblyDto} assembly
     * @returns {Promise<RenderingResult>}
     */
    _submit3dModelTask(assembly) {
        let resolver, rejecter;
        const taskResultPromise = new Promise((resolve, reject) => {
            resolver = resolve;
            rejecter = reject;
        });

        const taskId = Math.floor(Math.random() * 1000000000000000);
        this.taskResolvers.set(taskId, [resolver, rejecter]);

        const task = new RenderingTask(taskId, assembly);
        this.webWorker.postMessage(task);
        console.log('[main-thread]', 'task submitted to webworker: ', task);  // todo(pibe2): for debugging; remove
        return taskResultPromise;
    }

    /**
     * @param {Panel}
     * @returns {Promise<RenderingResult>}
     */
    submitPanelToBipolygonTask(panel) {
        const current = panel.position().current();
        const panelDto = new AssemblyDto(
            AssemblyTypes.PANEL,
            toVectorDto(current.center),
            toVectorDto(current.demension),
            toVectorBasisDto(current.normals),
            new VectorDto(current.biPolyNorm.i(), current.biPolyNorm.j(), current.biPolyNorm.k())
        );
        return this._submit3dModelTask(panelDto);

        /*
        // this needs to run in webworker
        return BiPolygon.fromVectorObject(dimensions.x, dimensions.y, dimensions.z, center, vecObj, panel.biPolyNormVector()); // todo: panel.biPolyNormVector???
        */
    }


    /**
     * @param {Frame}
     * @returns {Promise<RenderingResult>}
     */
    submitFrameToBipolygonTask(frame) {

    }

}

module.exports = { RenderingExecutor }