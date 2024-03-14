
let domAccessible = false;

try {
  document;
  domAccessible = true;
} catch (e) {}




class CustomEvent {
  constructor(name) {
    const watchers = [];
    this.name = name;
    let lastArgs;

    const runFuncs = (elem, detail) =>
    watchers.forEach((func) => {
      try {
        func(elem, detail, event);
      } catch (e) {
        console.error(e);
      }
    });


    this.watchers = () => watchers;
    this.on = function (func) {
      if ((typeof func) === 'function') {
        if (lastArgs)
          func(...lastArgs);
        if (watchers.indexOf(func) === -1) watchers.push(func);
      } else {
        return 'on' + name;
      }
    }

    this.remove = (func) =>
      watchers.remove(func);


    this.trigger = function (element, detail) {
      lastArgs = [element, detail];
      element = element ? element : domAccessible ? window : detail;
      runFuncs(element, detail);
      event.detail = detail;
      if (domAccessible) {
        if (element instanceof HTMLElement) {
          if(document.createEvent){
            element.dispatchEvent(event);
          } else {
            element.fireEvent("on" + event.eventType, event);
          }
        }
      }
    }
//https://stackoverflow.com/questions/2490825/how-to-trigger-event-in-javascript
    let event;
    if (domAccessible) {
      if(document.createEvent){
        event = document.createEvent("HTMLEvents");
        event.initEvent(name, true, true);
        event.eventName = name;
      } else {
        event = document.createEventObject();
        event.eventName = name;
        event.eventType = name;
      }
    } else {
      event = {name, type: name};
    }
    this.event = event;
  }
}

CustomEvent.all = (obj, ...eventNames) => {
  if (obj.on === undefined) obj.on = {};
  if (obj.trigger === undefined) obj.trigger = {};
  if (obj.events === undefined) obj.events = {};
  for (let index = 0; index < eventNames.length; index++) {
    const name = eventNames[index];
    const e = new CustomEvent(name);
    obj.events[name] = e;
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

if ((typeof module) !== 'undefined')
  module.exports = CustomEvent;
