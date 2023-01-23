
const CustomEvent = require('../custom-event');

function searchAndConvert(obj, parentPath, beforeEvent, afterEvent) {
  const proxy = new Proxy(obj, {set: notify(parentPath, beforeEvent, afterEvent)});
  const keys = Object.keys(obj);
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const path = parentPath ? `${parentPath}.${key}` : key;
    if (obj[key] instanceof Object)
      obj[key] = new Notifiction(true, obj[key], path, beforeEvent, afterEvent);
  }
  return proxy;
}

function notify(parentPath, beforeEvent, afterEvent) {
  return (target, key, value) => {
    const change = target[key] !== value;
    const path = parentPath ? `${parentPath}.${key}` : key;
    if (change) {
      if (target.isRecusive() && value instanceof Object) value = new Notifiction(true, value, path, beforeEvent, afterEvent);
    }
    const detail = {target, path, old: target[key], new: value};
    if (change) beforeEvent.trigger(null, detail);
    target[key] = value;
    if (change) afterEvent.trigger(null, detail);
    return true;
  }
}

class Notifiction {
  constructor(recursive, object, path, beforeChangeEvent, afterChangeEvent) {
    path ||= '';
    const instance = this;
    afterChangeEvent ||= new CustomEvent('afterChange');
    beforeChangeEvent ||= new CustomEvent('beforeChange');
    let proxy;
    if (recursive) {
      proxy = searchAndConvert(object || this, path, beforeChangeEvent, afterChangeEvent);
    } else {
      proxy = new Proxy(object || this, {set: notify(path, beforeChangeEvent, afterChangeEvent)})
    }

    Object.defineProperty(proxy, "isRecusive", {
        writable: false,
        enumerable: false,
        configurable: false,
        value: () => recursive === true
    });
    Object.defineProperty(proxy, "onAfterChange", {
        writable: false,
        enumerable: false,
        configurable: false,
        value: afterChangeEvent.on
    });
    Object.defineProperty(proxy, "onBeforeChange", {
        writable: false,
        enumerable: false,
        configurable: false,
        value: beforeChangeEvent.on
    });
    Object.defineProperty(proxy, "deleteAll", {
        writable: false,
        enumerable: false,
        configurable: false,
        value: () => {
          const keys = Object.keys(instance);
          for (let index = 0; index < keys.length; index++) {
            delete instance[keys[index]];
          }
        }
    });

    return proxy;
  }
}

class NotifictionArray extends Notifiction {
  constructor(recursive, array, path, beforeChangeEvent, afterChangeEvent) {
    super(recursive, array || [], path, beforeChangeEvent, afterChangeEvent);
  }
}

const notifyArr = new Notifiction();
// notifyArr.onAfterChange(console.log);
// notifyArr.onBeforeChange(console.error);
notifyArr[4] = 'poop';
notifyArr.pickls = 5;
notifyArr[4] = 'y diapers';
notifyArr[0] = [];
notifyArr[0][69] = 'sooo fine'
notifyArr[0][6] = {}
notifyArr[0][6].punk = [1,2,3,4,66]
notifyArr[0][6].punk.skittles = 'taste the rainbow'
notifyArr[0][6].punk.skittles = 'uck!'

Notifiction.Array = NotifictionArray;
module.exports = Notifiction;
