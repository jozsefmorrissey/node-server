
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
        return this;
      } else {
        return 'on' + name;
      }
    }

    this.remove = (func) =>
      watchers.remove(func);


    this.trigger = function (element, detail) {
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

CustomEvent.all = (obj, eventObject, ...eventNames) => {
  if (eventObject instanceof Object) {
    eventNames.concatInPlace(Object.keys(eventObject));
  } else {
    eventNames.push(eventObject);
    eventNames = eventNames.map(n => n.paths()).concatElements();
    eventObject = {};
  }
  if (obj.on === undefined) obj.property('on', {}, false);
  if (obj.trigger === undefined) obj.property('trigger', {}, false);
  if (obj.events === undefined) obj.property('events', {}, false);
  for (let index = 0; index < eventNames.length; index++) {
    const name = eventNames[index];
    const e = eventObject[name] || new CustomEvent(name);
    obj.events.property(name, e, true);
    if (obj.on[name] === undefined) obj.on.property(name, e.on, false);
    else obj.on[name](e.trigger);
    obj.trigger.property(name, (...args) => e.trigger.apply(e, args), false);
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

CustomEvent.shared = (...objects) =>
  objects.map(o => Object.keys(o.events)).concatElements().unique()
        .filter(name => !objects.find(o=> o.events[name] === undefined));

CustomEvent.collective = (objList, cyclical) => {
  console.warn.logarithmic('never actually used should be useful though');
  if (!Boolean.is(cyclical)) cyclical = true;
  const shared = CustomEvent.Shared(...objList);
  const events = shared.map(name => new CustomEvent(`collective:${name}`));
  const triggered = {};
  shared.forEach(name => {
    triggered[name] = Array.fill(objList.length, false);
    let details = [];
    objList.forEach((o,i) => {
      if (triggered[name] === null) return;
      o.on[name]((detail) => {
        details[i] = detail;
        triggered[name][i] = true;
        if (!triggered.find(false)) {
          triggered[name] = cyclical ? Array.fill(objList.length, false) : null;
          events[name].trigger(details, objList);
        }
      });
    });
  });
  return events;
}

CustomEvent.link = (target, linkedTo, cyclical, eventNames) => {
  console.warn.logarithmic('never actually used should be useful though');
  const isArray = Array.isArray(linkedTo);
  if (isArray) linkedTo.events = CustomEvent.collective(linkedTo, cyclical);
  const shared = isArray ? CustomEvent.shared(target, ...linkedTo) :
                            CustomEvent.shared(target, linkedTo);
  for (let index = 0; index < shared.length; index++) {
    const name = shared[index];
    (isArray ? linkedTo.events : linkedTo)
                          .on[name](setTimeout((...args) => target.trigger[name](...args), 0));
  }
}

if ((typeof module) !== 'undefined')
  module.exports = CustomEvent;
