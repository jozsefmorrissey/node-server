



class CustomEvent {
  constructor(name) {
    const watchers = [];
    this.name = name;

    const runFuncs = (detail) => watchers.forEach((func) => func(detail));

    this.on = function (func) {
      if ((typeof func) === 'function') {
        watchers.push(func);
      } else {
        return 'on' + name;
      }
    }

    this.trigger = function (detail) {
      runFuncs(detail);
    }

    this.event;
  }
}

if ((typeof module) !== 'undefined')
  module.exports = CustomEvent;
