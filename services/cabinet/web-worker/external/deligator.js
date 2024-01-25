
const MDTO = require('../services/modeling/modeling-data-transfer-object.js');

class TaskMessage {
  constructor(task, payload) {
    this.id = task.id;
    this.payload = MDTO.to(payload);
    this.type = task.constructor.name;
  }
}

const maxWorkers = 10;
class WebWorkerDeligator {
  constructor() {
    const taskQue = [];
    const tasksUndertaken = {};
    const availibleWebWorkers = [];
    const instance = this;

    function taskCompleted(task, data) {
      task.trigger.complete(task.processResult(data && data.result));
      const sqTasks = task.subsequentTasks();
      for (let index = 0; index < sqTasks.length; index++) {
        sqTasks[index].queue();
      }
      delete tasksUndertaken[task.id];
    }

    const webWorkerOnmessage = (messageFromWorker) => {
      const data = messageFromWorker.data;
      const taskObj = tasksUndertaken[data.id];
      if (taskObj) {
        const {task, worker} = taskObj;
        availibleWebWorkers.push(worker);
        taskCompleted(task, data);
      }
      else {
        console.warn('[main] Cannot find associated task for webworker message. Doing nothing.', messageFromWorker);
      }
    };

    function createWorkers() {
      const count = navigator.hardwareConcurrency - 1 < maxWorkers ?
          navigator.hardwareConcurrency : maxWorkers;
      for (let index = 0; index < count; index++) {
        const worker = new Worker('/cabinet/js/web-worker-bundle.js');
        worker.onmessage = webWorkerOnmessage;
        availibleWebWorkers.push(worker);
      }
    }
    createWorkers();


    function exicute() {
    while (0 < taskQue.length && availibleWebWorkers.length > 0) {
        const task = taskQue.splice(0,1)[0];
        const worker = availibleWebWorkers.splice(0,1)[0];
        tasksUndertaken[task.id] = {worker, task};
        const payload = task.payload();
        if (task.workAlreadyCompleted(payload)) taskCompleted(task, null);
        else worker.postMessage(new TaskMessage(task, payload));
        task.initiated = new Date().getTime();
      }
    }

    this.queue = (task) => {
      taskQue.push(task);
      exicute();
    }
  }
}

module.exports = new WebWorkerDeligator();
