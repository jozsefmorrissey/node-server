class CallbackTree {
  constructor(func, id, ...args) {
    let success, failure, root;
    this.name = id;
    let lastPath = '';
    this.getLastPath = function () {return lastPath;};
    const instance = this;
    function setLeaf(setFunc, target, func, id, ...args) {
      if ((target instanceof Error || (typeof target) === 'function') &&
            ((typeof func) === 'string' || func === undefined)) {
        args = [id].concat(args);
        id = func;
        func = target;
        target = undefined;
      }
      let leaf = instance.getRoot();
      if (target !== undefined) leaf = instance.find(target);
      const cbTree = new CallbackTree(func, id, ...args);
      cbTree.setRoot(instance.getRoot());
      leaf[setFunc](cbTree);
      return instance.getRoot();
    }

    function callbackFunction(callback) {
      return function () {
        if (callback instanceof CallbackTree) {
          callback.execute(...arguments);
        }
      }
    }
    this.addPath = function (value) {
      if (this.isRoot()) {
        lastPath += `${value}->`
      } else {
        instance.getRoot().addPath(instance.getId());
      }
    }

    this.setSuccess = function (successFunc) {success = successFunc};
    this.setFail = function (failFunc) {failure = failFunc};
    this.setArgs = function (...newArgs) {args = newArgs};
    this.execute = function () {
      if (instance.isRoot()) {
        lastPath = '';
        instance.addPath(instance.getId());
      }
      else {
        instance.addPath()
      }

      const tempArgs = arguments.length > 0 ? arguments : args;
      // console.log(`Executing CallbackTree '${instance.getRoot().getId()}' on leaf '${this.getId()}'.`);
      if (func instanceof Error) throw func;
      const successCallback = callbackFunction(success);
      successCallback.nam = success && success.name;
      const failureCallback = callbackFunction(failure);
      failureCallback.nam = failure && failure.name;
      func(...tempArgs, successCallback, failureCallback);
    }
    this.success = function (target, func, id, ...args) {
      return setLeaf('setSuccess', target, func, id, ...args);
    };
    this.getId = function () {return id || func.name;}

    this.fail = function (target, func, id, ...args) {
      return setLeaf('setFail', target, func, id, ...args);
    };

    this.find = function (stringOrFunc) {
      const found = instance.getRoot().findChild(stringOrFunc);
      if (found === undefined) throw new Error(`'${stringOrFunc}' not found within CallbackTree.`);
      return found;
    }
    this.setRoot = function (callbackTree) {
      if (!callbackTree instanceof CallbackTree) {
        throw new Error('The root of a CallbackTree must be another CallbackTree.');
      }
      root = callbackTree;
    }
    this.getRoot = function () {return root || instance;};
    this.isRoot = function () {return instance === instance.getRoot();};
    this.findChild = function (stringOrFunc) {
      let found;
      const idsMatch = (typeof stringOrFunc) === 'string' &&
                        id === stringOrFunc;
      const funcsMatch = (typeof stringOrFunc) === 'function' &&
                        func === stringOrFunc;;
      if (idsMatch || funcsMatch) {
        found = instance;
      }

      if (success)
        found = found || success.findChild(stringOrFunc);
      if (failure)
        found = found || failure.findChild(stringOrFunc);
      return found;
    }
  }
}

exports.CallbackTree = CallbackTree;
