
const {InfoAvailible, Parrelle, Sequential, And, Or} = require('./tasks/basic.js');
const ModelInfo = require('./model-information');
const WebWorkerDeligator = require('./deligator');
const Cabinet = require('../../app-src/objects/assembly/assemblies/cabinet.js');
const {Intersection, Join, Model, Union, AssembliesTo2D, SimpleTo2D, Simple,
        LayoutParts, ThreeView} = require('./tasks/csg');
const {Parts} = require('./tasks/documentation');
const Utils = require('../../app-src/utils.js');
const Vertex3D = require('../../app-src/three-d/objects/vertex.js');
const SimpleModel = require('../../app-src/objects/simple/simple.js');
const Assembly = require('../../app-src/objects/assembly/assembly.js');
const Panel = require('../../app-src/objects/assembly/assemblies/panel.js');
const PartInformation = require('part-information');
const Imposter = require('../../../../public/js/utils/object/imposter.js');
const STATUS = require('./tasks/status');
const CabinetConfigs = require('../../app-src/config/cabinet-configs.js')

const DEFAULT_JOB_FAILURE = (error, job) =>
    console.error(error, job);

class Job {
  constructor(id) {
    CustomEvent.all(this, ...Object.values(STATUS).map(s => s.toString()).concat(['finished', 'change']));
    let _status = STATUS.CREATED;
    this.status = (status) => {
      if (this.finished()) return _status;
      if (status && status !== _status) {
        _status = status;
        let data = _status === STATUS.SUCCESS ? this.result() :
                  (_status === STATUS.FAILED ? this.error() : this);
        this.trigger[_status](data, this);
        this.trigger.change(this);
      }
      return _status;
    }

    let _error;
    this.finished = () => _status === STATUS.SUCCESS || _status === STATUS.FAILED;
    this.error = (error) => {
      if (_error === undefined && error instanceof Error) {
        _error = error;
        this.finished(true);
      }
      return _error;
    }
    this.then = (onSuccess, onFailed) => {
      this.on.success(onSuccess);
      this.on.failed(onFailed || DEFAULT_JOB_FAILURE);
      return this;
    }
  }
}

Job.resultMap = (jobs, idPath, valuePath) => {
  idPath ||= 'id()';
  valuePath ||= 'result()';
  const resultIdMap = {};
  jobs.forEach(job => {
    const value = job.pathValue(valuePath);
    resultIdMap[job.pathValue(idPath)] = value === undefined ? job.result() : value;
  });
  return resultIdMap;
}

const Registry = new (require('../../../../public/js/utils/collections/Registry.js'))();
const registeredJob = (clazz, id, hash) => {
  const name = clazz.name;
  if (id) {
    const registered = Registry.get(name, id);
    if (registered && registered.hash() === hash) return registered;
    return (job) => Registry.set(job, name, id);
  }
}

class Jobs extends Job {
  constructor(jobs, onJobSuccess, onJobFailure) {
    super();
    this.jobs = () => jobs;
    this.allJobsFinished = () => (jobs.find(j => !j.finished()) === undefined);
    this.result = () => jobs[jobs.length - 1].result();
    this.results = () => jobs.map(j => j.results());

    this.queue = () => {
      const onSuccess = (result, job) =>
          (onJobSuccess instanceof Function && onJobSuccess(result, job)) &
          (!this.finished() && this.allJobsFinished() && this.finished(true));
      onJobFailure ||= (error) => this.error(error);
      for (let index = 0; index < jobs.length; index++) {
        const job = jobs[index];
        job.then(onSuccess, onJobFailure).queue();
      }
      this.trigger.pending();
    }

    this.on.pending(() =>
      jobs.forEach(j => j.trigger.pending()));
  }
}

class TaskJob extends Job {
  constructor(task, id) {
    super(id);
    // CustomEvent.link(this, task);
    task.on.change.status(() =>
      this.status(task.status(), this));
    this.task = () => task;
    this.result = task.result;
    task.on.finished((_result) => {
      if (this.result) {
        const resultDefined = this.result();
        if (resultDefined) _result = resultDefined;
      }
      this.finished(true, _result)
    });

    this.queue = () => {
      setTimeout(() => {
        WebWorkerDeligator.queue(task);
        this.trigger.pending(task);
      });
    }
  }
}

class SimpleModelJob extends TaskJob {
  constructor(simpleObjs) {
    const task = Simple(simpleObjs);
    super(task);
    this.object = () => simpleObjs;
  }
}

class CsgModelInfoJob extends TaskJob {
  constructor(task, modelInfo) {
    super(task);
    this.modelInfo = () => modelInfo;
    this.result = () => task.result ? task.result() : modelInfo;
  }
}

class CsgAssemblies extends TaskJob {
  constructor(cabinets, type) {
    const jobs = cabinets.map(cabinetJobGetter(type));
    const tasks = jobs.map(j => j.task());
    const task = new Parrelle(...tasks);
    super(task);
    this.result = () => Job.resultMap(jobs, 'cabinet().id()');
  }
}

class CsgComplexAssemblies extends CsgAssemblies {
  constructor(cabinets) { super(cabinets, 'complex');}
}

class CsgSimpleAssemblies extends CsgAssemblies {
  constructor(cabinets) { super(cabinets, 'simple');}
}

class CsgBoxOnlyAssemblies extends CsgAssemblies {
  constructor(cabinets) { super(cabinets, 'box');}
}


class CsgAssembliesTo2DJob extends CsgModelInfoJob {
  constructor(assemblyOs) {
    const isArray = Array.isArray(assemblyOs);
    const assemblies = isArray ? assemblyOs : [assemblyOs];
    const modelInfo = ModelInfo.display(assembly);
    const task = AssembliesTo2D(modelInfo);
    const _result = {};
    const taskResult = task.result;
    task.result = () =>  {
      if (isArray) return taskResult();
      else return taskResult()[assemblies[0].id()];
    };
    super(task, modelInfo);
  }
}


class SimpleTo2DJob extends TaskJob {
  constructor(simpleObjs) {
    const task = SimpleTo2D(simpleObjs);
    super(task);
  }
}

class CsgTo2DJob extends Jobs {
  constructor(objects) {
    const split = objects.filterSplit(o => o instanceof Assembly ? 'assemblies' :
          (o instanceof SimpleModel ? 'simpleModels' : 'unkown'));
    if (split.unkown) console.error(`To2D process not configured for "${split.unkown}"`);
    const assembliesJob = new CsgAssembliesTo2DJob(split.assemblies);
    const simpleJob = new SimpleTo2DJob(split.simpleModels);
    const jobs = [assembliesJob, simpleJob];
    const _result = {};
    const onSuccess = (result, job) =>  {
      _result.merge(result);
      if (this.allJobsFinished()) this.finished(true, _result);
    }
    super(jobs, onSuccess);
  }
}

const boxMap = (resultFunc) => () => {
  const result = resultFunc().modelIdMap;
  Object.keys(result).forEach(key => {
    const csgOmodelInfo = result[key];
    const csg = csgOmodelInfo.pathValue('unioned.boxOnly()') || csgOmodelInfo;
    const assembly = Lookup.get(key);
    if (assembly instanceof Assembly) {
      result[key] = Utils.positionAssemblyCsg(csg, assembly);
      result[key].silhouette =
        Utils.positionAssemblyCsg(csgOmodelInfo.unioned.silhouette(), assembly);
      result[key].ASSEMBLY = true;
    }
  });
  return result;
}

class CsgRoomJob extends TaskJob {
  constructor(room, complex) {
    const registered = registeredJob(CsgRoomJob, room.id(), room.hash());
    if (registered instanceof Job) return registered;

    const result = () => ({modelIdMap: Job.resultMap(jobs, 'object().id()'),
                             groupMap: layoutTasks.map(lt => ({group: lt.group(), result: lt.result()})).idMap(o => o.group.id())});
    const modelMap = () => Job.resultMap(jobs, 'object().id()', 'unioned()');
    const {tasks, jobs, groups} = CsgRoomJob.tasksAndJobs(room, complex);
    const layoutTasks = groups.map(g => new LayoutParts(g, boxMap(result)));
    const task = new Sequential.Seperate(new Parrelle(...tasks), new Parrelle(...layoutTasks));
    super(task);
    registered(this);
    this.room = () => room;
    this.jobs = () => jobs;
    this.result = result;
    let _hash;
    this.hash = () => _hash === undefined ? room.hash() : _hash;
    this.task().on.pending((task) => {
      _hash = assembly.hash();
    });

  }
}

CsgRoomJob.tasksAndJobs = (room, complex) => {
  const tasks = [];
  const groups = [];
  const jobs = [];
  for (let i = 0; i < room.groups.length; i++) {
    const group = room.groups[i];
    const groupTasks = [];
    for (let j = 0; j < group.objects.length; j++) {
      const obj = group.objects[j];
      const job = !(obj instanceof  Assembly) ? new SimpleModelJob(obj) :
          (complex ? new CsgAssemblyConstruction(obj) : new CsgAssemblyDisplay(obj));
      jobs.push(job);
      tasks.push(job.task());
      job.trigger.pending(job.task(), job);
    }
    groups.push(group);
  }
  return {tasks, jobs, groups};
}
class CsgSimpleRoomJob extends CsgRoomJob {constructor(room) {super(room, false)}};
class CsgComplexRoomJob extends CsgRoomJob {constructor(room) {super(room, true)}};

CsgRoomJob.task = (room) => CsgRoomJob.tasksAndJobs(room).task;

class PartsDocumentationJob extends TaskJob {
  constructor(assembly) {
    let completeTriggered = false;
    const parts = assembly.modelingCollections();
    const modelInfo = ModelInfo.display(assembly);
    const initialResult = modelInfo.partInformation.finished() ? modelInfo.partInformation : null;
    const task = initialResult ? new InfoAvailible(initialResult) : Parts(modelInfo);
    super(task);
    this.modelInfo = () => modelInfo;
    this.result = () => modelInfo.partInformation;
    this.parts = () => parts;
    task.on.success((result) => {
      if (!completeTriggered) {
        completeTriggered = true;
        this.trigger.success(this.result(), this);
      }
    });

    const parentQueue = this.queue;
    this.queue = () => {
      if (this.result()) this.trigger.success(this.result(), this);
      else {
        parentQueue();
        this.trigger.pending();
      }
    };
  }
}

class AssemblyDocumentationJob extends PartsDocumentationJob {
  constructor(cabinet) {
    super(cabinet);
  }
}

class GroupDocumentationJob extends TaskJob {
  constructor(group) {
    const tasks = [];
    const _result = {group, partInfos: [], layoutAssemblies: []};
    group.objects.forEach((cabinet, i) => {
      if (!(cabinet instanceof Assembly)) return;
      const task = new AssemblyDocumentationJob(cabinet).task();
      tasks.push(task);
    });

    const partInformation = new PartInformation(group);
    const assemblyTasks = new Parrelle(...tasks);
    const layoutTask = new LayoutParts(group, partInformation);
    const seq = new Sequential.Seperate(assemblyTasks, layoutTask);
    super(seq);
  }
}

class RoomDocumentationJob extends TaskJob {
  constructor(room) {
    const tasks = [];
    const _result = {room, groups: []};
    room.groups.forEach((group, i) => {
      if (!group.objects.filter(o => o instanceof Assembly).length) return;
      const task = new GroupDocumentationJob(group).task();
      tasks.push(task);
      task.on.success(result =>
         _result.groups[i] = result);
    });

    const task = new Parrelle(...tasks);
    task.result = () => _result;
    super(task);
  }
}

class OrderDocumentationJob extends TaskJob {
  constructor(order) {
    const start = new Date().getTime();
    let end;
    const tasks = [];
    const _result = {order, rooms: []};
    const partInformation = new PartInformation(order);
    Object.keys(order.rooms).forEach((key, i) => {
      const room = order.rooms[key];
      const task = new RoomDocumentationJob(room).task();
      if (task.tasks().length > 0) {
        task.on.success(result =>
        _result.rooms[i] = result);
        tasks.push(task);
      }
    });

    const task = new Parrelle(...tasks);
    task.result = () => partInformation;
    super(task);
    this.result = () => {
      if (!task.finished()) return null;
      if (!end) end = new Date().getTime();
      console.log(`Order Documentation Job Completion Time: ${Math.roundTo((end - start)/1000, .01)}s`);
      partInformation.finished(true);
      return partInformation;
    }
  }
}

class CsgAssembly extends TaskJob {
  constructor(assembly, modelInfo) {
    const task = Join(modelInfo);
    super(task);
    let _hash;
    this.hash = () => _hash === undefined ? assembly.hash() : _hash;
    this.result = () => this.status() === STATUS.SUCCESS ? modelInfo :
                    (this.status() === STATUS.FAILED ? this.error() : null);
    this.object = () => assembly;
    this.modelInfo = () => modelInfo;
    this.on.processing(assembly.trigger.processing);
    task.on.pending(() => {
      _hash = assembly.hash();
    });
    task.on.success(() =>
            this.status(STATUS.SUCCESS));
  }
}
CsgAssembly.task = (modelInfo) => new Sequential(modelInfo.environment, new Model(modelInfo), new Join(modelInfo), new Union(modelInfo));

class CsgAssemblyConstruction extends CsgAssembly {
  constructor(assembly) {
    const registered = registeredJob(CsgAssemblyConstruction, assembly.id(), assembly.hash());
    if (registered instanceof Job) return registered;
    super(assembly, ModelInfo.construction(assembly));
    registered(this);
  }
}

class CsgAssemblyDisplay extends CsgAssembly {
  constructor(assembly) {
    const registered = registeredJob(CsgAssemblyDisplay, assembly.id(), assembly.hash());
    if (registered instanceof Job) return registered;
    super(assembly, ModelInfo.display(assembly));
    registered(this);
  }
}

CsgAssemblyDisplay.Construction = CsgAssemblyConstruction;

class CsgOutlineTo2DJob extends Jobs {
  constructor(assemblyOs) {
    const isArray = Array.isArray(assemblyOs);
    const assemblies = isArray ? assemblyOs : [assemblyOs];
    const jobs = assemblies.map(a => {
      const modelInfo = ModelInfo.display(a);
      return new TaskJob(AssembliesTo2D(modelInfo, true));
    });
    const _result = {};
    super(jobs);
  }
}

CsgAssembliesTo2DJob.Outline = CsgOutlineTo2DJob;

class AssemblyCsgThreeView extends TaskJob {
  constructor(assembly) {
    const root = assembly.getRoot();
    const registered = registeredJob(AssemblyCsgThreeView, root.id(), root.hash());
    if (registered instanceof Job) return registered;
    const modelJob = new CsgAssemblyConstruction(root);
    const modelInfo = modelJob.modelInfo();
    const getCsg = () => assembly.parentAssembly() === undefined ?
                modelInfo.unioned('boxOnly') : modelInfo.joined(assembly.id());
    const threeViewTask = new ThreeView(getCsg, assembly.normals());
    const task = new Sequential.Seperate(modelJob.task(), threeViewTask);
    super(task);
    let _hash;
    this.hash = () => _hash === undefined ? assembly.hash() : _hash;
    this.result = modelJob.result;
    this.object = () => assembly;
    task.on.pending(() => {
      _hash = assembly.hash();
    });
    registered(this);
  }
}

CsgAssemblyDisplay.ThreeView = AssemblyCsgThreeView;


// TODO: change Assembly to Part and Assemblies to Assembly
module.exports = {
  CSG: {
    Assembly: CsgAssemblyDisplay,
    To2D: CsgTo2DJob,
    Simple: {
      Model: SimpleModelJob,
      To2D: SimpleTo2DJob
    },
    Assemblies: {
      Simple: CsgSimpleAssemblies,
      Complex: CsgComplexAssemblies,
      BoxOnly: CsgBoxOnlyAssemblies,
      To2D: CsgAssembliesTo2DJob
    },
    Room: {
      Simple: CsgSimpleRoomJob,
      Complex: CsgComplexRoomJob
    }
  },
  Documentation: {
    Parts: PartsDocumentationJob,
    Group: GroupDocumentationJob,
    Room: RoomDocumentationJob,
    Order: OrderDocumentationJob
  }
}
