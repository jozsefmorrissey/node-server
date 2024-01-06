const { Vector } = require("../../../public/js/utils/3d-modeling/csg");
const Panel = require("./objects/assembly/assemblies/panel");
const Frame = require("./objects/assembly/assemblies/frame");
const { AssemblyDto, AssemblyTypes, RenderingTask, RenderingResult } = require("./web-worker-models");


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
        const current = panel.current();
        const panelDto = new AssemblyDto(
            AssemblyTypes.PANEL,
            new Vector(current.center),
            new Vector(current.demension),
            new Vector(current.normals),
            new Vector(current.biPolyNormal)
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