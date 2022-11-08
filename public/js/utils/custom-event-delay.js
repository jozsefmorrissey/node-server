



class CustomEvent {
  constructor(name, delay) {
    if (delay === undefined) delay = 0;
    let triggerId = 0;
    const watchers = [];
    this.name = name;

    let lastTriggerTime;
    let lastTriggerId;
    const runFuncs = (e, detail, tId) => {
      const time = new Date().getTime();
      if (lastTriggerId === tId ) {
        if (lastTriggerTime + delay < time) {
          watchers.forEach((func) => func(e, detail));
        } else {
          setTimeout(() => {
            runFuncs(e, detail, tId);
          }, delay);
        }
      }
    }

    this.on = function (func) {
      if ((typeof func) === 'function') {
        watchers.push(func);
      } else {
        return 'on' + name;
      }
    }

    this.trigger = function (element, detail) {
      element = element ? element : window;
      lastTriggerTime = new Date().getTime();
      const tId = triggerId + 1;
      triggerId += 1;
      lastTriggerId = tId;
      runFuncs(element, detail, tId);
      this.event.detail = detail;
      if(document.createEvent){
          element.dispatchEvent(this.event);
      } else {
          element.fireEvent("on" + this.event.eventType, this.event);
      }
    }
//https://stackoverflow.com/questions/2490825/how-to-trigger-event-in-javascript
    this.event;
    if(document.createEvent){
        this.event = document.createEvent("HTMLEvents");
        this.event.initEvent(name, true, true);
        this.event.eventName = name;
    } else {
        this.event = document.createEventObject();
        this.event.eventName = name;
        this.event.eventType = name;
    }
  }
}

module.exports = CustomEvent;
