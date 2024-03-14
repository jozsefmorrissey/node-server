
const DTO = require('./data-transfer-object.js');
const TASK_STATUS = require('./tasks/status');
const {Parrelle} = require('./tasks/basic.js');

const maxWorkers = 20;
class WebWorkerDeligator {
  constructor() {
    const taskQue = [];
    const taskWorkerMap = {};
    const workers = [];
    const primaryTasks = [];
    const instance = this;

    const webWorkerOnmessage = (messageFromWorker) => {
      const data = messageFromWorker.data;
      const taskObj = taskWorkerMap[data.id];
      if (taskObj) {
        const {task, worker, primary} = taskObj;
        if (data.result instanceof Error) {
          task.error(data.result);
        } else if (data.finished) {
          if (task.completeOnFinish) task.status(TASK_STATUS.SUCCESS);
          else if (!task.finished()) task.status(TASK_STATUS.FAILED);
          exicute();
        } else {
          task.trigger.message(data && data.result);
          if (task.status() === TASK_STATUS.SUCCESS) {
            exicute();
          }
        }
      }
      else {
        console.warn('[main] Cannot find associated task for webworker message. Doing nothing.', messageFromWorker);
      }
    };

    function createWorkers() {
      const count = navigator.hardwareConcurrency - 1 < maxWorkers ?
          navigator.hardwareConcurrency - 1 : maxWorkers;
      for (let index = 0; index < count; index++) {
        const worker = new Worker('/cabinet/js/web-worker-bundle.js');
        worker.id = index;
        worker.onmessage = webWorkerOnmessage;
        primaryTasks[worker.id] = [];
        workers.push(worker);
      }
    }
    createWorkers();

  const registerTask = (worker, secondary) => (task) => {
    const primary = secondary !== true;
    if (primary)primaryTasks[worker.id].push(task);
    const isSequential = task.process() === 'sequential';
    if (isSequential) {
      if (primary)
        task.on.finished(() =>
            workers.push(worker) & primaryTasks[worker.id].remove(task) & exicute());
      task.tasks().forEach(registerTask(worker, true));
    }
    else {
      taskWorkerMap[task.id] = {task, worker};
      if (primary)
        task.on.finished(() =>
            workers.push(worker) & primaryTasks[worker.id].remove(task) & exicute());
      if (primaryTasks[worker.id].length >= 1) workers.remove(worker);
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
        const worker = workers[Math.floor(Math.random() * workers.length)];
        if (task.status() === TASK_STATUS.EXICUTE) {
          const msg = DTO(task);
          worker.postMessage(msg);
        }
        registerTask(worker)(task);
        task.initiated = new Date().getTime();
      }
    }

    this.queue = (taskOs) => {
      if (taskOs instanceof Parrelle) {
        taskOs.status(TASK_STATUS.PENDING);
        taskOs.tasks().forEach(t => this.queue(t));
      } else {
        if (Array.isArray(taskOs)) taskQue.concatInPlace(taskOs);
        else taskQue.push(taskOs);
        exicute();
      }
    }
  }
}

module.exports = new WebWorkerDeligator();
