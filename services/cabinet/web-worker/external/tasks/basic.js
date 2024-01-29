
const STATUS = require('./status');
const WebWorkerDeligator = require('../deligator.js');

class Task {
  constructor() {
    let _status = STATUS.EXICUTE;
    let _error = null;
    CustomEvent.all(this, 'complete', 'failed', 'message', 'exicute', 'pending', 'initiate', 'change');
    this.id = String.random();
    this.finished = () => _status === STATUS.COMPLETE || _status === STATUS.FAILED;
    this.status = (status) => {
      if (this.finished()) return _status;
      if (status && status !== _status) {
        _status = status;
        this.trigger[_status](this);
        this.trigger.change(this);
      }
      return _status;
    }
    this.error = (error) => {
      if (error instanceof Error) {
        _error = error;
        this.status(STATUS.FAILED);
      }
      return _error;
    }
  }
}

class ParrelleTask extends Task {
  constructor(...tasks) {
    super();
    const completed = [];
    let hasFailed = false;
    this.on
    this.completed = completed.map((v, i) => v === true ? tasks[i] : null);
    this.failed = completed.map((v, i) => v === false ? tasks[i] : null);
    this.error = () => tasks.map(t => t.error()).filter(e => e);

    tasks.forEach((t, i) => t.on.complete(() => {
      completed[i] = true;
      this.trigger.change(this);
    }));
    tasks.forEach((t, i) => t.on.failed(() => {
      completed[i] = false;
      this.trigger.change(this);
    }));
    this.on.initiate(() => {
      this.status(STATUS.PENDING);
      WebWorkerDeligator.queue(tasks);
    });

    this.status(STATUS.INITIATE);
  }
}

class SequentialTask extends Task {
  constructor(...tasks) {
    super();
    const completed = tasks.map(t => null);
    this.tasks = () => tasks;
    this.tasksFinished = () => completed.find(v => v === null) === undefined;
    this.completed = () => tasks.map((v,i) => completed[i] === true && v).filter(a => a);
    this.failed = () => tasks.map((v,i) => completed[i] === false && v).filter(a => a);
    this.error = () =>
      tasks.map(t => t.error()).filter(e => e)[0];

    tasks.forEach((t, i) => t.on.complete(() => {
      completed[i] = true;
      this.trigger.change(this);
      if(this.status() === STATUS.PENDING && i < tasks.length - 1) WebWorkerDeligator.queue(tasks[i+1]);
    }));
    tasks.forEach((t, i) => t.on.failed(() => {
      completed[i] = false;
      this.trigger.change(this);
    }));
    this.on.initiate(() => {
      this.status(STATUS.PENDING);
      WebWorkerDeligator.queue(tasks[0]);
    });


    this.status(STATUS.INITIATE);
  }
}


class AndTask extends ParrelleTask {
  constructor(...tasks) {
    super(...tasks);
    this.on.change(() => {
      if (this.status() === STATUS.PENDING && this.tasksFinished()) {
        if (this.failed().length === 0) this.status(STATUS.COMPLETE);
        else this.status(STATUS.FAILED);
      }
    });
  }
}

class AndShortCircutTask extends SequentialTask {
  constructor(...tasks) {
    super(...tasks);
    this.on.change(() => {
      if (this.status() === STATUS.PENDING) {
        if (this.completed().length === tasks.length) this.status(STATUS.COMPLETE);
        else if (this.failed().length > 0) this.status(STATUS.FAILED);
      }
    });
  }
}

class OrTask extends Task {
  constructor(...tasks) {
    super(...tasks);
    this.on.change(() => {
      if (this.status() === STATUS.PENDING && this.tasksFinished()) {
        if (this.completed().length > 0) this.status(STATUS.COMPLETE);
        else this.status(STATUS.FAILED);
      }
    });
  }
}

class OrShortCircutTask extends Task {
  constructor(...tasks) {
    this.on.change(() => {
      if (this.status() === STATUS.PENDING) {
        if (this.completed().length > 0) this.status(STATUS.COMPLETE);
        else if (this.failed().length === tasks.length) this.status(STATUS.FAILED);
      }
    });
  }
}

OrTask.ShortCircut = OrShortCircutTask;
AndTask.ShortCircut = AndShortCircutTask;
module.exports = {
  Task,
  Parrelle: AndTask,
  Sequential: AndShortCircutTask,
  And: AndTask,
  Or: OrTask
}
