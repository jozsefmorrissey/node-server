const $t = require('../../../../../public/js/utils/$t.js');
const Global = require('../../services/global.js');
const Jobs = require('../../../web-worker/external/jobs.js');
const DocHtml = require('./html');
const du = require('../../../../../public/js/utils/dom-utils');

const taskCompletionTemplate = new $t('documents/task-completion');

const recusiveAddTask = (list, task) => task.tasks  ?
  task.tasks().forEach(t => recusiveAddTask(list, t)) :
  (task.task ? recusiveAddTask(list, task.task()) : list.push(task));
const progressUpdate = (containerOselector) => (task, job) => {
  if (job.task().status() === 'complete') return;
  const tasks = [];
  recusiveAddTask(tasks, job);
  const container = containerOselector instanceof HTMLElement ? containerOselector : du.find(containerOselector);
  if (container) {
    const finished = tasks.filter(t => t.finished()).length;
    const remaining = tasks.filter(t => !t.finished()).length;
    const progress = Math.floor(finished/(finished+remaining) * 100);
    container.innerHTML = taskCompletionTemplate.render({tasks, progress});
  }
}

const err = (...args) => {
  console.error(...args);
}

const render = (containerOselector, htmlFunc) => (result) => {
  const container = containerOselector instanceof HTMLElement ? containerOselector : du.find(containerOselector);
  container.innerHTML = 'Building Document...';
  setTimeout(() => {
    const html = htmlFunc(result);
    if ((typeof html) === 'string') container.innerHTML = html;
  });
}

const orderJob = (containerOselector, order, htmlFunc) => {
  order ||= Global.order();
  const job = new Jobs.Documentation.Order(order);
  job.on.change(progressUpdate(containerOselector));
  job.then(render(containerOselector, htmlFunc), err)
  job.queue();
  return job;
}

const Arials = (containerOselector, order) => {
  order ||= Global.order();
  const canvasId = `aerial-canvas-cnt`;
  return DocHtml.aerials(order);
}

const Order = (containerOselector, order) => {
  return orderJob(containerOselector, order, DocHtml.panels.order);
}

const CutList = (containerOselector, order) => {
  return orderJob(containerOselector, order, DocHtml.panels.cutList);
}

const DoorList = (containerOselector, order) => {
  return orderJob(containerOselector, order, DocHtml.doorList);
}

const DrawerFrontList = (containerOselector, order) => {
  return orderJob(containerOselector, order, DocHtml.drawerFrontList);
}

const Materials = (containerOselector, order) => {
  return orderJob(containerOselector, order, DocHtml.materials);
}

const BuildDiagram = (containerOselector, order) => {
  order ||= Global.order();
  const cabinets = [];
  Object.values(order.rooms).forEach(r => r.groups.forEach(g => g.objects.forEach(obj => {
    if (obj && Array.isArray(obj.openings)) cabinets.push(obj);
  })));
  const job = new Jobs.CSG.Cabinets.BoxOnly(cabinets);
  job.on.change(() => DocHtml.sketchLayout(cabinets, containerOselector));
  const renderFunc = (result) => DocHtml.openingDiagram(result, containerOselector);
  job.then(render(containerOselector, renderFunc), err)
  job.queue();
  return job;
}

const Room = (containerOselector, room) => {
  const job = new Jobs.Documentation.Parts(room);
  job.on.change(progressUpdate(containerOselector));
  job.then(render(containerOselector, DocHtml.panels.room), err)
  job.queue();
  return job;
};

const Group = (containerOselector, group) => {
  const job = new Jobs.Documentation.Group(room);
  job.on.change(progressUpdate(containerOselector));
  job.then(render(containerOselector, DocHtml.panels.group), err)
  job.queue();
  return job;
};

const Cabinet = (containerOselector, cabinet) => {
  const job = new Jobs.Documentation.Parts(cabinet);
  job.on.change(progressUpdate(containerOselector));
  job.then(render(containerOselector, (map) => DocHtml.panels.part(map.Panel)), err)
  job.queue();
  return job;
};

const Parts = (containerOselector, parts) => {
  const job = new Jobs.Documentation.Parts(parts);
  job.on.change(progressUpdate(containerOselector));
  job.then(render(containerOselector, (map) => DocHtml.panels.part(map.Panel)), err)
  job.queue();
  return job;
};

module.exports = {
  Order, Room, Group, Cabinet, Parts, CutList, BuildDiagram, DoorList,
  DrawerFrontList, Materials, Arials
};
