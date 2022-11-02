
const CustomEvent = require('../custom-event');

function notify(parentPath, beforeEvent, afterEvent) {
  return (target, key, value) => {
    const change = target[key] !== value;
    const path = parentPath ? `${parentPath}.${key}` : key;
    if (change) {
      if (Array.isArray(value)) value = new NotifictionArray(path, beforeEvent, afterEvent, value);
      else if (value instanceof Object) value = new Notifiction(path, beforeEvent, afterEvent, value);
    }
    const detail = {target, path, old: target[key], new: value};
    if (change) beforeEvent.trigger(null, detail);
    target[key] = value;
    if (change) afterEvent.trigger(null, detail);
    return true;
  }
}

class Notifiction {
  constructor(path, beforeChangeEvent,  afterChangeEvent, object) {
    path ||= '';
    afterChangeEvent ||= new CustomEvent('afterChange');
    beforeChangeEvent ||= new CustomEvent('beforeChange');
    Object.merge(this, object);

    this.onBeforeChange = beforeChangeEvent.on;
    this.onAfterChange = afterChangeEvent.on;

    return new Proxy(this, {set: notify(path, beforeChangeEvent, afterChangeEvent)});
  }
}

class NotifictionArray extends Array {
  constructor(path, beforeChangeEvent, afterChangeEvent, array) {
    super();
    path ||= '';
    afterChangeEvent ||= new CustomEvent('afterChange');
    beforeChangeEvent ||= new CustomEvent('beforeChange');
    Object.merge(this, array);

    this.onBeforeChange = beforeChangeEvent.on;
    this.onAfterChange = afterChangeEvent.on;

    return new Proxy(this, {set: notify(path, beforeChangeEvent, afterChangeEvent)});
  }
}

Notifiction.Array = NotifictionArray;
module.exports = Notifiction;
