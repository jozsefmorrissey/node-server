
const ModelInfo = require('../services/model-information');
const WebWorkerDeligator = require('./deligator');

class Task {
  constructor(payload, onComplete, ...subsequentTasks) {
    CustomEvent.all(this, 'complete', 'failure');
    this.id = String.random();
    this.payload = () => payload;
    if (onComplete instanceof Task) subsequentTasks = [onComplete].concat(subsequentTasks);
    else this.on.complete(onComplete);
    this.subsequentTasks = () => subsequentTasks;
    this.queue = () => WebWorkerDeligator.queue(this);
    this.workAlreadyCompleted = () => false;
  }
}
Task.processResult = d => d;

class CsgSnapShotTask extends Task {
  constructor(modelInfo, onComplete, props) {
    super(modelInfo, onComplete);

    this.payload = () => modelInfo.joinModels();
    this.payload = () => {
      return {
        assemblies: modelInfo.slicedModels(),
        environment: modelInfo.environment()
      };
    };
    this.processResult = (result) => {
      if (result) modelInfo.joinedModels(result);
      return modelInfo;
    }
    this.workAlreadyCompleted = (payload) => payload.assemblies.length === 0;
  }
}

const snapShotTaskSize = 15;
class CsgJoinTask extends Task {
  constructor(modelInfo, onComplete, props) {
    if (props.snapShot) super(modelInfo, null, new CsgSnapShotTask(modelInfo, onComplete, props));
    else super(modelInfo, onComplete);
    this.payload = () => modelInfo.joinModels();
    this.payload = () => {
      return {
        assemblies: modelInfo.joinModels(),
        environment: modelInfo.environment()
      };
    };
    this.processResult = (result) => {
      if (result) modelInfo.joinedModels(result);
      return modelInfo;
    }
    this.workAlreadyCompleted = (payload) => payload.assemblies.length === 0;
  }
}

class CsgBuildTask  extends Task {
  constructor(assemblyOs, onComplete, props) {
    props ||= {};
    const modelInfo = ModelInfo.object(assemblyOs, props);
    if (props.doNotJoin) super(modelInfo, onComplete);
    else super(modelInfo, null, new CsgJoinTask(modelInfo, onComplete, props));
    this.payload = () => {
      return {
          assemblies: modelInfo.buildModels(),
          environment: modelInfo.environment()
        };
      };
    this.processResult = (result) => {
      if (result) modelInfo.modelInfos(result);
      return modelInfo;
    }
    this.workAlreadyCompleted = (payload) => payload.assemblies.length === 0;
  }
}

module.exports = CsgBuildTask;
