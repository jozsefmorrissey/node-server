
const {Task, Sequential, Parrelle} = require('./basic');
const STATUS = require('./status');
const CSG = require('./csg');
const Lookup = require('../../../../../public/js/utils/object/lookup.js');

class PartsInformationTask extends Task {
  constructor(parts) {
    super();
    let _result = {};
    const remaining =  parts.map(p => p + '');
    this.result = () => _result;
    this.payload = () => ({parts});
    this.progress = () => Math.floor(100 * (1 - (remaining.length/parts.length)));
    this.on.message((result) => {
      if (result instanceof Error) {
        console.error(result);
      } else {
        remaining.remove(result.partId);
        _result[result.partId] = result;
        this.trigger.change(this);
        if (remaining.length === 0) this.status(STATUS.SUCCESS, _result);
      }
    });
  }
}

function SeqParts(modelInfo) {
    const buildTask = CSG.Intersection(modelInfo);
    const partTask = new PartsInformationTask(modelInfo.needsUnioned());
    const sequential = new Sequential(modelInfo.environment, buildTask, partTask);
    sequential.result = partTask.result;
    return sequential;
}

const complexitySort = (complexityMap) => (id1, id2) =>
  complexityMap[id2] - complexityMap[id1];

const addTasks = (tasks, partTasks, modelInfo, ids) => {
  const buildTask = CSG.Intersection(modelInfo, true);
  const partTask = new PartsInformationTask(ids);
  partTasks.push(partTask);
  const sequential = new Sequential(modelInfo.environment, buildTask, partTask);
  tasks.push(sequential);
}

function logarithmicTasks(ids, modelInfo) {
  const tasks = [];
  const partTasks = [];
  const complexityMap = modelInfo.complexityMap();
  ids.sort(complexitySort(complexityMap));
  addTasks(tasks, partTasks, modelInfo, [ids[0]]);
  addTasks(tasks, partTasks, modelInfo, [ids[1]]);
  const sets = [[ids[0]], [ids[1]]];
  ids.splice(0, 2);
  let index = 0;
  let sliceCount = 2;
  while(ids.length) {
    const set = ids.splice(0, sliceCount);
    if (ids.length < sliceCount / 2) set.concatInPlace(ids.splice(0, sliceCount));
    sets.push(set);
    addTasks(tasks, partTasks, modelInfo, set);
    if (index++ % 2 === 1)sliceCount = Math.floor(sliceCount * 2);
    if (sliceCount > 8) sliceCount = 8;
  }
  return {tasks, partTasks};
}

const sliceCount = 16;
function sliceTasks(ids, modelInfo) {
  const complexityMap = modelInfo.complexityMap();
  ids.sort(complexitySort(complexityMap));

  const step = Math.ceil(ids.length / sliceCount);
  const slices = [];
  let sliceIndex = 0;
  while (sliceIndex < ids.length) {
    slices.push(ids.slice(sliceIndex, sliceIndex += step));
  }

  const groupedIds = [];
  while (slices[0][0]) slices.forEach(s => s[0] && groupedIds.push(s.splice(0,1)));
  const tasks = [];
  const partTasks = [];
  for (let index = 0; index < groupedIds.length; index += sliceCount) {
    const buildTask = CSG.Intersection(modelInfo, true);
    const currIds = groupedIds.slice(index, index+sliceCount);
    const partTask = new PartsInformationTask(currIds);
    partTasks.push(partTask);
    const sequential = new Sequential(modelInfo.environment, buildTask, partTask);
    tasks.push(sequential);
  }
  return {tasks, partTasks};
}

function Parts(modelInfo) {
    let ids = modelInfo.needsUnioned();
    const {tasks, partTasks} = sliceTasks(ids, modelInfo);

    const parrelle = new Parrelle(...tasks);
    parrelle.result = () => {
      let result = {};
      partTasks.forEach(pt => {
        const tRes = pt.result();
        Object.values(tRes).forEach(pi => {
          pi.parts = pi.partIds.map(id => Lookup.get(id));
          pi.MATERIAL_UNIT = pi.parts[0].MATERIAL_UNIT;
          if (result[pi.category] === undefined) result[pi.category] = {};
          result[pi.category][pi.partId] = pi;
        });
      });
      return result;
    }
    return parrelle;
}

module.exports = {
  Parts
};
