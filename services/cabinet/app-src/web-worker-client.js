class RenderingRequest {
    constructor(taskId, body) {
        this.taskId = taskId;
        this.body = body;
    }
}

class RenderingResponse {
    constructor(taskId, body) {
        this.taskId = taskId;
        this.body = body;
    }
}

class RenderingExecutor {

    /**
     * @param {Worker} webWorker 
     */
    constructor(webWorker) {
        this.taskResolvers = new Map();
        this.webWorker = webWorker;

        webWorker.onmessage = (messageFromWorker) => {
            const taskId = messageFromWorker.data.taskId;
            if (this.taskResolvers.has(taskId)) {
                console.debug(`Received worker's response for task ${taskId}. Resolving.`);
                const [taskResolver, taskRejecter] = this.taskResolvers.get(taskId);
                taskResolver(messageFromWorker.data.body);
            }
            else {
                console.warn('Cannot find associated task for webworker message. Doing nothing.', messageFromWorker);
            }
            
            console.log('main-thread', 'message received from worker:', messageFromWorker);
        };

    }

    submit3dModelTask(task) {
        let resolver, rejecter;
        const taskResultPromise = new Promise((resolve, reject) => {
            resolver = resolve;
            rejecter = reject;
        });


        const taskId = Math.floor(Math.random() * 1000000000000000); 
        this.taskResolvers.set(taskId, [resolver, rejecter]);

        this.webWorker.postMessage(new RenderingRequest(taskId, task));
        return taskResultPromise;
    }

}

module.exports = {RenderingExecutor, RenderingRequest, RenderingResponse}