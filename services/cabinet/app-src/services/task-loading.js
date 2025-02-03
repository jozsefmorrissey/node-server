
const CustomEvent = require('../../../../public/js/utils/custom-event.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const ElementLoading = require('../../../../public/js/utils/display/element-loading.js');

const loadingMap = {};
class TaskLoading {
  constructor(jobOtask, elemOid) {
    const elem = elemOid instanceof HTMLElement ? elemOid : du.id(elemOid);
    const task = jobOtask.task ? jobOtask.task() : jobOtask;
    if (loadingMap[task.id]) return;
    loadingMap[task.id] = true;
    new ElementLoading(elem, task.progress).on.termination(() => delete loadingMap[job.id()]);
  }
}




Global.on.processing.cabinet((jobOtask, cabinet) =>
  new TaskLoading(jobOtask, cabinet.id()));

Global.on.processing.room((jobOtask, room) =>
  new TaskLoading(jobOtask, room.id()));
