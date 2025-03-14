
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
          setTimeout(() => func(...lastArgs));
        if (watchers.indexOf(func) === -1) watchers.push(func);
        return this;
      } else {
        return 'on' + name;
      }
    }

    this.remove = (func) =>
      watchers.remove(func);


    this.trigger = async function (element, detail) {
      return new Promise(() => {
        lastArgs = [element, detail];
        element = element !== undefined ? element : domAccessible ? window : detail;
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
      });
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

CustomEvent.add = (obj, name, event) => {
  if (obj.events && obj.events[name]) return obj.events[name];
  if (obj.on === undefined) obj.property('on', {}, false);
  if (obj.trigger === undefined) obj.property('trigger', {}, false);
  if (obj.events === undefined) obj.property('events', {}, false);
  const e = event || new CustomEvent(name);
  if (!obj.events[name]) obj.events.property(name, e, true);
  if (!obj.events.LIST) obj.events.LIST = [];
  if (obj.on[name] === undefined) obj.on.property(name, e.on, false);
  else obj.on[name](e.trigger);
  obj.events.LIST.push(name);
  obj.trigger.property(name, (...args) => e.trigger.apply(e, args), false);
  return e;
}

// EventObject allows the same event to exist within multiple objects
//      i.e.  change) parent=>child=>child=>child.......
CustomEvent.all = (obj, eventObject, ...eventNames) => {
  if (eventObject instanceof Object) {
    eventNames.concatInPlace(Object.keys(eventObject));
  } else {
    eventNames.push(eventObject);
    eventNames = eventNames.map(n => n.paths()).concatElements();
    eventObject = {};
  }
  eventNames.sort();
  for (let index = 0; index < eventNames.length; index++) {
    const name = eventNames[index];
    const event = CustomEvent.add(obj, name, eventObject[name]);
    if (!obj.constructor.name.match(/Object|Function/)) {
      event.on(CustomEvent.add(obj.constructor, name).trigger);
    }
  }
}

CustomEvent.dynamic = () => {
  const events = {};
  return {
    on: (eventType, func) => CustomEvent.add(events, eventType).on(func),
    trigger: (event, detail) => {
      if (events[event.type] === undefined) return;
      events[event.type].trigger(event, detail);
    }
  }
}

CustomEvent.shared = (...objects) =>
  objects.map(o => Object.keys(o.events)).concatElements().unique()
        .filter(name => !objects.find(o=> o.events[name] === undefined));


if ((typeof module) !== 'undefined')
  module.exports = CustomEvent;
