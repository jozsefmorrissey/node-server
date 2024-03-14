
const STATUS = require('./status');

class Task {
  constructor(initailStatus) {
    let _status;
    let _error = null;
    CustomEvent.all(this, 'finished', 'success', 'failed', 'message', 'exicute', 'pending', 'initiate', 'change');
    this.id = String.random();
    this.process = () => this.constructor.name.replace(/(^.*?)Task$/, '$1').toLowerCase();
    this.finished = () => _status === STATUS.SUCCESS || _status === STATUS.FAILED;
    this.status = (status, data) => {
      if (this.finished()) return _status;
      if (status && status !== _status) {
        _status = status;
        data ||= _status === STATUS.FAILED ? _error : this;
        this.trigger[_status](data, this);
        this.trigger.change(this);
      }
      return _status;
    }
    this.error = (error) => {
      if (error instanceof Error) {
        _error = error;
        this.status(STATUS.FAILED, error);
      }
      return _error;
    }
    this.status(initailStatus || STATUS.EXICUTE);
    this.on.success(this.trigger.finished);
    this.on.failed(this.trigger.finished);
  }
}

class InformationAlreadyAvailible extends Task {
  constructor(result) {
    super();
    this.result = () => result;
    this.progress = () => 100;
    setTimeout(() => this.status(STATUS.SUCCESS, result));
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
    this.result = () => this;

    tasks.forEach((t, i) => t.on.success(() => {
      completed[i] = true;
      this.trigger.change(this.result(), this);
      if (completed.filter(is => is !== true).length === 0) this.status(STATUS.SUCCESS, this.result());
    }));
    tasks.forEach((t, i) => t.on.failed(() => {
      completed[i] = false;
      this.trigger.change(this);
    }));
    tasks.forEach((t, i) => t.on.change((data) => {
      this.trigger.change(data, t, this);
    }));
    this.on.initiate(() => {
      this.status(STATUS.PENDING);
    });
  }
}

class SequentialTask extends Task {
  constructor(environment, ...tasks) {
    super();
    environment ||= () => {};
    const completed = tasks.map(t => null);
    this.process = () => 'sequential';
    this.environment = environment instanceof Function ? environment : () => environment;
    this.payload = () => ({tasks, environment: environment()});
    this.tasks = () => tasks;
    this.completed = () => tasks.map((v,i) => completed[i] === true && v).filter(a => a);
    this.failed = () => tasks.map((v,i) => completed[i] === false && v).filter(a => a);
    this.error = () => tasks.map(t => t.error()).filter(e => e)[0];

    tasks.forEach((t, i) => t.on.change(() => {
      this.trigger.change(t, this);
    }));

    tasks.forEach((t, i) => t.on.success(() => {
      completed[i] = true;
      if (this.completed().length === tasks.length) this.status(STATUS.SUCCESS);
      else if (this.failed().length > 0) this.status(STATUS.FAILED);
      this.trigger.change(this);
    }));
    tasks.forEach((t, i) => t.on.failed((error) => {
      completed[i] = false;
      this.status(STATUS.FAILED, error);
      this.trigger.change(this);
    }));
  }
}

class AndTask extends ParrelleTask {
  constructor(...tasks) {
    super(...tasks);
    this.on.change((result) => {
      if (this.status() === STATUS.PENDING && this.tasks.finished()) {
        if (this.failed().length === 0) this.status(STATUS.SUCCESS, result);
        else this.status(STATUS.FAILED, this.error());
      }
    });
  }
}

class AndShortCircutTask extends SequentialTask {
  constructor(environment, ...tasks) {
    super(environment, ...tasks);
    this.on.change(() => {
      if (this.status() === STATUS.PENDING) {
        if (this.completed().length === tasks.length) this.status(STATUS.SUCCESS);
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
        if (this.completed().length > 0) this.status(STATUS.SUCCESS);
        else this.status(STATUS.FAILED);
      }
    });
  }
}

class OrShortCircutTask extends Task {
  constructor(...tasks) {
    this.on.change(() => {
      if (this.status() === STATUS.PENDING) {
        if (this.completed().length > 0) this.status(STATUS.SUCCESS);
        else if (this.failed().length === tasks.length) this.status(STATUS.FAILED);
      }
    });
  }
}

OrTask.ShortCircut = OrShortCircutTask;
AndTask.ShortCircut = AndShortCircutTask;
module.exports = {
  Task,
  InfoAvailible: InformationAlreadyAvailible,
  Parrelle: AndTask,
  Sequential: AndShortCircutTask,
  And: AndTask,
  Or: OrTask
}
