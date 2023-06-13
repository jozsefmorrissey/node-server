



class CustomEvent {
  constructor(name) {
    const watchers = [];
    this.name = name;

    const runFuncs = (elem, detail) =>
    watchers.forEach((func) => {
      try {
        func(elem, detail);
      } catch (e) {
        console.error(e);
      }
    });


    this.watchers = () => watchers;
    this.on = function (func) {
      if ((typeof func) === 'function') {
        watchers.push(func);
      } else {
        return 'on' + name;
      }
    }

    this.trigger = function (element, detail) {
      element = element ? element : window;
      runFuncs(element, detail);
      this.event.detail = detail;
      if (element instanceof HTMLElement) {
        if(document.createEvent){
          element.dispatchEvent(this.event);
        } else {
          element.fireEvent("on" + this.event.eventType, this.event);
        }
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

CustomEvent.all = (obj, ...eventNames) => {
  if (obj.on === undefined) obj.on = {};
  if (obj.trigger === undefined) obj.trigger = {};
  for (let index = 0; index < eventNames.length; index++) {
    const name = eventNames[index];
    const e = new CustomEvent(name);
    obj.on[name] = e.on;
    obj.trigger[name] = (...args) => e.trigger.apply(e, args);
  }
}

CustomEvent.dynamic = () => {
  const events = {};
  return {
    on: (eventType, func) => {
      if (events[eventType] === undefined)
        events[eventType] = new CustomEvent(eventType);
      events[eventType].on(func);
    },
    trigger: (event, detail) => {
      if (events[event.type] === undefined) return;
      events[event.type].trigger(event, detail);
    }
  }
}

module.exports = CustomEvent;
