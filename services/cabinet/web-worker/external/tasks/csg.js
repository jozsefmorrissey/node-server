
const {Task, Sequential} = require('./basic');
const STATUS = require('./status');

class CsgSimpleTask extends Task {
  constructor(objectOobjects) {
    const isArray = Array.isArray(objectOobjects);
    const objects = isArray ? objectOobjects : [objectOobjects];
    super();
    let _result;
    this.result = () => _result;
    this.process = () => 'simple';
    this.payload = () => ({objects});
    this.on.message((result) => {
      _result = isArray ? result.map(o => CSG.fromPolygons(o.polygons)) :
          CSG.fromPolygons(result[0].polygons, true);
      this.status(STATUS.SUCCESS, _result);
    });
  }
}

class CsgSimpleTo2DTask extends Task {
  constructor(objectOs) {
    const isArray = Array.isArray(objectOs);
    const objects = isArray ? objectOs : [objectOs];
    super();
    let _result;
    this.result = () => _result;
    this.process = () => 'simpleto2d';
    this.payload = () => ({objects});
    this.on.message((result) => {
      _result = isArray ? result : result[objects[0].id];
      this.status(STATUS.SUCCESS, _result);
    });
  }
}

class CsgTask extends Task {
  constructor(modelInfo) {
    super();
    let initialModelCount;
    this.completeOnFinish = true;
    Object.getSet(this, 'payload', 'process');
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
    let _result;
    this.result = () => _result;
    this.modelInfo = () => modelInfo;
    this.on.message((result) => {
      if (initialModelCount === undefined) initialModelCount = this.remainingModels().length;
      if (result  && this.processResult) {
        result = this.processResult(result) || result;
      }
      if (result) _result = result;
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
    this.processResult = (result) => {
      if (result) modelInfo.joinedMap(result);
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
    this.progress = () => this.status() === STATUS.SUCCESS ? 100 : 0;
    this.processResult = (result) =>
      modelInfo.unioned.set(result);
    this.result = () => modelInfo;
  }
}

class CsgAssembliesTo2DTask extends CsgTask {
  constructor(modelInfo) {
    super(modelInfo);
    this.remainingModels = modelInfo.needs2dConverted;

    this.processResult = (result) => {
      if (result.map)  {
        modelInfo.threeViewMap(result.map);
        Object.keys(result.map).map(id => result[id] = modelInfo.threeView(id));
        delete result.map;
      }
      return result;
    };
  }
}

class CsgThreeViewTask extends Task {
  constructor(csgOgetter, normals) {
    super();
    this.process = () => 'threeview';
    this.payload = () =>({normals, csg:
          csgOgetter instanceof Function ? csgOgetter() : csgOgetter});
  }
}


const AssembliesTo2D = (modelInfo, union) => {
  const tasks = [new CsgModelTask(modelInfo)];
  tasks.push(new CsgJoinTask(modelInfo));
  if (union) tasks.push(new CsgUnionTask(modelInfo));
  tasks.push(new CsgAssembliesTo2DTask(modelInfo));
  return new Sequential(modelInfo.environment, ...tasks);
};

class LayoutPartsTask extends Task {
  constructor(group, boxFunction) {
    super();
    const layout = group.room().layout();
    this.process = () => 'layoutParts';
    let _result;
    this.result = () => _result;
    this.group = () => group;
    this.completeOnFinish = true;
    this.payload = () =>
      ({layout, boxMap: boxFunction()});
    this.progress = () => this.status() === 'success' ? 100 : 0;
    this.on.message((result) => {
      if (result !== undefined) _result = result;
    });
  }
}


module.exports = {
  Intersection: (modelInfo, envDefined) => new Sequential(envDefined ? null : modelInfo.environment,
                                        new CsgModelTask(modelInfo),
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
  Simple: (objects) => new CsgSimpleTask(objects),
  LayoutParts: LayoutPartsTask,
  ThreeView: CsgThreeViewTask
}
