
class CallbackTreeRootInvalid extends Error {
  constructor() {
    super(`The root of a CallbackTree must be another CallbackTree.`);
    this.name = "CallbackTreeRootInvalid";
  }
}

class CallbackTreeLeafNotDefined extends Error {
  constructor(root, leaf) {
    super(`Within CallbackTree '${root}' leaf '${leaf} does not exist.'`);
    this.name = "CallbackTreeLeafNotDefined";
  }
}

class CallbackTree {
  constructor(func, id, ...args) {
    if (func === undefined) throw new Error('func must be defined');
    let success, failure, root, resolve, promise;
    this.name = id;
    let lastPath = '';
    const instance = this;
    const terminationPoints = [];
    const references = {};

    this.getSuccess = () => success;
    this.getFail = () => failure;
    this.setRef = (key, value) => references[key] = value;
    this.getRef = (key) => references[key];

    function retInterface (inst) {
      const root = instance.getRoot();
      const success = root.success;
      const fail = root.fail;
      const execute = root.execute;
      const terminate = inst ? root.terminate(inst) : undefined;
      return {success, fail, execute, terminate};
    }

    this.terminate = function (cbTree, retValue) {
      if (arguments.length === 2) {
        if (terminationPoints.indexOf(cbTree) !== -1) {
          resolve(retValue);
        }
      } else {
        return function () {
          terminationPoints.push(cbTree);
          return retInterface();
        }
      }
    };

    this.getLastPath = function () {return lastPath;};
    this.getPromise = function () {return promise;};

    function setLeaf(setFunc, target, func, id, ...args) {
      if ((target instanceof Error || (typeof target) === 'function') &&
            ((typeof func) === 'string' || func === undefined)) {
        args = [id].concat(args);
        id = func;
        func = target;
        target = undefined;
      }
      let leaf = instance.getRoot();
      if (instance.find(id, true) !== undefined) throw new Error(`id '${id}' already exists within callback tree`);
      if (target !== undefined) leaf = instance.find(target);
      const cbTree = new CallbackTree(func, id, ...args);
      cbTree.setRoot(instance.getRoot());
      leaf[setFunc](cbTree);
      // console.log('leaf success', !leaf.getSuccess() ? undefined: leaf.getSuccess().name);
      // console.log('leaf fail', !leaf.getFail() ? undefined : leaf.getFail().name);
      return retInterface(cbTree);
    }

    function callbackFunction(callback) {
      if (callback instanceof CallbackTree) {
        return function () {
          callback.execute(...arguments);
        }
      } else {
        return undefined;
      }
    }
    this.addPath = function (value) {
      if (this.isRoot()) {
        lastPath += `${value}->`
      } else {
        instance.getRoot().addPath(instance.getId());
      }
    }

    function objectStrPath (obj, path) {
      path = path.split('.').filter((value) => value !== '' )
      for (let index = 0; index < path.length; index += 1) {
        if (obj === undefined) {
          return undefined;
        }
        obj = obj[path[index]]
      }
      return obj;
    }

    const argReg = /^\$cbtArg\[([0-9]*)\]((\.[a-zA-Z0-9\.]*|)$)/;
    const refReg = /^\$cbtArg\.([a-zA-Z0-9]*|)$/
    const refAssignReg = /^\$cbtArg\.([a-zA-Z0-9]*|) = \$cbtArg\[([0-9]*)\]((\.[a-zA-Z0-9\.]*|)$)/
    function renderArg(tempArgs, args, index) {
      const arg = args[index];
      if ((typeof arg) !== 'string') return args[index];
      let match = arg.match(argReg);
      if (match) {
        return objectStrPath(tempArgs[match[1]], match[2]);
      }

      match = arg.match(refReg)
      if (match) {
        return instance.getRoot().getRef(match[1]);
      }

      match = arg.match(refAssignReg);
      if (match) {
        const value = objectStrPath(tempArgs[match[2]], match[3]);
        instance.getRoot().setRef(match[1], value);
        return value;
      }

      return args[index];
    }

    this.setSuccess = function (successFunc) {success = successFunc};
    this.setFail = function (failFunc) {failure = failFunc};
    this.setArgs = function (...newArgs) {args = newArgs};
    this.execute = function () {
      if (instance.isRoot()) {
        lastPath = '';
        promise = new Promise(r => resolve = r)
        instance.addPath(instance.getId());
      } else {
        instance.addPath()
      }

      let tempArgs = Array.from(arguments);
      if (args.length > 0 && args[0] !== undefined) {
        tempArgs = [];
        Array.from(args).map(
          (value, index) => tempArgs.push(renderArg(arguments, args, index)));
      }
      // console.log(`Executing CallbackTree '${instance.getRoot().getId()}' on leaf '${instance.getId()}'.`);
      const rt = instance.getRoot();
      if (func instanceof Error) throw func;
      else if((typeof func) === 'string') func = instance.find(func);
      else {
        const successCallback = callbackFunction(success);
        const failureCallback = callbackFunction(failure);
        let retVal;
        if (successCallback && failureCallback) {
          retVal = func(...tempArgs, successCallback, failureCallback);
        } else if (failureCallback) {
          retVal = func(...tempArgs, undefined, failureCallback);
        } else if (successCallback) {
          retVal = func(...tempArgs, successCallback);
        } else {
          retVal = func(...tempArgs);
        }

        rt.terminate(instance, retVal);
        return rt.getPromise();
      }
    }
    this.success = function (target, func, id, ...args) {
      return setLeaf('setSuccess', target, func, id, ...args);
    };
    this.getId = function () {return id || func.name;}

    this.fail = function (target, func, id, ...args) {
      return setLeaf('setFail', target, func, id, ...args);
    };

    this.find = function (stringOrFunc, soft) {
      const found = instance.getRoot().findChild(stringOrFunc);
      // console.log('looking for:', stringOrFunc, ' found:', found);
      if (!soft && found === undefined) throw new CallbackTreeLeafNotDefined(instance.getRoot, stringOrFunc);
      return found;
    }
    this.setRoot = function (callbackTree) {
      if (!callbackTree instanceof CallbackTree) {
        throw new CallbackTreeRootInvalid();
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
