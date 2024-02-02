
const STATUS = require('./status');

class Task {
  constructor(initailStatus) {
    let _status = initailStatus || STATUS.EXICUTE;
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
    super(STATUS.INITIATE);
    const completed = tasks.map(t => null);
    let hasFailed = false;
    this.on
    this.process = () => 'parrelle';
    this.tasks = () => tasks;
    this.tasks.finished = () => completed.find(v => v === null) === undefined;
    this.completed = () => tasks.map((v,i) => completed[i] === true && v).filter(a => a);
    this.failed = () => tasks.map((v,i) => completed[i] === false && v).filter(a => a);
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
    });
  }
}

class SequentialTask extends Task {
  constructor(environment, ...tasks) {
    super();
    const completed = tasks.map(t => null);
    this.process = () => 'sequential';
    this.environment = environment instanceof Function ? environment : () => environment;
    this.payload = () => ({tasks, environment: environment()});
    this.tasks = () => tasks;
    this.completed = () => tasks.map((v,i) => completed[i] === true && v).filter(a => a);
    this.failed = () => tasks.map((v,i) => completed[i] === false && v).filter(a => a);
    this.error = () => tasks.map(t => t.error()).filter(e => e)[0];

    tasks.forEach((t, i) => t.on.complete(() => {
      completed[i] = true;
      if (this.completed().length === tasks.length) this.status(STATUS.COMPLETE);
      else if (this.failed().length > 0) this.status(STATUS.FAILED);
      this.trigger.change(this);
    }));
    tasks.forEach((t, i) => t.on.failed(() => {
      completed[i] = false;
      this.status(STATUS.FAILED);
      this.trigger.change(this);
    }));
  }
}

class AndTask extends ParrelleTask {
  constructor(...tasks) {
    super(...tasks);
    this.on.change(() => {
      if (this.status() === STATUS.PENDING && this.tasks.finished()) {
        if (this.failed().length === 0) this.status(STATUS.COMPLETE);
        else this.status(STATUS.FAILED);
      }
    });
  }
}

class AndShortCircutTask extends SequentialTask {
  constructor(environment, ...tasks) {
    super(environment, ...tasks);
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
      if (this.status() === STATUS.PENDING && this.tasks.finished()) {
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
