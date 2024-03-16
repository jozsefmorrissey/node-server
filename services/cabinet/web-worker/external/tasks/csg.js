
const {Task, Sequential} = require('./basic');
const STATUS = require('./status');

class CsgSimpleTask extends Task {
  constructor(objects) {
    super();
    let _result;
    this.result = () => _result;
    this.process = () => 'simple';
    this.payload = () => ({objects});
    this.on.message((result) => {
      _result = result;
      this.status(STATUS.SUCCESS, _result);
    });
  }
}

class CsgSimpleTo2DTask extends Task {
  constructor(objects) {
    super();
    let _result;
    this.result = () => _result;
    this.process = () => 'simpleto2d';
    this.payload = () => ({objects});
    this.on.message((result) => {
      _result = result;
      this.status(STATUS.SUCCESS, _result);
    });
  }
}

class CsgTask extends Task {
  constructor(modelInfo) {
    super();
    let initialModelCount;
    this.completeOnFinish = true;
    this.process = () => this.constructor.name.replace(/^Csg(.{1,})Task/, "$1").toLowerCase();
    this.progress = () => this.completeOnFinish ? (this.status() === STATUS.SUCCESS ? 100 : 0) :
          (initialModelCount === 0 ? 100 :
          Math.floor(100*(1 - (this.remainingModels().length/initialModelCount))) || 0);
    this.payload = () => {
      if (this.finished()) return null;
      const assemblies = this.remainingModels();
      if (assemblies.length === 0) this.status(STATUS.SUCCESS);
      return {assemblies};
    };
    this.modelInfo = () => modelInfo;
    this.on.message((result) => {
      if (initialModelCount === undefined) initialModelCount = this.remainingModels().length;
      if (result) this.processResult(result);
      this.payload();
      return modelInfo;
    });
  }
}

class CsgOrderModelTask  extends CsgTask {
  constructor(modelInfo) {
    super(modelInfo);
    this.remainingModels = modelInfo.needsModeled;
  }
}

class CsgJoinTask extends CsgTask {
  constructor(modelInfo) {
    super(modelInfo);
    this.remainingModels = modelInfo.needsJoined;
  }
}

class CsgIntersectionTask extends CsgJoinTask {
  constructor(modelInfo) {
    super(modelInfo);
    this.remainingModels = modelInfo.needsIntersected;
  }
}


class CsgModelTask  extends CsgTask {
  constructor(modelInfo) {
    super(modelInfo);
    this.remainingModels = modelInfo.needsModeled;
    this.processResult = (result) => {
      if (result.type === 'model') modelInfo.modelMap(result.map);
      else if (result.type === 'biPolygon') modelInfo.biPolygonArrayMap(result.map);
      else console.warn(`Unkown result:`, result);
    }
  }
}

class CsgUnionTask  extends CsgTask {
  constructor(modelInfo) {
    super(modelInfo);
    this.remainingModels = modelInfo.needsUnioned;
    this.progress = () => this.status() === 'success' ? 100 : 0;
    this.processResult = modelInfo.unioned;
  }
}

class CsgAssembliesTo2DTask extends CsgTask {
  constructor(modelInfo) {
    super(modelInfo);
    this.remainingModels = modelInfo.needs2dConverted;
    this.processResult = (result) => {
      if (result.map)  modelInfo.threeViewMap(result.map);
      else modelInfo.unioned2D(result);
    };
  }
}

const AssembliesTo2D = (modelInfo, joined, unioned) => {
  const tasks = [new CsgModelTask(modelInfo)];
  if (joined) tasks.push(new CsgJoinTask(modelInfo))
  if (unioned) tasks.push(new CsgUnionTask(modelInfo));
  tasks.push(new CsgAssembliesTo2DTask(modelInfo));
  return new Sequential(modelInfo.environment, ...tasks);
};

module.exports = {
  Intersection: (modelInfo, envDefined) => new Sequential(envDefined ? null : modelInfo.environment,
                                        new CsgModelTask(modelInfo),
                                        new CsgJoinTask(modelInfo),
                                        new CsgIntersectionTask(modelInfo),
                                        new CsgUnionTask(modelInfo)),
  Join: (modelInfo, envDefined) => new Sequential(envDefined ? null : modelInfo.environment,
                                        new CsgModelTask(modelInfo),
                                        new CsgJoinTask(modelInfo),
                                        new CsgUnionTask(modelInfo)),
  Model: (modelInfo, envDefined) => new Sequential(envDefined ? null : modelInfo.environment,
                                        new CsgModelTask(modelInfo),
                                        new CsgUnionTask(modelInfo)),
  AssembliesTo2D,
  SimpleTo2D: (objects) => new CsgSimpleTo2DTask(objects),
  Simple: (objects) => new CsgSimpleTask(objects)
}
