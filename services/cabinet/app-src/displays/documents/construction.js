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

const orderJob = (order, containerOselector, htmlFunc) => {
  order ||= Global.order();
  const job = new Jobs.Documentation.Order(order);
  job.on.change(progressUpdate(containerOselector));
  if (containerOselector && htmlFunc)
    job.then(render(containerOselector, htmlFunc), err)
  job.queue();
  return job;
}

const Aerial = (containerOselector, order) => {
  order ||= Global.order();
  const canvasId = `aerial-canvas-cnt`;
  const html = DocHtml.aerials(order);
  if (containerOselector) {
    const container = containerOselector instanceof HTMLElement ? containerOselector : du.find(containerOselector);
    container.innerHTML = html;
  }
  return html;
}

const PanelComplexCutList = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.panels);
}
const ShelveComplexCutList = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.shelves);
}

const PanelCutList = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.panels.cutList);
}
const ShelveCutList = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.shelves.cutList);
}

const DoorList = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.doorList);
}

const DrawerFrontList = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.drawerFrontList);
}

const Materials = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.materials);
}

const BuildDiagram = (containerOselector, order) => {
  order ||= Global.order();
  const cabinets = [];
  Object.values(order.rooms).forEach(r => r.groups.forEach(g => g.objects.forEach(obj => {
    if (obj && Array.isArray(obj.openings)) cabinets.push(obj);
  })));
  const reqId = String.random();
  // TODO: cabinet information should seperate box/shelve/cover models
  //        then this call will be no longer nessisary
  const job = new Jobs.CSG.Cabinets.BoxOnly(cabinets);
  job.on.change(() => DocHtml.sketchLayout(cabinets, containerOselector, reqId));
  const renderFunc = (result) => DocHtml.openingDiagram(result, reqId);
  job.then(render(containerOselector, renderFunc), err)
  job.queue();
  return job;
}

const Elevation = () => 'coming soon';
const Summary = () => 'coming soon';

const everythingSections = {PanelCutList, ShelveCutList, Summary, Aerial, Elevation,
                      PanelComplexCutList, ShelveComplexCutList, BuildDiagram, Materials, DoorList, DrawerFrontList};
const everythingTemplate = new $t('documents/construction/everything');
const Everything = (containerOselector, order) => {
  const htmlFunc = () => {
    const id = String.random();
    const sections = Object.keys(everythingSections);
    setTimeout(() => {
      for (let index = 0; index < sections.length; index++) {
        const section = sections[index];
        const selector = `#everything-cnt-${id} .everything-${section.toKebab()}-cnt`;
        everythingSections[section](selector, order);
      }
    });
    return everythingTemplate.render({sections, id});
  }
  return orderJob(order, containerOselector, htmlFunc);
}

module.exports = {
  PanelComplexCutList, ShelveComplexCutList, PanelCutList, ShelveCutList,
  BuildDiagram, DoorList,
  DrawerFrontList, Materials, Aerial, Everything
};
