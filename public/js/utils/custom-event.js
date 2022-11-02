



class CustomEvent {
  constructor(name, delay) {
    if (delay === undefined) delay = 20;
    const watchers = [];
    this.name = name;

    let lastTrigger;
    const runFuncs = (e, detail, time) => {
      if (lastTrigger === time || lastTrigger > new Date().getTime() - delay) {
        setTimeout(runFuncs, delay);
      } else {
        watchers.forEach((func) => func(e, detail));
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
      const time = new Date().getTime();
      runFuncs(element, detail, time);
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
