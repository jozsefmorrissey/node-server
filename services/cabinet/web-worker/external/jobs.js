
const {Parrelle, Sequential, And, Or} = require('./tasks/basic.js');
const ModelInfo = require('./model-information');
const WebWorkerDeligator = require('./deligator');
const Cabinet = require('../../app-src/objects/assembly/assemblies/cabinet.js');
const {Intersection, Join, Model, Union} = require('./tasks/csg');
const Vertex3D = require('../../app-src/three-d/objects/vertex.js');

class Job {
  constructor(task) {
    CustomEvent.all(this, 'complete', 'failed');
    this.task = () => task;
    this.queue = () => {
      WebWorkerDeligator.queue(task);
      if (task instanceof Parrelle) {
        task.tasks().forEach(t => WebWorkerDeligator.queue(t));
      }
    }
    this.then = (onComplete, onFailed) => {
      this.on.complete(onComplete);
      this.on.failed(onFailed);
      return this;
    }
  }
}

class CSGSequentialJob extends Job {
  constructor(modelInfo, ...tasks) {
    const task = new Sequential(modelInfo.environment, ...tasks);
    super(task);
    this.modelInfo = () => modelInfo;
    task.on.complete((...args) => this.trigger.complete(modelInfo, ...args));
    task.on.failed((...args) => this.trigger.failed(...args));
  }
}

class CsgModelJob extends CSGSequentialJob {
  constructor(assemblyOs, props) {
    props ||= {};
    props.modelAttribute = 'model';
    const modelInfo = ModelInfo.object(assemblyOs, props);
    super(modelInfo, new Model(modelInfo, true), new Union(modelInfo, true));
  }
}

class CsgJoinJob extends CSGSequentialJob {
  constructor(assemblyOs) {
    const modelInfo = ModelInfo.object(assemblyOs);
    super(modelInfo, new Model(modelInfo, true), new Join(modelInfo, true), new Union(modelInfo, true));
  }
}

class CsgIntersectionJob extends CSGSequentialJob {
  constructor(assemblyOs) {
    const modelInfo = ModelInfo.object(assemblyOs);
    super(modelInfo, new Model(modelInfo),  new Join(modelInfo), new Intersection(modelInfo), new Union(modelInfo));
  }
}

class CsgPartsJob extends CSGSequentialJob {
  constructor(assemblyOs) {
    const modelInfo = ModelInfo.object(assemblyOs);
    super(modelInfo, new Model(modelInfo), new Join(modelInfo));
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

class CsgRoomJob extends Job {
  constructor(room) {
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
    super(task);
    this.jobs = () => jobs;
    this.csg =  () => {
      let csg = new CSG();
      for (let index = 0; index < jobs.length; index++) {
        const model = jobs[index].modelInfo().unioned();
        const cabinet = jobs[index].cabinet();
        const buildCenter = cabinet.buildCenter();
        const center = new Vertex3D(cabinet.position().center());
        const modelCenter = model.center();
        model.rotate(cabinet.position().rotation());
        const newCenter = center.translate(buildCenter.minus(modelCenter));
        model.center(newCenter);

        if (model) csg.polygons.concatInPlace(model.polygons);
      }
      return csg;
    }
    task.on.complete(() => this.trigger.complete(this));
    task.on.failed(() => this.trigger.failed(this));
  }
}

module.exports = {
  CSG: {
    Model: CsgModelJob,
    Intersection: CsgIntersectionJob,
    Join: CsgJoinJob,
    Cabinet: {
      Simple: CsgSimpleCabinet
    },
    Room: {
      Simple: CsgRoomJob
    }
  }
}
