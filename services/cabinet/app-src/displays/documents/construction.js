const $t = require('../../../../../public/js/utils/$t.js');
const Global = require('../../services/global.js');
const Jobs = require('../../../web-worker/external/jobs.js');
const DocHtml = require('./html');
const du = require('../../../../../public/js/utils/dom-utils');

const taskCompletionTemplate = new $t('documents/task-completion');

const recusiveAddTask = (list, task) => task.tasks  ?
  task.tasks().forEach(t => recusiveAddTask(list, t)) :
  (task.task ? recusiveAddTask(list, task.task()) : list.push(task));
const progressUpdate = (containerOselector) => {
  let _progress = 0;
  return  (task, job) => {
    if (job.task().status() === 'complete') return;
    const tasks = [];
    recusiveAddTask(tasks, job);
    const container = containerOselector instanceof HTMLElement ? containerOselector : du.find(containerOselector);
    if (container) {
      const finished = tasks.filter(t => t.finished()).length;
      const remaining = tasks.filter(t => !t.finished()).length;
      const progress = Math.floor(finished/(finished+remaining) * 100);
      if (progress > _progress && progress < 99.99) {
        container.innerHTML = taskCompletionTemplate.render({tasks, progress});
      }
    }
  }
}

const err = (...args) => {
  console.error(...args);
}

const render = (containerOselector, htmlFunc) => (result) => {
  const container = containerOselector instanceof HTMLElement ? containerOselector : du.find(containerOselector);
  if (container) {
    container.innerHTML = 'Building Document...';
    setTimeout(() => {
      const html = htmlFunc(result, containerOselector);
      if ((typeof html) === 'string') container.innerHTML = html;
    });
  }
}

const orderJob = (order, containerOselector, htmlFunc, props) => {
  order ||= Global.order();
  const job = new Jobs.Documentation.Order(order, props);
  const update = progressUpdate(containerOselector);
  job.on.change(update);
  job.then(update, update);
  if (containerOselector && htmlFunc)
    job.then(render(containerOselector, htmlFunc), err)
  job.queue();
  return job;
}

const OrderInformation = (containerOselector, order) => {
  order ||= Global.order();
  const html = DocHtml.orderInfo(order);
  if (containerOselector) {
    const container = containerOselector instanceof HTMLElement ? containerOselector : du.find(containerOselector);
    if (container) container.innerHTML = html;
  }
  return html;
}

const Aerial = (containerOselector, order) => {
  order ||= Global.order();
  const html = DocHtml.aerials(order);
  if (containerOselector) {
    const container = containerOselector instanceof HTMLElement ? containerOselector : du.find(containerOselector);
    if (container) container.innerHTML = html;
  }
  return html;
}

const PanelComplexCutList = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.panels);
}
const ShelveComplexCutList = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.shelves);
}
const FrameComplexCutList = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.frames);
}

const PanelCutList = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.panels.cutList);
}
const ShelveCutList = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.shelves.cutList);
}
const FrameCutList = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.frames.cutList);
}

const CabinetList = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.cabinetList);
}

const DoorList = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.doorList);
}

const DrawerFrontList = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.drawerFrontList);
}

const DrawerBoxList = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.drawerBoxList);
}

const ShelveList = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.shelveList);
}

const Materials = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.materials);
}

const BuildDiagram = (containerOselector, order) => {
  const job = orderJob(order, containerOselector, DocHtml.buildDiagram, {partInfo: false});
  return job;
}

const ThreeView = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.threeView, {partInfo: false});
}

const Elevation = (containerOselector, order) => {
  return orderJob(order, containerOselector, DocHtml.elevationDiagram, {partInfo: false});
}

const everythingTemplate = new $t('documents/construction/everything');
const MultiSection = (sectionsObj) => (containerOselector, order) => {
  const htmlFunc = () => {
    const id = String.random();
    const sections = Object.keys(sectionsObj);
    setTimeout(() => {
      for (let index = 0; index < sections.length; index++) {
        const section = sections[index];
        const selector = `#everything-cnt-${id} .everything-${section.toKebab()}-cnt`;
        summarySections[section](selector, order);
      }
    });
    return everythingTemplate.render({sections, id});
  }
  return orderJob(order, containerOselector, htmlFunc);
}

const summarySections = {Aerial, Elevation, OrderInformation,
        CabinetList, DoorList, DrawerFrontList, DrawerBoxList, ShelveList,
        Materials};
const Summary = MultiSection(summarySections);

const everythingSections = {PanelCutList, ShelveCutList, Aerial, Elevation,
        PanelComplexCutList, ShelveComplexCutList, BuildDiagram,
        Materials, DoorList, DrawerFrontList, DrawerBoxList, ShelveList};
const Everything = MultiSection(everythingSections);


module.exports = {
  PanelComplexCutList, ShelveComplexCutList, PanelCutList, ShelveCutList,
  CabinetList, ThreeView, BuildDiagram, DoorList, DrawerBoxList, Elevation,
  FrameComplexCutList, FrameCutList,
  DrawerFrontList, Materials, Aerial, Summary, Everything
};
