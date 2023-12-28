class RenderingTask {
    constructor(taskId, task) {
        this.taskId = taskId;
        this.task = task;
    }
}

class RenderingResult {
    constructor(taskId, result) {
        this.taskId = taskId;
        this.result = result;
    }
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
                const [taskResolver, taskRejecter] = this.taskResolvers.get(taskId);
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
     * @param {RenderingTask} task 
     * @returns {Promise<RenderingResult>}
     */
    submit3dModelTask(task) {
        let resolver, rejecter;
        const taskResultPromise = new Promise((resolve, reject) => {
            resolver = resolve;
            rejecter = reject;
        });

        const taskId = Math.floor(Math.random() * 1000000000000000); 
        this.taskResolvers.set(taskId, [resolver, rejecter]);

        this.webWorker.postMessage(new RenderingTask(taskId, task));
        return taskResultPromise;
    }

}

module.exports = {RenderingExecutor, RenderingTask, RenderingResult}