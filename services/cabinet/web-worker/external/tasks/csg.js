
const {Task} = require('./basic');
const STATUS = require('./status');


class CsgTask extends Task {
  constructor(modelInfo) {
    super();
    this.payload = () => {
      if (this.finished()) return null;
      const assemblies = this.remainingModels();
      const environment = modelInfo.environment();
      if (assemblies.length === 0) this.status(STATUS.COMPLETE);
      return {assemblies, environment};
    };
    this.on.message((result) => {
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
    this.processResult = (result) => {
      if (result.type === 'model') modelInfo.modelMap(result.map);
      else if (result.type === 'biPolygon') modelInfo.biPolygonArrayMap(result.map);
      else console.warn(`Unkown result:`, result);
    }
  }
}

class CsgJoinTask extends CsgTask {
  constructor(modelInfo) {
    super(modelInfo);
    this.remainingModels = modelInfo.needsJoined;
    this.processResult = (result) => {
      if (result.type === 'joined') modelInfo.joinedMap(result.map);
      else if (result.type === 'intersection') modelInfo.intersectionMap(result.map);
      else console.warn(`Unkown result:`, result);
    }
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
    this.processResult = modelInfo.unioned;
  }
}

class SortModelInfoTask extends CsgTask {
  constructor(modelInfo) {
    super(modelInfo);
    this.remainingModels = (result) => {
      throw new Error('implement dummy');
    };
    this.processResult = (result) => {
      throw new Error('implement dummy');
    }
  }
}

module.exports = {
  Intersection: CsgIntersectionTask,
  Join: CsgJoinTask,
  Model: CsgModelTask,
  Union: CsgUnionTask
}
