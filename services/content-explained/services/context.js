
const { DebugGuiClient } = require('../../debug-gui/public/js/debug-gui-client');
const { CallbackTree } = require('./callbackTree');

class Context {
  constructor(req, res, next) {
    const instance = this;
    const id = Math.floor(Math.random() * 1000000);
    function cbTreeDgLogger(info) {
      instance.dg.value(`CallbackTrees.${info.rootId} - ${info.instId}.${info.id}`,
            info.key, info.value);
    }

    this.callbackTree = function () {
      return new CallbackTree(...arguments)
          .setContext(id).setDebug(this.dg.isDebugging()).setLogger(this.cbtLogger);
    }

    this.getId = () => id;
    this.dg = DebugGuiClient.express(req, 'ce-server');
    this.cbtLogger = this.dg.isDebugging() ? cbTreeDgLogger : undefined;
    if (global.ENV !== 'prod') this.dg.insecure();
    if (req) req.ceContextId = id;
    if (res) res.ceContextId = id;
    if (next) next.ceContextId = id;
    this.created = new Date().getTime();
    Context.open[id] = this;
  }
}

Context.open = {};
Context.default = new Context()
Context.fromReq = (req) => Context.open[req.ceContextId] || Context.default;
Context.fromRes = Context.fromReq;
Context.fromFunc = (func) => Context.open[func.cbTreeContext] || Context.default;
Context.fromCbTree = (cbTree) => Context.open[cbTree.getContext()] || Context.default;

exports.Context = Context;
