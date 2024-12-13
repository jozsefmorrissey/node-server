
class TaskStatus extends String {
  constructor(desc, stage) {
    super(desc);
    this.toString = () => desc;
    this.stage = () => stage;
    this.lessThan = (other) => this.failure() ? false : stage < other.stage();
    this.greaterThan = (other) => this.failure() ? false : stage > other.stage();
    this.failure = () => stage < 0;
  }
}


module.exports = {
  FAILED: new TaskStatus('failed', -1),
  CREATED: new TaskStatus('created', 0),
  QUEUED: new TaskStatus('queued', 1),
  // So far only used for parrelle tasks, indicates to deligator that it is
  // a sudo task and is not to be actually exicuted
  INITIATE: new TaskStatus('initiate', 2),
  EXICUTE: new TaskStatus('exicute', 2),

  PENDING: new TaskStatus('pending', 3),
  PROCESSING: new TaskStatus('processing', 3),
  SUCCESS: new TaskStatus('success', 4),
};
