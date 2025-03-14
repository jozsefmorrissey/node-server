
const du = require('../dom-utils');
// const jobProcessIndicator = (job, cabinet, delay) => {
//   const expandHeader = du.find.up('.expand-header', du.find(`[cabinet-id='${cabinet.id()}']`));
//   if (!expandHeader) {
//     delay = Number.isInteger(delay) ? delay * 10 : 1;
//     if (delay <= 100) return setTimeout(() => jobProcessIndicator(job, cabinet, delay), delay);
//     else throw new Error('Cabinet being processed does not have header');
//   }
//   const task = job.task();
//   const loadingCnt = du.find.down('.circle-loading-cnt', expandHeader);
//   const scope = {progress: task.progress, time: task.time,
//     size: '20px', color: '#f09a05', id: String.random()
//   }
//   loadingCnt.innerHTML = CabinetDisplay.loadingTemplate.render(scope);
//   (() => du.find.down('.time', loadingCnt).innerText = task.time())
//       .periodic(100, () => task.progress() === 100);
//   task.on.change(t => {
//     document.documentElement.style.setProperty('--percentDecimal'+scope.id, task.progress()/100);
//     document.documentElement.style.setProperty('--percent'+scope.id, task.progress() + '%');
//     loadingCnt.hidden = task.progress() === 100;
//     du.find.down('.progress', loadingCnt).innerText = Math.floor(task.progress());
//   })
// };
//
// Global.on.processing.cabinet(jobProcessIndicator);

const CustomEvent = require('../custom-event.js');

class ElementLoading {
  constructor(elem, percentFunc) {
    const id = `element-loading-${String.random(7)}`;
    CustomEvent.all(this, 'termination');
    if (elem.style.position !== '' && elem.style.position !== 'relative')
      console.warn('Element Loading requires elem.style.position === "relitive"\n\tForcing this reality');
    elem.style.position = 'relative';
    const loadingElem = du.create.element('div', {id});
    elem.append(loadingElem);
    let originalStyle;
    const style = () => {
      const percent = percentFunc();
      const saved = du.style(loadingElem, {
            opacity: ((100 - percent)*.9 + 10) + '%',
            backgroundColor: 'blue',
            position: 'absolute',
            top:0,
            left:0,
            height: 100 + '%',
            width: percent + '%',
            borderRadius: '3pt'
      });
      originalStyle ||= saved;
      const terminate = percent >= 100;
      if (terminate) loadingElem.remove()
      return !terminate;
    }

    style.periodic(10);
  }
}

const startTime = new Date().getTime()
const percentFunc = (maxTime) => {
  const timeToComplete = (Math.random() * maxTime);
  return () => ((new Date().getTime() - startTime) / timeToComplete) * 100;
}
// Array.from(document.querySelectorAll('.object.selector')).forEach(elem =>
//   [1,2,3].forEach(i => new ElementLoading(elem, percentFunc(i*30000)))
// );

module.exports = ElementLoading;
