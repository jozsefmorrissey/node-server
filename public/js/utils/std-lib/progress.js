const CustomEvent = require('../custom-event');

Progress = function (scope) {
    if (Number.isFinite(scope)) scope = {total: scope};
    let _percent = 0;
    const event = new CustomEvent('change');
    const func = (percent) => {
      if (Number.isFinite(percent) && percent >=0 && percent <= 1) {
        _percent = percent;
        event.trigger.change(func());
      }
      return scope.total ? Math.roundTo(_percent/scope.total, .01) : _percent;
    }
    func.inc = (inc) => {
      (_percent += (inc || 1));
      event.trigger(func(), scope);
      return func;
    }
    func.on = event.on;
    func.scope = scope;
    return func;
}
