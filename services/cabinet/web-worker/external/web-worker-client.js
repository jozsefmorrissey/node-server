const Panel = require("../../app-src/objects/assembly/assemblies/panel");
const Frame = require("../../app-src/objects/assembly/assemblies/frame");
const { VectorDto, AssemblyDto, AssemblyTypes, RenderingTask, RenderingResult, DtoUtil } = require("../shared/web-worker-models");


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
                console.debug(`[main] Received worker's response for task ${taskId}. Resolving.`);
                const [taskResolver, _] = this.taskResolvers.get(taskId);
                taskResolver(messageFromWorker.data.result);
                this.taskResolvers.delete(taskId);
            }
            else {
                console.warn('[main] Cannot find associated task for webworker message. Doing nothing.', messageFromWorker);
            }

            console.log('[main] message received from worker:', messageFromWorker);
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
        console.log('[main] submitting task to webworker: ', task);  // todo(pibe2): for debugging; remove
        this.webWorker.postMessage(task);
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
            DtoUtil.toVectorDto(current.center),
            DtoUtil.toVectorDto(current.demension),
            DtoUtil.toVectorBasisDto(current.normals),
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