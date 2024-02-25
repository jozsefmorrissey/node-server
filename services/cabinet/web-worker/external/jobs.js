
const {Parrelle, Sequential, And, Or} = require('./tasks/basic.js');
const ModelInfo = require('./model-information');
const WebWorkerDeligator = require('./deligator');
const Cabinet = require('../../app-src/objects/assembly/assemblies/cabinet.js');
const {Intersection, Join, Model, Union, AssembliesTo2D, SimpleTo2D, Simple} = require('./tasks/csg');
const {Panels} = require('./tasks/documentation');
const Vertex3D = require('../../app-src/three-d/objects/vertex.js');
const SimpleModel = require('../../app-src/objects/simple/simple.js');
const Assembly = require('../../app-src/objects/assembly/assembly.js');
const Panel = require('../../app-src/objects/assembly/assemblies/panel.js');

class Job {
  constructor(task) {
    CustomEvent.all(this, 'complete', 'failed', 'change');
    let finished = false;
    let _error;
    task.on.change((data) => this.trigger.change(data, this));
    this.task = () => task;
    this.finished = (is, result) => {
      if (!finished && is === true) {
        finished = true;
        _error === undefined ? this.trigger.complete(result || this, this) :
                                this.trigger.failed(_error, this);
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
    this.queue = () => {
      WebWorkerDeligator.queue(task);
      if (task instanceof Parrelle) {
        task.tasks().forEach(t => WebWorkerDeligator.queue(t));
      }
    }
    this.on.complete(() => finished = true);
    this.on.failed((error) => (finished = true) && (_error === undefined && (_error = error)));
    this.then = (onComplete, onFailed) => {
      this.on.complete(onComplete);
      this.on.failed(onFailed);
      return this;
    }
  }
}

class Jobs extends Job {
  constructor(jobs, onJobSuccess, onJobFailure) {
    super();
    this.jobs = () => jobs;
    this.allJobsFinished = () => (jobs.find(j => !j.finished()) === undefined);
    this.queue = () => {
      const onSuccess = (result) =>
          (onJobSuccess instanceof Function && onJobSuccess(result)) &
          (!this.finished() && this.allJobsFinished() && this.finished(true));
      onJobFailure ||= (error) => this.error(error);
      for (let index = 0; index < jobs.length; index++) {
        const job = jobs[index];
        job.then(onSuccess, onJobFailure).queue();
      }
    }
  }
}

class SimpleModelJob extends Job {
  constructor(simpleObjs) {
    const task = Simple(simpleObjs);
    super(task);
    task.on.complete(() =>
        this.trigger.complete(task.result(), this));
    task.on.failed((error) => this.trigger.failed(error, this));
  }
}

class SimpleTo2DJob extends Job {
  constructor(simpleObjs) {
    const task = SimpleTo2D(simpleObjs);
    super(task);
    task.on.complete(() =>
        this.trigger.complete(task.result(), this));
    task.on.failed((error) => this.trigger.failed(error, this));
  }
}

class CsgModelInfoJob extends Job {
  constructor(task, modelInfo) {
    super(task);
    this.modelInfo = () => modelInfo;
  }
}

class CsgModelJob extends CsgModelInfoJob {
  constructor(assemblyOs, props) {
    props ||= {};
    props.modelAttribute = 'model';
    const modelInfo = ModelInfo.object(assemblyOs, props);
    super(Model(modelInfo), modelInfo);
    this.task().on.complete(() => this.trigger.complete(modelInfo, this));
    this.task().on.failed((error) => this.trigger.failed(error, this));
  }
}
CsgModelJob.task = (modelInfo) => new Sequential(modelInfo.environment, new Model(modelInfo), new Union(modelInfo));

class CsgJoinJob extends CsgModelInfoJob {
  constructor(assemblyOs) {
    const modelInfo = ModelInfo.object(assemblyOs);
    super(Join(modelInfo), modelInfo);
    this.task().on.complete(() => this.trigger.complete(modelInfo, this));
    this.task().on.failed((error) => this.trigger.failed(error, this));
  }
}
CsgJoinJob.task = (modelInfo) => new Sequential(modelInfo.environment, new Model(modelInfo), new Join(modelInfo), new Union(modelInfo));

class CsgIntersectionJob extends CsgModelInfoJob {
  constructor(assemblyOs) {
    const modelInfo = ModelInfo.object(assemblyOs);
    super(Intersection(modelInfo), modelInfo);
    this.task().on.complete(() => this.trigger.complete(modelInfo, this));
    this.task().on.failed((error) => this.trigger.failed(error, this));
  }
}
CsgIntersectionJob.task = (modelInfo) => new Sequential(modelInfo.environment, new Model(modelInfo), new Join(modelInfo), new Intersection(modelInfo), new Union(modelInfo));


class CsgPartsJob extends CsgModelInfoJob {
  constructor(assemblyOs) {
    const modelInfo = ModelInfo.object(assemblyOs);
    super(Join(modelInfo), modelInfo);
    this.task().on.complete(() => this.trigger.complete(modelInfo, this));
    this.task().on.failed((error) => this.trigger.failed(error, this));
  }
}

class CsgSimpleCabinet extends CsgModelJob {
  constructor(cabinet) {
    const allAssemblies = cabinet.allAssemblies();
    const fronts = allAssemblies.filter(a => a.part() && a.partCode().match(/^(d|df|D|ff|Dr|Dl)$/));
    const pulls = allAssemblies.filter(a => a.part() && a.partCode().match(/^(pu)$/));
    super([cabinet].concat(fronts).concat(pulls), {partsOnly: false, noJoints: true});
    this.cabinet = () => cabinet;
  }
}

class CsgComplexCabinet extends CsgJoinJob {
  constructor(cabinet) {
    const allAssemblies = cabinet.allAssemblies();
    super(allAssemblies);
    this.cabinet = () => cabinet;
  }
}

class CsgAssembliesTo2DJob extends CsgModelInfoJob {
  constructor(assemblyOs, props) {
    props ||= {};
    props.modelAttribute ||= 'model';
    const modelInfo = ModelInfo.object(assemblyOs, props);
    const task = AssembliesTo2D(modelInfo, props.modelAttribute === 'joined', props.unioned);
    super(task, modelInfo);
    this.task().on.complete(() => this.trigger.complete(modelInfo, this));
    this.task().on.failed((error) => this.trigger.failed(error, this));
  }
}

class CsgCabinetTo2DJob extends CsgAssembliesTo2DJob {
  constructor(cabinetOs, props) {
    props ||= {};
    if (props.partsOnly === undefined) props.partsOnly = false;
    if (props.noJoints === undefined) props.noJoints = true;
    super(cabinetOs, props);
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
    const onSuccess = (result) =>  {
      const isModelInfo = result.threeView instanceof Function;
      let map = isModelInfo ? {} : result;
      if (isModelInfo) split.assemblies.forEach(a => map[a.id()] = result.threeView(a.id()));
      _result.merge(map);
      if (this.allJobsFinished()) this.finished(true, _result);
    }
    super(jobs, onSuccess);
  }
}

class CsgRoomJob extends Job {
  constructor(room) {
    const {task, tasks, jobs} = CsgRoomJob.tasksAndJobs(room);
    super(task);
    this.room = () => room;
    this.jobs = () => jobs;
    this.csg =  () => {
      const start = new Date().getTime();
      let csg = new CSG();
      for (let index = 0; index < jobs.length; index++) {
        const model = jobs[index].modelInfo().unioned().clone();
        const cabinet = jobs[index].cabinet();
        const buildCenter = cabinet.buildCenter();
        const center = new Vertex3D(cabinet.position().center());
        const modelCenter = model.center();
        model.rotate(cabinet.position().rotation());
        model.center(center);

        if (model) csg.polygons.concatInPlace(model.polygons);
      }
      let objects = room.layout().objects().filter(o => o.constructor.name === 'Object3D');
      if (objects.length > 0) throw new Error('have not implemented this');
      console.log('build?:', (new Date().getTime() - start)/1000)
      return csg;
    }
    task.on.complete(() => this.trigger.complete(this.csg(), this));
    task.on.failed((error) => this.trigger.failed(error, this));
  }
}
CsgRoomJob.tasksAndJobs = (room) => {
  const tasks = [];
  const jobs = [];
  for (let i = 0; i < room.groups.length; i++) {
    const group = room.groups[i];
    for (let j = 0; j < group.objects.length; j++) {
      const obj = group.objects[j];
      const job = obj instanceof Cabinet ?
          new CsgSimpleCabinet(obj) : new CsgModelJob(obj);
      jobs.push(job);
      tasks.push(job.task());
    }
  }
  const task = new Parrelle(...tasks);
  return {tasks, jobs, task};
}

CsgRoomJob.task = (room) => CsgRoomJob.tasksAndJobs(room).task;

class DocumentationPanelsJob extends Job {
  constructor(assemblyOs, props) {
    if (assemblyOs instanceof Cabinet) assemblyOs = assemblyOs.parts();
    const panels = assemblyOs.filter(part => part instanceof Panel);
    const modelInfo = ModelInfo.object(panels, props);
    const task = Panels(modelInfo);
    super(task);
    this.panels = () => panels;
    task.on.complete(() =>
        this.trigger.complete(task.result(), this));
    task.on.failed((error) => this.trigger.failed(error, this));
  }
}

module.exports = {
  CSG: {
    Assembly: {
      Model: CsgModelJob,
      Intersection: CsgIntersectionJob,
      Join: CsgJoinJob,
      To2D: CsgAssembliesTo2DJob,
    },
    To2D: CsgTo2DJob,
    Simple: {
      Model: SimpleModelJob,
      To2D: SimpleTo2DJob
    },
    Cabinet: {
      Simple: CsgSimpleCabinet,
      Complex: CsgComplexCabinet,
      To2D: CsgCabinetTo2DJob
    },
    Room: {
      Simple: CsgRoomJob
    }
  },
  Documentation: {
    Panels: DocumentationPanelsJob
  }
}
