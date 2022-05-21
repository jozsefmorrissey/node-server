const DebugGuiClient = require('../services/debug-gui/public/js/debug-gui-client');
// const { CallbackTree } = require('./callbackTree');

const pathReg = /^\/(.*?)(\/[^?]*)(\?.*|)$/;
class Context {
  constructor(req, res, next) {
    const instance = this;
    Context.count++;
    Context.count = Context.count % 100;
    const id = Context.count;
    function cbTreeDgLogger(info) {
      instance.dg.value(`CallbackTrees.${info.rootId} - ${info.instId}.${info.id}`,
            info.key, info.value);
    }

    this.callbackTree = function () {
      return new CallbackTree(...arguments)
          .setContext(id).setDebug(instance.dg.isDebugging())
          .setLogger(instance.cbtLogger);
    }

    this.getId = () => id;
    const match = req.url.match(pathReg);
    const callId = match ? `${match[1]}.requests.${match[2]} ${req.method} (${id})` : req.url;
    this.dg = DebugGuiClient.express(req, callId);
    this.dg.object('parameters', req.query || {});
    this.dg.object('body', req.body || {});
    this.cbtLogger = this.dg.isDebugging() ? cbTreeDgLogger : undefined;
    if (global.ENV !== 'prod') this.dg.insecure();
    if (req) req.contextId = id;
    if (res) res.contextId = id;
    if (next) next.contextId = id;
    this.created = new Date().getTime();
    Context.open[id] = this;
  }
}

Context.count = 0;
Context.open = {};
Context.fromReq = (req) => Context.open[req.contextId];
Context.fromRes = Context.fromReq;
Context.fromFunc = (func) => {
  if ((typeof func) === 'function') {
    return Context.open[func.cbTreeContext] || Context.default
  }
  return Context.default;
};
// Context.fromCbTree = (cbTree) => Context.open[cbTree.getContext()] || Context.default;

module.exports = Context;
