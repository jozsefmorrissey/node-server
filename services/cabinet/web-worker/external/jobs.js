
const {InfoAvailible, Parrelle, Sequential, And, Or} = require('./tasks/basic.js');
const ModelInfo = require('./model-information');
const WebWorkerDeligator = require('./deligator');
const Cabinet = require('../../app-src/objects/assembly/assemblies/cabinet.js');
const {Intersection, Join, Model, Union, AssembliesTo2D, SimpleTo2D, Simple} = require('./tasks/csg');
const {Parts} = require('./tasks/documentation');
const Vertex3D = require('../../app-src/three-d/objects/vertex.js');
const SimpleModel = require('../../app-src/objects/simple/simple.js');
const Assembly = require('../../app-src/objects/assembly/assembly.js');
const Panel = require('../../app-src/objects/assembly/assemblies/panel.js');
const PartInformation = require('part-information');

class Job {
  constructor() {
    CustomEvent.all(this, 'finished', 'success', 'failed', 'change');
    let finished = false;
    let _error;
    this.finished = (is, result) => {
      if (result instanceof Error) _error = result;
      if (!finished && is === true) {
        finished = true;
        result = this.result(result);
        _error === undefined ? this.trigger.success(result || this, this) :
                                this.trigger.failed(_error, this);
        this.trigger.finished(_error, this);
      }
      return finished;
    }
    this.error = (error) => {
      if (_error === undefined && error instanceof Error) {
        _error = error;
        this.finished(true);
      }
      return _error;
    }
    this.then = (onSuccess, onFailed) => {
      this.on.success(onSuccess);
      this.on.failed(onFailed || console.error);
      return this;
    }
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
    }
  }
}

class TaskJob extends Job {
  constructor(task) {
    super();
    task.on.change((data) => this.trigger.change(data, this));
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
      });
    }
  }
}

class SimpleModelJob extends TaskJob {
  constructor(simpleObjs) {
    const task = Simple(simpleObjs);
    super(task);
  }
}

class CsgModelInfoJob extends TaskJob {
  constructor(task, modelInfo) {
    super(task);
    this.modelInfo = () => modelInfo;
    this.result = () => task.result ? task.result() : modelInfo;
  }
}

class CsgModelJob extends CsgModelInfoJob {
  constructor(assemblyOs, props) {
    props ||= {};
    const modelInfo = ModelInfo.object(assemblyOs, props);
    super(Join(modelInfo), modelInfo);
  }
}
CsgModelJob.task = (modelInfo) => new Sequential(modelInfo.environment, new Model(modelInfo), new Union(modelInfo));

class CsgJoinJob extends CsgModelInfoJob {
  constructor(assemblyOs, explosionFactor, props) {
    const modelInfo = ModelInfo.object(assemblyOs, props);
    modelInfo.explosionFactor(explosionFactor);
    super(Join(modelInfo), modelInfo);
  }
}
CsgJoinJob.task = (modelInfo) => new Sequential(modelInfo.environment, new Model(modelInfo), new Join(modelInfo), new Union(modelInfo));

class CsgIntersectionJob extends CsgModelInfoJob {
  constructor(assemblyOs) {
    const modelInfo = ModelInfo.object(assemblyOs);
    super(Intersection(modelInfo), modelInfo);
  }
}
CsgIntersectionJob.task = (modelInfo) => new Sequential(modelInfo.environment, new Model(modelInfo), new Join(modelInfo), new Intersection(modelInfo), new Union(modelInfo));


class CsgPartsJob extends CsgModelInfoJob {
  constructor(assemblyOs) {
    const modelInfo = ModelInfo.object(assemblyOs);
    super(Join(modelInfo), modelInfo);
  }
}

class CsgAssemblyBoxOnlyJob extends CsgJoinJob {
  constructor(cabinet) {
    super(cabinet.userDefinedParts(), null, {partsOnly: true});
    this.cabinet = () => cabinet;
  }
}

class CsgSimpleAssembly extends CsgJoinJob {
  constructor(cabinet) {
    const allAssemblies = cabinet.allAssemblies();
    const boxParts = cabinet.modelingCollections.simple();
    const fronts = allAssemblies.filter(a => a.part() && a.partCode().match(/^(d|df|D|ff|Dr|Dl)$/));
    const pulls = allAssemblies.filter(a => a.part() && a.partCode().match(/^(pu)$/));
    super(boxParts.concat(fronts).concat(pulls), null,  {partsOnly: true});
    this.cabinet = () => cabinet;
  }
}

class CsgComplexAssembly extends CsgJoinJob {
  constructor(cabinet) {
    const assemblies = cabinet.modelingCollections();
    super(assemblies);
    this.cabinet = () => cabinet;
  }
}

const cabinetJobGetter = (type) => {
  switch (type) {
    case 'box': return c => new CsgAssemblyBoxOnlyJob(c);
    case 'simple': return c => new CsgSimpleAssembly(c);
    case 'complex': return c => new CsgComplexAssembly(c);
  }
}
class CsgAssemblies extends TaskJob {
  constructor(cabinets, type) {
    const jobs = cabinets.map(cabinetJobGetter(type));
    const tasks = jobs.map(j => j.task());
    const task = new Parrelle(...tasks);
    super(task);
    let modelMaps;
    this.result = () => {
      if (modelMaps === undefined) {
        modelMaps = {};
        jobs.forEach(j => modelMaps[j.cabinet().id()] = j.modelInfo());
      }
      return modelMaps;
    };
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
  constructor(assemblyOs, props) {
    const isArray = Array.isArray(assemblyOs);
    const assemblies = isArray ? assemblyOs : [assemblyOs];
    props ||= {};
    const modelInfo = ModelInfo.object(assemblyOs, props);
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

class CsgAssemblyTo2DJob extends CsgModelInfoJob {
  constructor(assembly, props) {
    const needs2dConverted = [assembly.id()];
    const parts = assembly.getRoot().getParts();
    const modelInfo = ModelInfo.object(parts , props);
    const task = AssembliesTo2D(modelInfo);
    super(task, modelInfo);
  }
}

class CsgOutlineTo2DJob extends Jobs {
  constructor(assemblyOs, props) {
    const isArray = Array.isArray(assemblyOs);
    const assemblies = isArray ? assemblyOs : [assemblyOs];
    const jobs = assemblies.map(a => {
      props ||= {needs2dConverted: [a.id()]};
      const modelInfo = ModelInfo.object(a.modelingCollections.outline(), props);
      return new TaskJob(AssembliesTo2D(modelInfo, true));
    });
    const _result = {};
    super(jobs);
  }
}

class SimpleTo2DJob extends TaskJob {
  constructor(simpleObjs) {
    const task = SimpleTo2D(simpleObjs);
    super(task);
  }
}

class CsgTo2DJob extends Jobs {
  constructor(objects, props) {
    const split = objects.filterSplit(o => o instanceof Assembly ? 'assemblies' :
          (o instanceof SimpleModel ? 'simpleModels' : 'unkown'));
    if (split.unkown) console.error(`To2D process not configured for "${split.unkown}"`);
    const assembliesJob = new CsgAssembliesTo2DJob(split.assemblies, props);
    const simpleJob = new SimpleTo2DJob(split.simpleModels, props);
    const jobs = [assembliesJob, simpleJob];
    const _result = {};
    const onSuccess = (result, job) =>  {
      _result.merge(result);
      if (this.allJobsFinished()) this.finished(true, _result);
    }
    super(jobs, onSuccess);
  }
}

class CsgRoomJob extends TaskJob {
  constructor(room, complex) {
    const {task, tasks, jobs} = CsgRoomJob.tasksAndJobs(room, complex);
    super(task);
    this.room = () => room;
    this.jobs = () => jobs;
    let _result;
    this.result =  () => {
      if (_result === undefined) {
        const start = new Date().getTime();
        let csg = new CSG();
        for (let index = 0; index < jobs.length; index++) {
          const job = jobs[index];
          let model;
          if (job.modelInfo) {
            model = jobs[index].modelInfo().unioned().clone();
            const cabinet = jobs[index].cabinet();
            const rotation = cabinet.position().rotation();
            const buildCenter = cabinet.buildCenter(true);
            const center = new Vertex3D(cabinet.position().center());
            const layoutCenterVect = new Vertex3D((center.minus(buildCenter)));
            const modelCenter = model.center();
            model.translate({x: -buildCenter.x, y: -buildCenter.y, z: -buildCenter.z})
            model.rotate(rotation);
            model.translate(center);
          } else {
            model = job.result();
          }

          if (model) csg.polygons.concatInPlace(model.polygons);
        }
        let objects = room.layout().objects().filter(o => o.constructor.name === 'Object3D');
        if (objects.length > 0) throw new Error('have not implemented this');
        console.log('build?:', (new Date().getTime() - start)/1000)
        _result = csg;
      }
      return _result;
    }
  }
}
CsgRoomJob.tasksAndJobs = (room, complex) => {
  const tasks = [];
  const jobs = [];
  for (let i = 0; i < room.groups.length; i++) {
    const group = room.groups[i];
    for (let j = 0; j < group.objects.length; j++) {
      const obj = group.objects[j];
      const job = obj instanceof  Assembly ?
          (complex ? new CsgComplexAssembly(obj) : new CsgSimpleAssembly(obj)) : new SimpleModelJob(obj);
      jobs.push(job);
      tasks.push(job.task());
    }
  }
  const task = new Parrelle(...tasks);
  return {tasks, jobs, task};
}
class CsgSimpleRoomJob extends CsgRoomJob {constructor(room) {super(room, false)}};
class CsgComplexRoomJob extends CsgRoomJob {constructor(room) {super(room, true)}};

CsgRoomJob.task = (room) => CsgRoomJob.tasksAndJobs(room).task;

class PartsDocumentationJob extends TaskJob {
  constructor(assembly, props) {
    let completeTriggered = false;
    const parts = assembly.modelingCollections();
    const modelInfo = ModelInfo.object(parts, props);
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
      else parentQueue();
    };
  }
}

class AssemblyDocumentationJob extends PartsDocumentationJob {
  constructor(cabinet) {
    super(cabinet);
  }
}

class GroupDocumentationJob extends TaskJob {
  constructor(group, props) {
    const tasks = [];
    const _result = {group, cabinets: []};
    group.objects.forEach((cabinet, i) => {
      if (!(cabinet instanceof Assembly)) return;
      const task = new AssemblyDocumentationJob(cabinet).task();
      task.on.success(parts =>
          _result.cabinets[i] = {cabinet, parts});
      tasks.push(task);
    });

    const task = new Parrelle(...tasks);
    task.result = () => _result;
    super(task);
  }
}

class RoomDocumentationJob extends TaskJob {
  constructor(room, props) {
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
  constructor(order, props) {
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
      if (!this.finished()) return null;
      partInformation.finished(true);
      return partInformation;
    }
  }
}
CsgAssembliesTo2DJob.Outline = CsgOutlineTo2DJob;
module.exports = {
  CSG: {
    Assembly: {
      Model: CsgModelJob,
      Intersection: CsgIntersectionJob,
      Join: CsgJoinJob,
      Simple: CsgSimpleAssembly,
      Complex: CsgComplexAssembly,
      To2D: CsgAssembliesTo2DJob
    },
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
