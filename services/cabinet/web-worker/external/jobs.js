
const {Parrelle, Sequential, And, Or} = require('./tasks/basic.js');
const ModelInfo = require('./model-information');
const WebWorkerDeligator = require('./deligator');
const {Intersection, Join, Model, Union} = require('./tasks/csg');

class Job {
  constructor(task) {
    CustomEvent.all(this, 'complete', 'failed');
    this.queue = () => WebWorkerDeligator.queue(task);
    this.then = (onComplete, onFailed) => {
      this.on.complete(onComplete);
      this.on.failed(onFailed);
      return this;
    }
  }
}

class CSGJob extends Job {
  constructor(modelInfo, ...tasks) {
    const task = new Sequential(...tasks);
    super(task);
    task.on.complete((...args) => this.trigger.complete(modelInfo, ...args));
    task.on.failed((...args) => this.trigger.failed(...args));
  }
}

class CsgModelJob extends CSGJob {
  constructor(assemblyOs, partsOnly) {
    if (partsOnly !== false) partsOnly = true;
    const modelInfo = ModelInfo.object(assemblyOs, {partsOnly, modelAttribute: 'model'});
    super(modelInfo, new Model(modelInfo), new Union(modelInfo));
  }
}

class CsgJoinJob extends CSGJob {
  constructor(assemblyOs) {
    const modelInfo = ModelInfo.object(assemblyOs);
    super(modelInfo, new Model(modelInfo), new Join(modelInfo), new Union(modelInfo));
  }
}

class CsgIntersectionJob extends CSGJob {
  constructor(assemblyOs) {
    const modelInfo = ModelInfo.object(assemblyOs);
    super(modelInfo, new Model(modelInfo),  new Join(modelInfo), new Intersection(modelInfo), new Union(modelInfo));
  }
}

module.exports = {
  CSG: {
    Model: CsgModelJob,
    Intersection: CsgIntersectionJob,
    Join: CsgJoinJob
  }
}
