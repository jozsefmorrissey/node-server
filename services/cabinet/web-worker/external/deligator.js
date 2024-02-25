
const DTO = require('./data-transfer-object.js');
const TASK_STATUS = require('./tasks/status');

const maxWorkers = 20;
class WebWorkerDeligator {
  constructor() {
    const taskQue = [];
    const taskWorkerMap = {};
    const tasksUndertaken = [];
    const workers = [];
    const instance = this;

    const webWorkerOnmessage = (messageFromWorker) => {
      const data = messageFromWorker.data;
      const taskObj = taskWorkerMap[data.id];
      if (taskObj) {
        const {task, workerIndex} = taskObj;
        if (data.finished) {
          if (task.completeOnFinish) tast.status(TASK_STATUS.COMPLETED);
          else if (!task.finished()) task.status(TASK_STATUS.FAILED);
        } else if (data.result instanceof Error) {
          task.error(data.result);
        } else {
          task.trigger.message(data && data.result);
          if (task.status() === TASK_STATUS.COMPLETED) {
            tasksUndertaken[workerIndex].remove(task);
          }
        }
      }
      else {
        console.warn('[main] Cannot find associated task for webworker message. Doing nothing.', messageFromWorker);
      }
    };

    function createWorkers() {
      const count = navigator.hardwareConcurrency < maxWorkers ?
          navigator.hardwareConcurrency : maxWorkers;
      for (let index = 0; index < count; index++) {
        const worker = new Worker('/cabinet/js/web-worker-bundle.js');
        worker.onmessage = webWorkerOnmessage;
        workers.push(worker);
        tasksUndertaken[index] = [];
      }
    }
    createWorkers();

  const registerTask = (workerIndex) => (task) => {
    const isSequential = task.process() === 'sequential';
    if (isSequential) task.tasks().forEach(registerTask(workerIndex));
    else {
      taskWorkerMap[task.id] = {task, workerIndex};
      task.status(TASK_STATUS.PENDING);
    }
  }

  function exicute() {
    while (0 < taskQue.length && workers.length > 0) {
        const task = taskQue.splice(0,1)[0];
        if (task.status() === TASK_STATUS.INITIATE) {
          task.trigger.initiate();
        }
        const isSequential = task.process() === 'sequential';
        const payload = task.payload ? task.payload() : null;
        const workerIndex = tasksUndertaken.minIndex(l => l.length);
        const worker = workers[workerIndex];
        tasksUndertaken[workerIndex].push(task);
        if (task.status() === TASK_STATUS.EXICUTE) {
          const msg = DTO(task);
          worker.postMessage(msg);
        }
        registerTask(workerIndex)(task);
        task.initiated = new Date().getTime();
      }
    }

    this.queue = (taskOs) => {
      if (Array.isArray(taskOs)) taskQue.concatInPlace(taskOs);
      else taskQue.push(taskOs);
      exicute();
    }
  }
}

module.exports = new WebWorkerDeligator();
