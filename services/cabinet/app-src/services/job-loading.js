
const CustomEvent = require('../../../../public/js/utils/custom-event.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const ElementLoading = require('../../../../public/js/utils/display/element-loading.js');

const loadingMap = {};
class JobLoading {
  constructor(job, elemOid) {
    const elem = elemOid instanceof HTMLElement ? elemOid : du.id(elemOid);
    const task = job.task();
    if (loadingMap[job.id()]) return;
    loadingMap[job.id()] = true;
    new ElementLoading(elem, task.progress).on.termination(() => delete loadingMap[job.id()]);
  }
}




Global.on.processing.cabinet((job, cabinet) =>
  new JobLoading(job, cabinet.id()));
