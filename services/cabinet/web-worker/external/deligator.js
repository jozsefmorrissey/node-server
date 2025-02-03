
const DTO = require('./data-transfer-object.js');
const TASK_STATUS = require('./tasks/status');
const {Parrelle, Sequential} = require('./tasks/basic.js');
const RDTO = require('../shared/reconnect-transfer-object.js');

const DID_NOT_COMPLETE = new Error('Task did not complete, can set completeOnFinish to true to avoid error');

const maxWorkers = 20;
class WebWorkerDeligator {
  constructor() {
    const allTasks = {};
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
        task.progress(data.progress);
        if (data.result instanceof Error) {
          console.error(data.result);
          task.error(data.result);
          return;
        }
        const result = data && data.result ? RDTO(data.result) : undefined;
        if (data && data.result) {
          task.trigger.message(result);
          if (task.status() === TASK_STATUS.SUCCESS) {
            exicute();
          }
        }

        if (data.finished) {
          if (task.completeOnFinish) task.status(TASK_STATUS.SUCCESS, result);
          else if (!task.finished()) task.error(DID_NOT_COMPLETE, result);
          exicute();
        }
      }
      else {
        console.warn('[main] Cannot find associated task for webworker message. Doing nothing.', messageFromWorker);
      }
    };

    function createWorkers() {
      const count = navigator.hardwareConcurrency + 1 < maxWorkers ?
          navigator.hardwareConcurrency + 1 : maxWorkers;
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
      task.status(TASK_STATUS.PENDING);
      if (!primary) task.status(TASK_STATUS.PROCESSING);
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
        task.status(task.exicution());
        if (task.status() === TASK_STATUS.INITIATE) {
          task.status(TASK_STATUS.PENDING);
        } else {
          const isSequential = task.process() === 'sequential';
          const worker = workers[Math.floor(Math.random() * workers.length)];
          if (task.status() === TASK_STATUS.EXICUTE) {
            const msg = DTO(task);
            worker.postMessage(msg);
            registerTask(worker)(task);
            task.initiated = new Date().getTime();
            task.status(TASK_STATUS.PROCESSING);
          }
        }
      }
    }

    function queueTask(task) {
      const status = task.status();
      if (task.status().lessThan(TASK_STATUS.QUEUED)) {
        task.status(TASK_STATUS.QUEUED);
        taskQue.push(task);
      }
    }

    this.queue = (taskOs) => {
      if (taskOs instanceof Parrelle) {
        taskOs.status(TASK_STATUS.PENDING);
        taskOs.tasks().forEach(t => this.queue(t));
      } else if (taskOs instanceof Sequential.Seperate) {
        taskOs.status(TASK_STATUS.PENDING);
        taskOs.status(TASK_STATUS.PROCESSING);
        const tasks = taskOs.tasks();
        let index = 0;
        const exc = () => {
          const task = tasks[index++];
          if (task) {
            task.on.success(() => exc());
            this.queue(task);
            exicute();
          }
        };
        exc();
      } else {
        if (Array.isArray(taskOs)) tasksOs.forEach(t => queueTask(t));
        else queueTask(taskOs);

        if (Array.isArray(taskOs)) {
          taskOs.forEach(allTasks[t.id] = true);
        } else {
          allTasks[taskOs.id] = true;
        }
        exicute();
      }
    }
  }
}

module.exports = new WebWorkerDeligator();
